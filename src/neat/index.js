// TODO: Normalisation of Novelty Search objectives
const { EventEmitter } = require("events");
const fs = require("fs");
const { Neat, methods, architect } = require("neataptic");
const os = require("os");
const { Worker, MessageChannel } = require("worker_threads");

const GBOS = require("GBOS-js");
const noveltySearch = require("./noveltySearch");

const phonetic = require("phonetic");
const table = require("table");

const crypto = require("crypto");

const histc = require("histc");

const normaliseFunctions = {
  percentageChangeLog2: require("./normFuncs").percentChange
    .percentageChangeLog2
};

const ArrayUtils = require("../lib/array");
const {
  traderConfig,
  indicatorConfig,
  neatConfig
} = require("../config/config");
const DataManager = require("../dataManager");
const Logger = require("../logger");

// eww

const mutation = methods.mutation;

mutation.SWAP_NODES.mutateOutput = false;

const mutations = [
  mutation.ADD_NODE,
  mutation.SUB_NODE,

  mutation.ADD_CONN,
  mutation.SUB_CONN,

  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.MOD_ACTIVATION,

  mutation.ADD_GATE,
  mutation.SUB_GATE,

  mutation.ADD_SELF_CONN,
  mutation.SUB_SELF_CONN,

  mutation.ADD_BACK_CONN,
  mutation.SUB_BACK_CONN,

  mutation.SWAP_NODES
];

const NeatTrainer = {
  init: function({ exchange, pair, type, length, dataDir, dbExt }) {
    this.dataManager = Object.create(DataManager);
    this.dataManager.init(exchange, dataDir, dbExt);
    this.neatConfig = neatConfig;
    this.indicatorConfig = indicatorConfig;
    this.generation = 0;
    this.highScore = -Infinity;
    this.pair = pair;
    this.type = type;
    this.length = length;
    this.eventEmitter = new EventEmitter();

    this.candidatePopulation = [];
    this.noveltySearchArchive = [];
    this.parentPopulation = [];

    this.workers = Array(
      parseInt(process.env.THREADS) || os.cpus().length
    ).fill(null);
    this.data = this.dataManager.checkDataExists(pair, type, length)
      ? this.dataManager.loadData(pair, type, length, indicatorConfig)
      : [];
  },

  mutate: function(genome) {
    if (Math.random() <= this.neat.mutationRate) {
      for (var j = 0; j < this.neat.mutationAmount; j++) {
        var mutationMethod = this.neat.selectMutationMethod(genome);
        genome.mutate(mutationMethod);
      }
    }
    return genome;
  },

  breed: function() {
    let getUniqueOffspring = () => {
      while (true) {
        const offspring = this.mutate(this.neat.getOffspring());
        offspring.hash = parseInt(
          crypto
            .createHash("md5")
            .update(JSON.stringify(offspring.toJSON()))
            .digest("hex"),
          16
        );
        if (
          !this.parentPopulation.some(genome => offspring.hash === genome.hash)
        ) {
          return offspring;
        }
      }
    };

    this.neat.population = new Array(this.neat.popsize)
      .fill(null)
      .map(getUniqueOffspring);

    if (this.neatConfig.discardDuplicateGenomes) {
      this.neat.population = this.neat.population.filter((genome1, index) =>
        this.neat.population.some(
          (genome2, index2) =>
            !(index2 > index && genome1.hash === genome2.hash)
        )
      );
    }

    let displayPopulationStats = genomes => {
      const tableOptions = {
        columnDefault: {
          paddingLeft: 0,
          paddingRight: 0
        },
        border: table.getBorderCharacters(`void`),
        columnDefault: {
          alignment: "right"
        },
        drawHorizontalLine: (index, size) => {
          return index < 1 || index === size;
        }
      };

      const header = [
        "Gen " + this.generation,
        "  ",
        "Profit",
        "RTs",
        "Win%",
        "  ",
        "Profit",
        "RTs",
        "Win%",
        " ",
        "Name"
      ];

      let sign = value =>
        Number(value) > 0 ? "+" + Number(value) : Number(value);

      const d = genomes.map((g, index) => {
        return [
          g.generation,
          "Train".charAt(index),
          sign((100 * g.stats.profit).toFixed(1)) + "%",
          g.stats.RTs.toFixed(2),
          (100 * g.stats.winRate).toFixed(2),
          "Test".charAt(index),
          sign((100 * g.testStats.profit).toFixed(2)) + "%",
          g.testStats.RTs.toFixed(2),
          (100 * g.testStats.winRate).toFixed(1),
          " ",
          g.name
        ];
      });

      if (d.length) {
        table
          .table([[...header], ...d], tableOptions)
          .slice(1, -1)
          .split("\n")
          .forEach(Logger.debug);
      } else {
        Logger.debug(`No candidates found in generation ${this.generation}`);
      }
    };
    {
      this.eventEmitter.emit("update", {
        generation: this.generation,
        candidates: this.candidatePopulation,
        parents: this.parentPopulation
      });
      displayPopulationStats(this.candidatePopulation.slice(0, 8));
      if (!this.candidatePopulation.length) {
        Logger.debug("Meanwhile in general population");
        displayPopulationStats(this.parentPopulation.slice(0, 8));
      }
    }
  },

  getEventEmitter: function() {
    return this.eventEmitter;
  },

  nameGenomes: function() {
    const date = Date.now();
    this.neat.population.forEach(genome => {
      const gstr = JSON.stringify(genome.toJSON());
      genome.name =
        phonetic.generate({
          seed: gstr,
          syllables: 2 + (gstr.length % 2)
        }) +
        "-" +
        phonetic.generate({
          seed: date + JSON.stringify(this.generation),
          syllables: 2 + (this.generation % 2)
        });
    });
  },

  saveCandidateGenomes: function() {
    this.candidatePopulation.forEach(genome => {
      const safePairName = this.pair.replace(/[^a-z0-9]/gi, "");
      const filename = `${safePairName}_${this.type}_${this.length}_PnL_${(
        genome.testStats.profit * 100
      ).toFixed(2)}_WR_${(genome.testStats.winRate * 100).toFixed(2)}_(${
        genome.name
      })`;
      const dir = `${__dirname}/../../genomes/${safePairName}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      if (!fs.existsSync(`${dir}/${filename}`)) {
        const data = {
          genome: genome.toJSON(),
          trainStats: genome.trainStats,
          testStats: genome.testStats,
          traderConfig,
          indicatorConfig,
          neatConfig
        };
        fs.writeFileSync(`${dir}/${filename}`, JSON.stringify(data));
      }
    });
  },

  evaluate: function(results) {
    this.nameGenomes();

    results.forEach(({ trainStats, testStats, id }) => {
      let genome = this.neat.population[id];
      genome.stats = trainStats;
      genome.testStats = testStats;
      genome.noveltySearchObjectives = this.neatConfig.noveltySearchObjectives.map(
        objective => trainStats[objective]
      );
      genome.candidateSortingObjectives = this.neatConfig.candidateSortingCriteria
        .map(objective => [-testStats[objective], -trainStats[objective]])
        .reduce((acc, val) => [...acc, ...val], []);
    });

    // process candidate population
    // TODO: would prefer hash comparisons of genomes instead

    this.candidatePopulation = [
      ...this.candidatePopulation,
      ...this.neat.population.filter(genome1 => {
        return !this.candidatePopulation.some(
          genome2 => genome1.hash === genome2.hash
        );
      })
    ];

    const candidatesToSort = this.candidatePopulation.map(
      genome => genome.candidateSortingObjectives
    );

    GBOS(candidatesToSort).forEach((rank, index) => {
      this.candidatePopulation[index].rank = rank;
    });

    this.candidatePopulation.sort((a, b) => a.rank - b.rank);
    this.candidatePopulation.length = this.neatConfig.candidatePopulationSize;

    this.candidatePopulation = this.candidatePopulation.filter(
      genome => genome.stats.OK == true && genome.testStats.OK == true
    );

    // perform novelty search & sorting
    // merging parent population with current generation population guarantees elitism

    this.neat.population = [...this.neat.population, ...this.parentPopulation];

    const nsObj = this.neat.population.map(
      genome => genome.noveltySearchObjectives
    );

    const archive = this.noveltySearchArchive.map(
      genome => genome.noveltySearchObjectives
    );

    const novelties = noveltySearch(
      nsObj,
      archive,
      this.neatConfig.noveltySearchDistanceOrder || 2
    );

    this.neat.population.forEach((genome, index) => {
      genome.stats.novelty = novelties[index];
      if (!genome.sortingObjectives) {
        genome.sortingObjectives = this.neatConfig.sortingObjectives.map(
          objective => -results[index].trainStats[objective]
        ); // maximization of objectives requires a sign flip here
      }
    });

    const toSort = this.neat.population.map(genome => genome.sortingObjectives);
    GBOS(toSort).forEach((rank, index) => {
      this.neat.population[index].score =
        this.neat.population[index].stats.RTs > 0 &&
        this.neat.population[index].testStats.RTs > 0
          ? -rank
          : -Infinity;

      this.neat.population[index].rank = rank;
    });

    this.neat.sort();

    for (let i = 0; i < this.neatConfig.noveltySearchAddRandom; i++) {
      this.noveltySearchArchive.push(
        this.neat.population[
          Math.floor(Math.random() * this.neat.population.length)
        ]
      );
    }

    for (let i = 0; i < this.neatConfig.noveltySearchAddFittest; i++) {
      this.noveltySearchArchive.push(this.neat.population[i]);
    }

    this.neat.population.length = this.neatConfig.populationSize;
    this.parentPopulation = this.neat.population;
  },

  getNormalisedData: function() {
    //A little extra gymnastics because the candle data is an array of arrays. I considered
    //changing it to an object like {opens: [...], highs: [...]....} but the trade off is
    //the loss of js array functions like map, reduce etc.. without munging up the data more.
    //In the end I think this is actually cleaner even though it's not exactly clean.
    const dataToIndex = {
      opens: 0,
      highs: 1,
      lows: 2,
      closes: 3,
      volumes: 4,
      startTime: 5
    };

    //This only works for norm funcs that don't need additional data stored at the moment.
    //High Low for example needs the min and max that was used to normalise the data. I need
    //to workout how I would want to store that and save it for later in an extendable way.
    const normalisedCandleData = this.neatConfig.inputs.map(
      ({ name, normFunc }) =>
        normaliseFunctions[normFunc](this.data[dataToIndex[name]])
    );
    const normalisedIndicatorData = this.data.slice(6).map((array, index) => {
      const { normFunc } = indicatorConfig[index];
      return normaliseFunctions[normFunc](array);
    });

    return [...normalisedCandleData, ...normalisedIndicatorData];
  },

  train: async function() {
    //Really considering abstracting the worker log it some where else. It doesn't really belong here.
    this.neat.population.forEach((genome, i) => {
      genome.id = i;
      genome.clear();
      genome.generation = this.generation;
    });

    const chunkedPop = ArrayUtils.chunk(
      this.neat.population,
      Math.ceil(this.neat.population.length / this.workers.length)
    );

    const work = chunkedPop.map((chunk, i) => {
      return new Promise((resolve, reject) => {
        const genomes = chunk.map(genome => ({
          genome: genome.toJSON(),
          id: genome.id
        }));

        const { port1, port2 } = new MessageChannel();
        this.workers[i].postMessage({ port: port1 }, [port1]);
        port2.postMessage(genomes);

        port2.on("message", data => {
          resolve(data);
          port2.close();
        });
        port2.on("error", err => {
          Logger.error(`Worker thread error ${err}`);
          reject(err);
        });
      });
    });

    let results = ArrayUtils.flatten(await Promise.all(work));
    this.evaluate(results);
  },

  histogram: function() {
    const data = ArrayUtils.flatten(
      [0, 1, 2, 3].map(index =>
        normaliseFunctions["percentageChangeLog2"](this.data[index])
      )
    );

    // const min = data.reduce((acc,val) => Math.min(acc,val), Infinity)
    // const max = data.reduce((acc,val) => Math.max(acc,val), -Infinity)

    const min = -0.02;
    const max = 0.02;

    const width = 20;
    const height = 20;

    const edges = new Array(width)
      .fill(0)
      .map((_, index) => min + (index * (max - min)) / width);

    const histogram = histc(data, edges);
    const maxCount = histogram.reduce(
      (acc, val) => Math.max(acc, val),
      -Infinity
    );

    Logger.debug(
      `Histogram samples: ${data.length}, display range: ]${min}...${max}[`
    );
    Array(histogram.length - 1)
      .fill(0)
      .forEach((_, v) => {
        const edge = edges[v].toFixed(2);
        const histoString = Array(
          Math.round((width * histogram[v + 1]) / maxCount)
        )
          .fill("#")
          .reduce((acc, val) => acc + val, []);
        Logger.debug(`${histoString}`);
      });

    return { histogram, edges };
  },

  start: async function() {
    Logger.info("Starting genome search");

    // this.histogram();
    this.normalisedData = this.getNormalisedData();

    if (this.normalisedData.length) {
      Logger.debug(
        `Creating a new population. I/O size: ${this.normalisedData.length}/${
          this.neatConfig.outputSize
        }`
      );
      this.neat = new Neat(this.normalisedData.length, 1, null, {
        mutation: mutations,
        popsize: this.neatConfig.populationSize,
        mutationRate: this.neatConfig.mutationRate,
        mutationAmount: this.neatConfig.mutationAmount,
        selection: methods.selection.TOURNAMENT,
        network: new architect.Random(
          this.normalisedData.length,
          1,
          this.neatConfig.outputSize
        ),
        clear: true
      });

      this.neat.mutate();
    }

    //Split data into 65% train, 5% gap, 30% test
    const trainAmt = Math.trunc(
      this.normalisedData[0].length * this.neatConfig.trainAmt
    );
    const gapAmt = Math.trunc(
      this.normalisedData[0].length * this.neatConfig.gapAmt
    );
    this.trainData = this.normalisedData.map(array => array.slice(0, trainAmt));
    this.testData = this.normalisedData.map(array =>
      array.slice(trainAmt + gapAmt)
    );

    this.trainDataRaw = this.data.map(array => array.slice(0, trainAmt));
    this.testDataRaw = this.data.map(array => array.slice(trainAmt + gapAmt));

    let testTheData = data => !data.every(d => d.every(val => 0 === val));

    const sanityTestResult = [
      this.trainDataRaw,
      this.testDataRaw,
      this.trainData,
      this.testData
    ].every(testTheData)
      ? "OK"
      : "Not OK";

    Logger.debug(`Data sanity check: ${sanityTestResult}`);

    const workerData = {
      trainDataRaw: this.trainDataRaw,
      trainData: this.trainData,
      testDataRaw: this.testDataRaw,
      testData: this.testData,
      traderConfig
    };

    this.workers = this.workers.map(() => {
      const newWorker = new Worker("./src/tradeWorker/index.js", {
        workerData
      });

      newWorker.on("exit", code => {
        if (code !== 0) {
          throw new Error(`Worker stopped with exit code ${code}`);
        }
      });

      return newWorker;
    });

    let span = arr =>
      (arr[arr.length - 1] - arr[0]) / (1000 * 60 * 60 * 24 * (365 / 12));

    const trainTimeSpan = span(this.trainDataRaw[5]);
    const testTimeSpan = span(this.testDataRaw[5]);

    Logger.debug(`Training time span: ${trainTimeSpan.toFixed(2)} months`);
    Logger.debug(`Testing time span: ${testTimeSpan.toFixed(2)} months`);

    while (true) {
      this.generation++;
      await this.train();
      this.saveCandidateGenomes();
      this.breed();
    }
  }
};

module.exports = NeatTrainer;

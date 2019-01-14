// TODO: Normalisation of Novelty Search objectives
const assert = require("assert");
const crypto = require("crypto");
const { EventEmitter } = require("events");
const fs = require("fs");
const GBOS = require("GBOS-js");
const histc = require("histc");
const { Neat, methods, architect } = require("neataptic");
const noveltySearch = require("./noveltySearch/index.js");
const os = require("os");
const phonetic = require("phonetic");
const displayStats = require("./displayDebugStats");

const { Worker, MessageChannel } = require("worker_threads");

const normaliseFunctions = {
  percentageChangeLog2: require("./normFuncs").percentChange
    .percentageChangeLog2
};

// console.log(normaliseFunctions)

const ArrayUtils = require("../lib/array");
const {
  traderConfig,
  indicatorConfig,
  neatConfig
} = require("../config/config");
const DataManager = require("../dataManager");
const { Logger } = require("../logger");

// eww

const mutation = methods.mutation;

// mutation.SWAP_NODES.mutateOutput = false;

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
  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
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
          !this.parentPopulation.some(({ hash }) => offspring.hash === hash)
        ) {
          return offspring;
        }
      }
    };

    this.neat.population = new Array(this.neat.popsize)
      .fill(null)
      .map(getUniqueOffspring);

    if (this.neatConfig.discardDuplicateGenomes) {
      this.neat.population = this.neat.population.filter(
        ({ hash: hash1 }, index) =>
          this.neat.population.some(
            ({ hash }, index2) => !(index2 > index && hash1 === hash)
          )
      );
    }

    this.eventEmitter.emit("update", {
      generation: this.generation,
      candidates: this.candidatePopulation,
      parents: this.parentPopulation
    });

    if (this.candidatePopulation.length) {
      Logger.debug(`Candidates: ${this.candidatePopulation.length}`);
      displayStats(this.candidatePopulation.slice(0, 8), this.generation);
    }
    displayStats(
      this.parentPopulation.slice(
        0,
        16 - Math.min(8, this.candidatePopulation.length)
      ),
      this.generation
    );
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
      ).toFixed(4)}_WR_${(genome.testStats.winRate * 100).toFixed(4)}`;
      const dir = `${__dirname}/../../genomes/${safePairName}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      if (!fs.existsSync(`${dir}/${filename}`)) {
        const data = {
          genome: genome.toJSON(),
          trainStats: genome.stats,
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
    // console.log(results)
    this.nameGenomes();

    results.forEach(({ trainStats, testStats, id }) => {
      let genome = this.neat.population[id];
      genome.stats = trainStats;
      genome.testStats = testStats;
      genome.stats.OK2 = Number(testStats.OK & trainStats.OK);
      genome.stats.v2mean =
        (genome.stats.v2ratio + genome.testStats.v2ratio) / 2;
      genome.stats.v2deviation = -Math.sqrt(
        Math.pow(genome.stats.v2mean - genome.stats.v2ratio, 2) +
          Math.pow(genome.stats.v2mean - genome.testStats.v2ratio, 2)
      );
      genome.stats.v2bal =
        genome.stats.OK2 /
        (1 + Math.abs(genome.stats.v2ratio - genome.testStats.v2ratio));
      // make this conditional, setup in config
      {
        let validateObjectives = (objs, stats) =>
          objs.forEach(obj =>
            assert(!isNaN(stats[obj]) && stats[obj] !== undefined)
          );
        [
          [this.neatConfig.noveltySearchObjectives, trainStats],
          [this.neatConfig.sortingObjectives, trainStats],
          [this.neatConfig.candidateSortingCriteria, trainStats],
          [this.neatConfig.candidateSortingCriteria, testStats],
          [this.neatConfig.localCompetitionObjectives, trainStats]
        ].forEach(([obj, stats]) => validateObjectives(obj, stats));
      }

      genome.noveltySearchObjectives = this.neatConfig.noveltySearchObjectives.map(
        objective => trainStats[objective]
      );
      genome.candidateSortingObjectives = this.neatConfig.candidateSortingCriteria
        .map(objective => [-testStats[objective], -trainStats[objective]])
        .reduce((acc, val) => [...acc, ...val], []);
      genome.localCompetitionObjectives = this.neatConfig.localCompetitionObjectives.map(
        objective => trainStats[objective]
      );
    });

    // process candidate population

    this.candidatePopulation = [
      ...this.candidatePopulation,
      ...this.neat.population.filter(
        genome =>
          !this.candidatePopulation.some(({ hash }) => genome.hash === hash) &&
          genome.stats.OK2
      )
    ];

    if (this.candidatePopulation.length) {
      const candidatesToSort = ArrayUtils.getProp(
        "candidateSortingObjectives",
        this.candidatePopulation
      );
      GBOS(candidatesToSort).forEach((rank, index) => {
        this.candidatePopulation[index].rank = rank;
      });

      this.candidatePopulation.sort((a, b) => a.rank - b.rank);

      this.candidatePopulation.length = Math.min(
        this.neatConfig.candidatePopulationSize,
        this.candidatePopulation.length
      );
    }

    // perform novelty search & sorting
    // merging parent population with current generation population guarantees elitism

    this.neat.population = [...this.parentPopulation, ...this.neat.population];

    /*    const index =  Math.floor(Math.random()*this.parentPopulation.length)
    this.neat.population = 
    [
      ...this.neat.population,
      ...this.parentPopulation.splice(index),
      ...this.parentPopulation.splice(0,index)
    ]*/

    const nsObj = ArrayUtils.getProp(
      "noveltySearchObjectives",
      this.neat.population
    );
    const nsArchive = ArrayUtils.getProp(
      "noveltySearchObjectives",
      this.noveltySearchArchive
    );

    const lcObj = ArrayUtils.getProp(
      "localCompetitionObjectives",
      this.neat.population
    );
    const lcArchive = ArrayUtils.getProp(
      "localCompetitionObjectives",
      this.noveltySearchArchive
    );

    const { novelties, lcs } = noveltySearch(
      nsObj,
      nsArchive,
      lcObj,
      lcArchive,
      { p: this.neatConfig.noveltySearchDistanceOrder }
    );

    this.neat.population.forEach((genome, index) => {
      genome.stats.novelty = novelties[index];
      genome.stats.lcs = lcs[index];
      genome.sortingObjectives = [
        ...this.neatConfig.sortingObjectives.map(
          objective => -genome.stats[objective]
        ),
        ...lcs[index].map(value => -value)
      ];
    });

    const toSort = ArrayUtils.getProp(
      "sortingObjectives",
      this.neat.population
    );
    const sorted = GBOS(toSort);
    sorted.forEach((rank, index) => {
      const genome = this.neat.population[index];
      genome.score = -rank; // + genome.stats.lcs[0]
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
    const last = Object.values(dataToIndex).reduce((acc, val) =>
      Math.max(acc, val)
    );
    const normalisedIndicatorData = this.data
      .slice(last + 1)
      .map((array, index) => {
        const { normFunc } = indicatorConfig[index];
        return normFunc ? normaliseFunctions[normFunc](array) : array;
      });

    return [...normalisedCandleData, ...normalisedIndicatorData];
  },

  train: async function() {
    //Really considering abstracting the worker log it some where else. It doesn't really belong here.
    this.neat.population.forEach((genome, i) => {
      genome.id = i;
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

    this.normalisedData = this.getNormalisedData();

    if (this.normalisedData.length) {
      Logger.debug(
        `Creating a new population. I/O size: ${this.normalisedData.length}/${
          this.neatConfig.outputSize
        }`
      );
      this.neat = new Neat(
        this.normalisedData.length,
        this.neatConfig.outputSize,
        null,
        {
          mutation: mutations,
          popsize: this.neatConfig.populationSize,
          mutationRate: this.neatConfig.mutationRate,
          mutationAmount: this.neatConfig.mutationAmount,
          selection: methods.selection.TOURNAMENT,
          network: new architect.Random(
            this.normalisedData.length,
            0,
            this.neatConfig.outputSize
          ),
          clear: true
        }
      );

      this.neat.mutate();
    }

    //Split data into training & testing data
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

    const avgBarLength =
      this.data[5]
        .map((_, index, data) => data[index + 1] - data[index])
        .slice(0, -1)
        .reduce((acc, val) => acc + val) /
      (this.data[5].length - 1) /
      (1000 * 60);

    Logger.debug(`Average bar length: ${avgBarLength.toFixed(3)} minutes`);

    while (true) {
      this.generation++;
      await this.train();
      if (this.neatConfig.saveCandidateGenomes !== false) {
        this.saveCandidateGenomes();
      }
      this.breed();
    }
  }
};

module.exports = NeatTrainer;

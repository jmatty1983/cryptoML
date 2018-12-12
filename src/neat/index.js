// TODO: Normalisation of Novelty Search objectives

const fs = require("fs");
const { Neat, methods, architect } = require("neataptic");
const os = require("os");
const { Worker, MessageChannel } = require("worker_threads");

const GBOS = require("GBOS-js");
const noveltySearch = require("./noveltySearch");

const phonetic = require("phonetic");
const table = require("table");

const { percentageChangeLog2 } = require("./normFuncs").percentChange;
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
  init: function({
    exchange,
    pair,
    type,
    length,
    dataDir,
    dbExt,
    neatConfig,
    indicatorConfig
  }) {
    this.dataManager = Object.create(DataManager);
    this.dataManager.init(exchange, dataDir, dbExt);
    this.neatConfig = neatConfig;
    this.indicatorConfig = indicatorConfig;
    this.generation = 0;
    this.highScore = -Infinity;
    this.pair = pair;
    this.type = type;
    this.length = length;

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

  breed: function() {
    this.neat.sort();

    let getUniqueOffspring = () => {
      let offspring = null;
      do {
        offspring = this.neat.getOffspring();
      } while (
        this.parentPopulation.some(
          genome =>
            JSON.stringify(genome.toJSON()) ===
            JSON.stringify(offspring.toJSON())
        )
      );
      return offspring;
    };

    this.neat.population = new Array(this.neat.popsize)
      .fill(null)
      .map(getUniqueOffspring);

    this.neat.mutate();

    if (this.neatConfig.discardDuplicateGenomes) {
      this.neat.population = this.neat.population.filter((genome1, index) =>
        this.neat.population.some(
          (genome2, index2) =>
            !(
              index2 > index &&
              JSON.stringify(genome1.toJSON()) ===
                JSON.stringify(genome2.toJSON())
            )
        )
      );
    }

    {
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
        "Profit",
        "Wins",
        "Losses",
        "WinRate",
        "",
        "Profit",
        "Wins",
        "Losses",
        "WinRate"
      ];
      const d = this.candidatePopulation
        .filter((_, index) => index < 8)
        .map(g => {
          return [
            g.generation,
            (100 * g.stats.profit).toFixed(2) + "%",
            g.stats.buys.toFixed(2),
            g.stats.sells.toFixed(2),
            g.stats.winRate.toFixed(2),
            "/",
            (100 * g.testStats.profit).toFixed(2) + "%",
            g.testStats.buys.toFixed(2),
            g.testStats.sells.toFixed(2),
            g.testStats.winRate.toFixed(2)
          ];
        });

      table
        .table([[...header], ...d], tableOptions)
        .slice(1, -1)
        .split("\n")
        .forEach(Logger.debug);
    }
  },

  getFitness: function({ profit, buys, sells }) {
    return (profit - 1) * 100 * Math.atan(buys * sells);
  },

  processStatistics: function(results) {
    // genome naming

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

    this.candidatePopulation = [
      ...this.candidatePopulation,
      ...this.neat.population.filter(genome1 => {
        return !this.candidatePopulation.some(
          genome2 =>
            JSON.stringify(genome1.toJSON()) ===
            JSON.stringify(genome2.toJSON())
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
    this.candidatePopulation.length = this.neatConfig.populationSize;

    this.candidatePopulation = this.candidatePopulation.filter(
      genome => genome.stats.profit > 0 && genome.testStats.profit > 0
    );

    // perform novelty search & sorting

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
      this.neat.population[index].score = -rank;
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
    this.processStatistics(results);

    // TODO: handle this differently

    results.forEach(({ trainStats, testStats, id }) => {
      const testScore = testStats.value;
      if (testScore > this.highScore && trainStats.value > 1) {
        const data = {
          genome: this.neat.population[id].toJSON(),
          trainStats,
          testStats,
          traderConfig,
          indicatorConfig,
          neatConfig
        };

        const safePairName = this.pair.replace(/[^a-z0-9]/gi, "");
        const filename = `${safePairName}_${this.type}_${this.length}_gen_${
          this.generation
        }_id_${id}_${testStats.value * 100}`;
        const dir = `${__dirname}/../../genomes/${safePairName}`;
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }

        fs.writeFileSync(`${dir}/${filename}`, JSON.stringify(data));
        this.highScore = testScore;
      }
    });
  },

  start: async function() {
    Logger.info("Starting genome search");

    this.normalisedData = this.data
      .filter((_, index) => index !== 5)
      // .filter((_,index) => (index===0||index===1||index===2||index===3||index==4))
      .map(percentageChangeLog2);

    if (this.normalisedData.length) {
      Logger.info(
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
        clear: true
      });

      this.neat.population = this.neat.population.map(
        m =>
          new architect.Random(
            this.normalisedData.length,
            1,
            this.neatConfig.outputSize
          )
      );
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
      this.breed();
    }
  }
};

module.exports = NeatTrainer;

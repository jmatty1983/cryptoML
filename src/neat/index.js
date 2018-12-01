const { Neat, methods, architect } = require("neataptic");
const { Worker } = require("worker_threads");
const _ = require("lodash");
const os = require("os");

const { traderConfig } = require("../config/config");
const DataManager = require("../dataManager");
const Logger = require("../logger");

const NeatTrainer = {
  init: function({
    exchange,
    pair,
    type,
    length,
    dataDir,
    dbExt,
    networkConfig,
    indicatorConfig
  }) {
    this.dataManager = Object.create(DataManager);
    this.dataManager.init(exchange, dataDir, dbExt);
    this.networkConfig = networkConfig;
    this.indicatorConfig = indicatorConfig;
    this.archive = [];
    this.generations = 0;
    this.data = this.dataManager.checkDataExists(pair, type, length)
      ? this.dataManager.loadData(pair, type, length, indicatorConfig)
      : [];

    if (this.data.length) {
      this.neat = new Neat(this.data.length, 1, null, {
        mutation: methods.mutation.ALL,
        popsize: this.networkConfig.populationSize,
        mutationRate: this.networkConfig.mutationRate,
        network: new architect.Random(
          this.data.length,
          1,
          this.networkConfig.outputSize
        )
      });
    }
  },

  breed: function() {
    this.neat.sort();
    Logger.debug(
      this.neat.population[0].score +
        " " +
        this.neat.population[0].stats.buys +
        " " +
        this.neat.population[0].stats.sells
    );
    this.neat.population = new Array(this.neat.popsize)
      .fill(null)
      .map(() => this.neat.getOffspring());

    this.neat.mutate();
  },

  getFitness: function({ currency, startCurrency }) {
    return (currency / startCurrency) * 100;
  },

  train: async function() {
    //Really considering abstracting the worker log it some where else. It doesn't really belong here.
    //For now this just creates THREADS at a time and waits for them all to complete before spawning
    //a new batch. It will be much better to spawn a new thread as soon as one completes. That's next.
    const chunkedPop = _.chunk(this.neat.population, process.env.THREADS);
    chunkedPop.forEach(async chunk => {
      await Promise.all(
        chunk.map(
          genome =>
            new Promise((resolve, reject) => {
              const worker = new Worker("./src/tradeWorker/index.js", {
                workerData: {
                  genome: genome.toJSON(),
                  data: this.data,
                  trainData: this.trainData,
                  traderConfig
                }
              });

              worker.on("message", stats => {
                genome.stats = stats;
                genome.score = this.getFitness(genome.stats);
                resolve();
              });
              worker.on("error", reject);

              worker.on("exit", code => {
                if (code !== 0)
                  reject(new Error(`Worker stopped with exit code ${code}`));
              });
            })
        )
      );
    });
  },

  start: function() {
    Logger.info("Starting genome search");
    this.normalisedPoints = this.data.map(this.dataManager.getNormalisedPoints);
    this.normalisedData = this.data.map((array, index) =>
      this.dataManager.normaliseArray(array, this.normalisedPoints[index])
    );

    //split train and test data
    const half = Math.trunc(this.normalisedData[0].length / 2);
    this.trainData = this.normalisedData.map(array => array.slice(0, half));
    this.testData = this.normalisedData.map(array =>
      array.slice(half, this.normalisedData[0].length)
    );

    while (true) {
      this.train();
      this.breed();
      this.generations++;
    }
  }
};

module.exports = NeatTrainer;

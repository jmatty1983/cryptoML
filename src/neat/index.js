const { Neat, methods, architect } = require("neataptic");
const { Worker } = require("worker_threads");
const os = require("os");

const ArrayUtils = require("../lib/array");
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
    this.neat.population.forEach((genome, i) => (genome.id = i));
    const chunkedPop = ArrayUtils.chunk(
      this.neat.population,
      Math.floor(this.neat.population.length / process.env.THREADS)
    );

    const work = chunkedPop.map(chunk => {
      const genomes = chunk.map(genome => ({
        genome: genome.toJSON(),
        id: genome.id
      }));
      return new Promise((resolve, reject) => {
        const worker = new Worker("./src/tradeWorker/index.js", {
          workerData: {
            data: this.data,
            trainData: this.trainData,
            genomes,
            traderConfig
          }
        });

        worker.on("message", resolve);
        worker.on("error", reject);

        worker.on("exit", code => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      });
    });

    let results = ArrayUtils.flatten(await Promise.all(work));
    results.forEach(({ stats, id }) => {
      this.neat.population[id].stats = stats;
      this.neat.population[id].score = this.getFitness(stats);
    });
  },

  start: async function() {
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
      await this.train();
      this.breed();
      this.generations++;
    }
  }
};

module.exports = NeatTrainer;

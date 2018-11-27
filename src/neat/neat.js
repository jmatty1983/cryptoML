const { Neat, methods, architect, Network } = require("neataptic");

const { traderConfig } = require("../config/config");
const DataManager = require("../dataManager/dataManager");
const Logger = require("../logger/logger");
const TradeManager = require("../tradeManager/tradeManager");

const NeatTrainer = {
  init: async function({
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
    this.data = (await this.dataManager.checkDataExists(pair, type, length))
      ? await this.dataManager.loadData(pair, type, length, indicatorConfig)
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

  train: function() {
    this.neat.population.forEach(genome => {
      const trader = Object.create(TradeManager);
      trader.init(genome, this.data, this.trainData, traderConfig);
      genome.stats = trader.runTrades();
      genome.score = this.getFitness(genome.stats);
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

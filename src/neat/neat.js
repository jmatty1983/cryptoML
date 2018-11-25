const { Neat, methods, architect, Network } = require("neataptic");

const { tradeConfig } = require("../config/config");
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

  train: function() {
    this.neat.population.forEach(genome => {
      const trader = Object.create(TradeManager);
      trader.init(genome, this.data, this.trainData, tradeConfig);
      trader.runTrades();
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
    }
  }
};

module.exports = NeatTrainer;

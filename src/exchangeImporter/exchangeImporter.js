const ccxt = require ('ccxt');

const DataManager = require('../dataManager/dataManager');
const Logger = require('../Logger/Logger');

const exchangeImporter = {
  init: function (exchange) {
    this.exchange = exchange;
    const dataManager = Object.create(DataManager);
    this.dataManager = dataManager;
    dataManager.init(exchange);

    Logger.info('Exchange import initialized.');
  },

  getPair: async function (pair) {
    try {
      if (pair) {
        pair = pair.toUpperCase();
        //Get the id of the last trade imported and intialize exchange class
        const lastId = await this.dataManager.getNewestTrade(pair);
        const exchange = new ccxt[this.exchange]({ enableRateLimit: true });

        //This is working under the asusmption that the trade ids begin with 1 for the first and incremented from there
        //This is true for Binance. When / If trying other exchanges this will need testing and possibly modification

        //This is ok for now. Basically we start at the last candle saved in the db plus one. Get a batch of candles.
        //The max binance allows is 1k. Again can look at this when considering multiple exchanges. Hand data to dataManager
        //to be saved. Repeat until the api responds with less than 1000 trades, which should happen when trades are
        //imported up to the most current
        let fromId = lastId + 1;
        let batch;
        do {
          batch = await exchange.fetchTrades(pair, undefined, undefined, {fromId, limit: 1000});
          await this.dataManager.store(batch);
          fromId += 1000;
        } while (batch.length === 1000);

        Logger.info(`${fromId - 1000 + batch.length - lastId} trades imported`);
      } else {
        throw('Must specify a pair');
      }
    } catch (e) {
      Logger.error(e.message);
    }
  }
};

module.exports = exchangeImporter;
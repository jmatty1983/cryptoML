const ccxt = require ('ccxt');

const DataManager = require('../dataManager/dataManager');
const Logger = require('../logger/logger');

const limit = 1000;

const exchangeImporter = {
    /**
   * Constructor for OLOO style behavior delgation.
   * @param {string} exchange - exchange name
   */
  init: function (exchange) {
    this.exchange = exchange;
    const dataManager = Object.create(DataManager);
    this.dataManager = dataManager;
    this.exchange = new ccxt[this.exchange]({ enableRateLimit: true });
    dataManager.init(exchange);

    Logger.info('Exchange import initialized.');
  },

  /**
   * Fetches a batch of trades from an exchange and stores them in the db
   * @param {integer} fromId - id of trade to start with
   * @param {string} pair - pair to import
   */
  fetchTrades: async function (fromId, pair) {
    try {
      batch = await this.exchange.fetchTrades(pair, undefined, undefined, {fromId, limit});
      await this.dataManager.storeTrades(batch);
      return batch.length;
    } catch (e) {
      if (e.message.indexOf('request timed out') !== -1) {
        //try again on timeout
        await this.fetchTrades(fromId, pair);
      }
    }
  },

  /**
   * Imports all trade data for a pair from an exchange
   * @param {string} pair
   */
  getPair: async function (pair) {
    try {
      if (pair) {
        pair = pair.toUpperCase();
        //Get the id of the last trade imported and intialize exchange class
        const lastId = await this.dataManager.getNewestTrade(pair);

        //This is working under the asusmption that the trade ids begin with 1 for the first and incremented from there
        //This is true for Binance. When / If trying other exchanges this will need testing and possibly modification

        //This is ok for now. Basically we start at the last candle saved in the db plus one. Get a batch of candles.
        //The max binance allows is 1k. Again can look at this when considering multiple exchanges. Hand data to dataManager
        //to be saved. Repeat until the api responds with less than 1000 trades, which should happen when trades are
        //imported up to the most current
        let fromId = lastId + 1;
        Logger.debug(`Getting data from ${fromId}`);
        let amt;
        do {
          amt = await this.fetchTrades(fromId, pair);
          fromId += 1000;
        } while (amt === 1000);

        Logger.info(`${fromId - 1000 + amt - lastId} trades imported`);
      } else {
        throw('Must specify a pair');
      }
    } catch (e) {
      Logger.error(e.message);
    }
  }
};

module.exports = exchangeImporter;
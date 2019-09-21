const { Logger } = require("../logger");
const { Network } = require("neataptic");
const fs = require('fs')

const ExchangeImporter = require("../exchangeImporter");
const DataManager = require("../dataManager");
const TradeManager = require("../tradeManager");

const paperTrader = {
/**
 * Constructor for OLOO style behavior delgation.
 * @param {string} exchange - exchange name, pair, type, length, genomeName, dataDir, dbExt
 */
  init: function(exchange, pair, type, length, genomeName, dataDir, dbExt) {
    this.exchange = exchange;
    this.pair = pair;
    this.asset = this.pair.split("/")[0]
    this.currency = this.pair.split("/")[1]
    this.type = type;
    this.length = length;
    this.genomeName = genomeName;
    this.dataDir= dataDir
    this.dbExt= dbExt
    this.genomeData = JSON.parse(fs.readFileSync(`./genomes/${this.asset}_${this.currency}/${genomeName}`, "utf8")); //running from main.js?
    this.network = Network.fromJSON(this.genomeData.genome);
    this.ID = 0;
    this.neatConfig = this.genomeData.neatConfig;
    this.indConfig = this.genomeData.indicatorConfig;
    this.traderConfig = this.genomeData.traderConfig;
    Logger.info(`paperTrader init: ${exchange}_${pair}_${type}_${length} >> ${genomeName}.`);
  },

  /**
 * Constructor for OLOO style behavior delgation.
 * @function () Starts a running paper trader.
 */

  doPaper: async function(){
    const dataManager = Object.create(DataManager);
    dataManager.init(this.exchange, this.dataDir, this.dbExt);
    const exchangeImport = Object.create(ExchangeImporter);
    exchangeImport.init(this.exchange, this.dataDir, this.dbExt);
    const types = this.length.split(",").map(length => ({ type: this.type, length }));
    await exchangeImport.getPair(`${this.pair.toUpperCase()}`)
    await dataManager.processCandles(`${this.pair.toUpperCase()}`, `${this.pair}_${this.type}_${this.length}`, types)
    if(dataManager.getNewestTrade(`${this.pair}_${this.type}_${this.length}`) > this.ID){
        this.ID = dataManager.getNewestTrade(`${this.pair}_${this.type}_${this.length}`)
        this.candles = dataManager.loadData(this.pair, this.type, this.length, this.indConfig)
        this.candlesNormalised = dataManager.normaliseData(this.candles, this.neatConfig, this.indConfig)
        this.tradeManager = Object.create(TradeManager)
        this.tradeManager.init(this.network, null, this.candles, this.candlesNormalised, `${this.asset}_${this.currency}_${this.type}_${this.length}`, this.traderConfig)
        this.tradeManager.runPaper();
    }
    Logger.info(`No new candles to act upon.`)
  }
};


module.exports = paperTrader;

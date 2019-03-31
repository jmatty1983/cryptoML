const { Logger } = require("../logger");
const { Network } = require("neataptic");
const CandleBatcher = require("../candleBatcher");
const fs = require('fs')

const paperTrader = {
/**
 * Constructor for OLOO style behavior delgation.
 * @param {string} exchange - exchange name
 */
  init: function(exchange, pair, type, length, genomeName) {
    this.exchange = exchange;
    this.pair = pair;
    this.asset = this.pair.split("/")[0]
    this.currency = this.pair.split("/")[1]
    this.type = type;
    this.length = length;
    this.genomeName = genomeName;
    this.dataDir="../../data/"
    this.dbExt=".db"
    this.genomeData = JSON.parse(fs.readFileSync(`../../genomes/${this.asset}_${this.currency}/${genomeName}`, "utf8"));
    this.network = Network.fromJSON(this.genomeData.genome);
    //console.log(network)
    this.neatConfig = this.genomeData.neatConfig;
    this.indConfig = this.genomeData.indicatorConfig;
    this.traderConfig = this.genomeData.traderConfig;
    Logger.info(`${exchange}_${pair}_${type}_${length} >> ${genomeName}.`);
  },

  /**
 * Constructor for OLOO style behavior delgation.
 * @param {string} exchange - exchange name
 */
  start: function(exchange, pair, type, length) {
    const candleBatcher = Object.create(CandleBatcher);
    candleBatcher.init(exchange, pair, type, length);
    candleBatcher.on(exchange, pair, type, length).then( () => console.log("FUCK"))
  }

};


module.exports = paperTrader;

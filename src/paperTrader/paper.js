const { Logger } = require("../logger");
const { Network } = require("neataptic");
const ExchangeImporter = require("../exchangeImporter");
const DataManager = require("../dataManager");
const TradeManager = require("../tradeManager");
const fs = require("fs");

const LOG_LEVEL="debug"

const exchange = "binance"
const dataDir="../../data/"
const dbExt=".db"
const asset = "btc"
const currency = "usdt"
const type = "time"
const length = "5m"
const genomeName = "btc_usdt_time_4h_PnL_1.4006_WR_79.4872"
const pairName = `${asset}/${currency}`;

this.tradeManager = {};

this.candles = [];

this.genomeTrades = {};

this.candlesNormalised = {};

this.ID = 0;


const genomeData = JSON.parse(fs.readFileSync(`../../genomes/${asset}_${currency}/${genomeName}`, "utf8"));
this.network = Network.fromJSON(genomeData.genome);
//console.log(network)
const neatConfig = genomeData.neatConfig;
const indConfig = genomeData.indicatorConfig;
const traderConfig = genomeData.traderConfig;

const dataManager = Object.create(DataManager);
dataManager.init(exchange, dataDir, dbExt);
const exchangeImport = Object.create(ExchangeImporter);
exchangeImport.init(exchange, dataDir, dbExt);

this.doPaper = async function(){
    const types = length.split(",").map(length => ({ type: type, length }));
    await exchangeImport.getPair(`${pairName.toUpperCase()}`)
    await dataManager.batchCandles(`${pairName.toUpperCase()}`, `${pairName}_${type}_${length}`, types)
    console.log(this.ID)
    //console.log(dataManager.getNewestTrade(`${pairName}_${type}_${length}`))
    //console.log(dataManager.getNewestTrade(`${pairName.toUpperCase()}_${type}_${length}`) > lastTRADE)
    if(dataManager.getNewestTrade(`${pairName}_${type}_${length}`) > this.ID){
        console.log("lastTRade", this.ID)
        this.ID = dataManager.getNewestTrade(`${pairName}_${type}_${length}`)
        //console.log("lastID", this.lastID)
        this.candles = dataManager.loadData(pairName, type, length, indConfig)
        this.candlesNormalised = dataManager.normaliseData(this.candles, neatConfig, indConfig)
        this.tradeManager = Object.create(TradeManager)
        this.tradeManager.init(this.network, this.candles, this.candlesNormalised, traderConfig)
        //this.genomeTrades = this.tradeManager.runTrades()
        console.log(this.candles[this.candles.length -1])
        //console.log(this.tradeManager.handleCandle(this.candles[this.candles.length -1], this.network.noTraceActivate(this.candlesNormalised[this.candlesNormalised.length -1])))
        //console.log(this.genomeTrades.trades.slice(this.genomeTrades.trades.length - 2, this.genomeTrades.trades.length))
        Logger.info(`lastID updated: ${this.ID}`)
    }
    Logger.info(`No new candles to act upon.`)

}

this.on = async function (){
    while(true) {
        await this.doPaper();
    }
}

this.on();

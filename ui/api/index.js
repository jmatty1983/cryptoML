const express = require("express");
const fs = require("fs");
const path = require("path");

const Neat = require("../../src/neat");
const DataManager = require("../../src/dataManager");
const { Network } = require("neataptic");

const TradeManager = require("../../src/tradeManager");

const router = express.Router();
const exchange = "binance";
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

//Route to get candle data for a chart
router.get("/chart/:table", (req, res) => {
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const candles = dataManager.loadCandles(
    `[${decodeURIComponent(req.params.table)}]`
  );

  res.json(candles);
});

//Route to list trades from a genome
router.get("/genomes/trades/:genome", (req, res) => {
  //DECLARE ALL CONSTS.
  const param = `${decodeURIComponent(req.params.genome)}`;
  const [asset, currency, type, length] = param.split("_");
  const pairName = `${asset}/${currency}`;
  const genomeName = path.join(
    `${__dirname}`,
    "..",
    "..",
    "genomes",
    `${asset}_${currency}`,
    req.params.genome
  );
  //LOAD DATA FROM JSON AND PARSE GENOME DATA.
  const genomeData = JSON.parse(fs.readFileSync(genomeName, "utf8"));
  const network = Network.fromJSON(genomeData.genome);
  const neatConfig = genomeData.neatConfig;
  const indConfig = genomeData.indicatorConfig;
  const traderConfig = genomeData.traderConfig;
  //INIT dataManager and grab this.data
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const candles = dataManager.loadData(pairName, type, length, indConfig);
  //DECLARE normalisedData.
  const candlesNormalised = dataManager.normaliseData(candles, neatConfig, indConfig);
  //INIT tradeManager & feed it genome, candlesRaw, candlesNormalised, and the traderConfig.
  const trader = Object.create(TradeManager);
  trader.init(network, candles, candlesNormalised, `${asset_currency_type_length}`, traderConfig);
  const genomeTrades = trader.runTrades();

  res.json(genomeTrades);
});

//Route to list raw trades from a genome
//This is used for anyCharts to display event markers.
//Eventually move the filter/map into the react component so we dont need another router.
//Use the above raw trades and filter and map in react instead.
router.get("/backtest/chartTrades/:backtest", (req, res) => {
  //DECLARE ALL CONSTS.
  const param = `${decodeURIComponent(req.params.backtest)}`;
  const [date, strategy, asset, currency, type, length] = param.split("_");
  const backtestName = path.join(
    `${__dirname}`,
    "..",
    "..",
    "backtests",
    `${strategy}`,
    req.params.backtest
  );
  //LOAD DATA FROM JSON AND PARSE GENOME DATA.
  const backtestData = JSON.parse(fs.readFileSync(backtestName, "utf8"));
  //console.log(backtestData)
  const backtestTradesLong = backtestData.results.tradesLong;
  //console.log(backtestTradesLong)
  const backtestTradesShort = backtestData.results.tradesShort;
  //Map data into a format anyCharts accepts for event markers.
  const longEvents = backtestTradesLong
  .filter(
    ({ type, time, actionPrice, asset, balance, currency }) => type == "openLong"
  )
  .map(({ type, time, actionPrice, asset, balance, currency }) => ({
    date: `${time}`,
    description: `Bought ${asset} @ ${actionPrice}.
                    Transaction Value: ${asset * actionPrice}.
                    Wallet Value: ${balance}.
                    `
  }));
  const longCloseEvents = backtestTradesLong
    .filter(
      ({ type, time, actionPrice, asset, balance, currency }) => type == "closeLong"
    )
    .map(({ type, time, actionPrice, asset, balance, currency }) => ({
      date: `${time}`,
      description: `Sold ${asset} @ ${actionPrice}.
                      Transaction Value: ${asset * actionPrice}.
                      Wallet Value: ${balance}.
                      `
    }));
  const shortEvents = backtestTradesShort
    .filter(
      ({ type, time, actionPrice, asset, balance, currency }) => type == "openShort"
    )
    .map(({ type, time, actionPrice, asset, balance, currency }) => ({
      date: `${time}`,
      description: `Bought ${asset} @ ${actionPrice}.
                      Transaction Value: ${asset * actionPrice}.
                      Wallet Value: ${balance}.
                      `
    }));
  const shortCloseEvents = backtestTradesShort
    .filter(
      ({ type, time, actionPrice, asset, balance, currency }) => type == "closeShort"
    )
    .map(({ type, time, actionPrice, asset, balance, currency }) => ({
      date: `${time}`,
      description: `Sold ${asset} @ ${actionPrice}.
                      Transaction Value: ${asset * actionPrice}.
                      Wallet Value: ${balance}.
                      `
    }));
  const eventMarkers = {
    groups: [
      {
        format: "SHORT",
        data: shortEvents,
        fill: "#f45341"
      },
      {
        format: "SHORT CLOSE",
        data: shortCloseEvents,
        fill: "#000000"
      },
      {
        format: "LONG",
        data: longEvents,
        fill: "#42f459"
      },
      {
        format: "LONG CLOSE",
        data: longCloseEvents,
        fill: "#000000"
      },

    ]
  }; 

  res.json(eventMarkers);
});

//Route to chart genome trades. event markers.
//This is used for anyCharts to display event markers.
//Eventually move the filter/map into the react component so we dont need another router.
//Use the above raw trades and filter and map in react instead.
router.get("/genomes/chartTrades/:genome", (req, res) => {
  //DECLARE ALL CONSTS.
  const param = `${decodeURIComponent(req.params.genome)}`;
  const [asset, currency, type, length] = param.split("_");
  const pairName = `${asset}/${currency}`;
  const genomeName = path.join(
    `${__dirname}`,
    "..",
    "..",
    "genomes",
    `${asset}_${currency}`,
    req.params.genome
  );
  //LOAD DATA FROM JSON AND PARSE GENOME DATA.
  const genomeData = JSON.parse(fs.readFileSync(genomeName, "utf8"));
  const network = Network.fromJSON(genomeData.genome);
  const neatConfig = genomeData.neatConfig;
  const indConfig = genomeData.indicatorConfig;
  const traderConfig = genomeData.traderConfig;
  //INIT dataManager and grab this.data
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  //this.data = dataManager.loadCandles(`[${decodeURIComponent(tableName)}]`); //loadCandles is not used for tradeManager so need to use loadData.
  const candles = dataManager.loadData(pairName, type, length, indConfig);
  //DECLARE normalisedData.
  const candlesNormalised = dataManager.normaliseData(candles, neatConfig, indConfig);
  //INIT tradeManager & feed it genome, candlesRaw, candlesNormalised, and the traderConfig.
  const trader = Object.create(TradeManager);
  trader.init(network, candles, candlesNormalised, `${asset_currency_type_length}`, traderConfig);
  const genomeTrades = trader.runTrades();
  //Map data into a format anyCharts accepts for event markers.
  /*const buyEvents = genomeTrades.trades
    .filter(
      ({ type, time, actionPrice, asset, balance, currency }) => type == "open"
    )
    .map(({ type, time, actionPrice, asset, balance, currency }) => ({
      date: `${time}`,
      description: `Bought ${asset} @ ${actionPrice}.
                      Transaction Value: ${asset * actionPrice}.
                      Wallet Value: ${balance}.
                      `
    }));
  const sellEvents = genomeTrades.trades
    .filter(
      ({ type, time, actionPrice, asset, balance, currency }) => type == "close"
    )
    .map(({ type, time, actionPrice, asset, balance, currency }) => ({
      date: `${time}`,
      description: `Sold ${asset} @ ${actionPrice}.
                      Transaction Value: ${asset * actionPrice}.
                      Wallet Value: ${balance}.
                      `
    }));*/
  /*const eventMarkers = {
    groups: [
      {
        format: "BUY",
        data: buyEvents,
        fill: "#42f459"
      },
      {
        format: "SELL",
        data: sellEvents,
        fill: "#f45341"
      }
    ]
  };*/  

  const longEvents = genomeTrades.trades
  .filter(
    ({ type, time, actionPrice, asset, balance, currency }) => type == "openLong"
  )
  .map(({ type, time, actionPrice, asset, balance, currency }) => ({
    date: `${time}`,
    description: `Bought ${asset} @ ${actionPrice}.
                    Transaction Value: ${asset * actionPrice}.
                    Wallet Value: ${balance}.
                    `
  }));
  const longCloseEvents = genomeTrades.trades
    .filter(
      ({ type, time, actionPrice, asset, balance, currency }) => type == "closeLong"
    )
    .map(({ type, time, actionPrice, asset, balance, currency }) => ({
      date: `${time}`,
      description: `Sold ${asset} @ ${actionPrice}.
                      Transaction Value: ${asset * actionPrice}.
                      Wallet Value: ${balance}.
                      `
    }));
  const shortEvents = genomeTrades.trades
    .filter(
      ({ type, time, actionPrice, asset, balance, currency }) => type == "openShort"
    )
    .map(({ type, time, actionPrice, asset, balance, currency }) => ({
      date: `${time}`,
      description: `Bought ${asset} @ ${actionPrice}.
                      Transaction Value: ${asset * actionPrice}.
                      Wallet Value: ${balance}.
                      `
    }));
  const shortCloseEvents = genomeTrades.trades
    .filter(
      ({ type, time, actionPrice, asset, balance, currency }) => type == "closeShort"
    )
    .map(({ type, time, actionPrice, asset, balance, currency }) => ({
      date: `${time}`,
      description: `Sold ${asset} @ ${actionPrice}.
                      Transaction Value: ${asset * actionPrice}.
                      Wallet Value: ${balance}.
                      `
    }));
  const eventMarkers = {
    groups: [
      {
        format: "SHORT",
        data: shortEvents,
        fill: "#f45341"
      },
      {
        format: "SHORT CLOSE",
        data: shortCloseEvents,
        fill: "#000000"
      },
      {
        format: "LONG",
        data: longEvents,
        fill: "#42f459"
      },
      {
        format: "LONG CLOSE",
        data: longCloseEvents,
        fill: "#000000"
      },

    ]
  }; 

  res.json(eventMarkers);
});

//Route to send PNL data for charting.
 
router.get("/genomes/pnl/:genome", (req, res) => {
  //DECLARE ALL CONSTS.
  const param = `${decodeURIComponent(req.params.genome)}`;
  const [asset, currency, type, length] = param.split("_");
  const pairName = `${asset}/${currency}`;
  const genomeName = path.join(
    `${__dirname}`,
    "..",
    "..",
    "genomes",
    `${asset}_${currency}`,
    req.params.genome
  );

  //LOAD DATA FROM JSON AND PARSE GENOME DATA.
  const genomeData = JSON.parse(fs.readFileSync(genomeName, "utf8"));
  const network = Network.fromJSON(genomeData.genome);
  const neatConfig = genomeData.neatConfig;
  const indConfig = genomeData.indicatorConfig;
  const traderConfig = genomeData.traderConfig;
  //INIT dataManager and grab this.data
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const candles = dataManager.loadData(pairName, type, length, indConfig);
  //DECLARE normalisedData.
  const candlesNormalised = dataManager.normaliseData(candles, neatConfig, indConfig);
  //INIT tradeManager & feed it genome, candlesRaw, candlesNormalised, and the traderConfig.
  const trader = Object.create(TradeManager);
  trader.init(network, candles, candlesNormalised, `${asset_currency_type_length}`, traderConfig);
  const tradeData = trader.runTrades();
  const [
    opens,
    highs,
    lows,
    closes,
    volumes,
    startTimes,
    endTimes,
    tradeIds
  ] = dataManager.loadData(pairName, type, length, indConfig);
  const tickStats = closes.map((closes, i) => {
    const { balance, wallet, asset, currency } = tradeData.trades.reverse().find(t => t.time <= endTimes[i]) || { balance: 0 };
    //const { balance, wallet, asset, currency } = tradeData.trades.find(t => t.time == endTimes[i]) || { balance: 0, wallet: 0, asset: 0, currency: 0 };
    return [tradeIds, balance];
  });

  res.json(tickStats);
});

//Route that runs a modified runTrades that uses a modified calcStat to only output the stats needed for PnL
//Expirementing with this way vs the way above.
router.get("/genomes/tickstats/:genome", (req, res) => {
  //DECLARE ALL CONSTS.
  const param = `${decodeURIComponent(req.params.genome)}`;
  const [asset, currency, type, length] = param.split("_");
  const pairName = `${asset}/${currency}`;
  const genomeName = path.join(
    `${__dirname}`,
    "..",
    "..",
    "genomes",
    `${asset}_${currency}`,
    req.params.genome
  );

  //LOAD DATA FROM JSON AND PARSE GENOME DATA.
  const genomeData = JSON.parse(fs.readFileSync(genomeName, "utf8"));
  const network = Network.fromJSON(genomeData.genome);
  const neatConfig = genomeData.neatConfig;
  const indConfig = genomeData.indicatorConfig;
  const traderConfig = genomeData.traderConfig;
  //INIT dataManager and grab this.data
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const candles = dataManager.loadData(pairName, type, length, indConfig);
  //DECLARE normalisedData.
  const candlesNormalised = dataManager.normaliseData(candles, neatConfig, indConfig);
  //INIT tradeManager & feed it genome, candlesRaw, candlesNormalised, and the traderConfig.
  const trader = Object.create(TradeManager);
  trader.init(network, candles, candlesNormalised, `${asset_currency_type_length}`, traderConfig);
  const tradeStats = trader.runStats();

  res.json(tradeStats);
});

//Route to get individual stats for a genome (debug use)
router.get("/genomes/stats/:genome", (req, res) => {
  //DECLARE ALL CONSTS.
  const param = `${decodeURIComponent(req.params.genome)}`;
  const [asset, currency, type, length] = param.split("_");
  const pairName = `${asset}/${currency}`;
  const genomeName = path.join(
    `${__dirname}`,
    "..",
    "..",
    "genomes",
    `${asset}_${currency}`,
    req.params.genome
  );

  //LOAD DATA FROM JSON AND PARSE GENOME DATA.
  const genomeData = JSON.parse(fs.readFileSync(genomeName, "utf8"));
  const network = Network.fromJSON(genomeData.genome);
  const neatConfig = genomeData.neatConfig;
  const indConfig = genomeData.indicatorConfig;
  const traderConfig = genomeData.traderConfig;
  //INIT dataManager and grab this.data
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const candles = dataManager.loadData(pairName, type, length, indConfig);
  //DECLARE normalisedData.
  const candlesNormalised = dataManager.normaliseData(candles, neatConfig, indConfig);
  //INIT tradeManager & feed it genome, candlesRaw, candlesNormalised, and the traderConfig.
  const trader = Object.create(TradeManager);
  trader.init(network, candles, candlesNormalised, `${asset_currency_type_length}`, traderConfig);
  const tradeStats = trader.runTrades();

  res.json(tradeStats);
});

//Route to load candle data for genome and convert it to anyChart data.
//THIS ONE IS FOR anyCharts
router.get("/genomes/chart/:genome", (req, res) => {
  //DECLARE ALL CONSTS.
  const param = `${decodeURIComponent(req.params.genome)}`;
  const [asset, currency, type, length] = param.split("_");
  const pairName = `${asset}/${currency}`;
  const genomeName = path.join(
    `${__dirname}`,
    "..",
    "..",
    "genomes",
    `${asset}_${currency}`,
    req.params.genome
  );
  //LOAD DATA FROM JSON AND PARSE GENOME DATA.
  const genomeData = JSON.parse(fs.readFileSync(genomeName, "utf8"));
  const indConfig = genomeData.indicatorConfig;
  //INIT dataManager and grab this.data
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  //console.log(tradeData.trades)
  const [
    opens,
    highs,
    lows,
    closes,
    volumes,
    startTimes,
    endTimes,
    tradeids
  ] = dataManager.loadData(pairName, type, length, indConfig);

  const candleArray = closes.map((closes, i) => {
    return [endTimes[i], opens[i], highs[i], lows[i], closes, volumes[i]];
  });

  res.json(candleArray);
});

//THIS ONE IS FOR anyCharts
router.get("/backtest/chart/:backtest", (req, res) => {
  console.log(`${decodeURIComponent(req.params.backtest)}`)
  //DECLARE ALL CONSTS.
  //super ghetto way to plot the sma on the chart for backtest. useless but whatever.
  //was checking to see if the strat lined up and it does.
  const indConfig = [
    {
      name: "sma",
      params: [{ length: 24, index: 3 }],
      normFunc: "null"
    },
  ];
  const param = `${decodeURIComponent(req.params.backtest)}`; //STRATNAME_ASSET_CURRENT_TYPE_LENGTH_DATE
  const [date, strategy, asset, currency, type, length] = param.split("_");
  const pairName = `${asset}/${currency}`;
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const [
    opens,
    highs,
    lows,
    closes,
    volumes,
    startTimes,
    endTimes,
    tradeids,
    sma
  ] = dataManager.loadData(pairName, type, length, indConfig);
  const candleArray = closes.map((closes, i) => {
    return [endTimes[i], opens[i], highs[i], lows[i], closes, volumes[i], sma[i]];
  });

  res.json(candleArray);
});

//Route to get a list of genomes
router.get("/genomes", (req, res) => {
  const genomeDir = "./genomes/";
  
  const walkSync = dir =>
    fs.readdirSync(dir).reduce((files, file) => {
      const name = path.join(dir, file);
      return fs.statSync(name).isDirectory()
        ? [...files, ...walkSync(name)]
        : [...files, name];
    }, []);
  const genomeList = walkSync(genomeDir);
  const genomesFinal = genomeList.map(genome => ({
    name: genome.split("/")[(genome.split("/").length) - 1],
    data: JSON.parse(fs.readFileSync(`./${genome}`, "utf8"))
  }));

  res.json(genomesFinal);
});

//Route to get a list of backtest results
router.get("/backtests", (req, res) => {
  const backtestDir = "./backtests/";
  const walkSync = dir =>
    fs.readdirSync(dir).reduce((files, file) => {
      const name = path.join(dir, file);
      return fs.statSync(name).isDirectory()
        ? [...files, ...walkSync(name)]
        : [...files, name];
    }, []);
  const backtestList = walkSync(backtestDir);
  const backtestFinal = backtestList.map(backtest => ({
    name: backtest,
    data: JSON.parse(fs.readFileSync(`./${backtest}`, "utf8"))
  }));

  res.json(backtestFinal);
});

//Route to get list of avaliable candle sets.
router.get("/candles", (req, res) => {
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const tables = dataManager.getCandleTables();

  res.json(tables);
});

//Route to start GA from UI.
router.get("/garun/:candle", (req, res) => {
  const neat = Object.create(Neat);
  const table = decodeURIComponent(req.params.candle);
  const args = table.split("_");
  neat.init({
    pair: args[0],
    type: args[1],
    length: args[2],
    exchange,
    dataDir,
    dbExt
  });
  neat.getEventEmitter().on("update", data => {
    const extractStats = ({ generation, stats, testStats }) => ({
      generation,
      stats,
      testStats
    });
    const toEmit = {
      generation: data.generation,
      candidates: data.candidates.map(extractStats),
      parents: data.parents.map(extractStats)
    };
    req.app.io.emit("msg", toEmit);
  });

  neat.start();

  res.send("starting ga");
});

module.exports = router;

require("dotenv-safe").config();
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

const readline = require("readline");

const { neatConfig, indicatorConfig, backtestConfig } = require("./config/config");
const ExchangeImport = require("./exchangeImporter");
const DataManager = require("./dataManager");
//const CandleBatcher = require("./candleBatcher/candleBatcher.js");
const { Logger } = require("./logger");
const Neat = require("./neat");
const Backtester = require("./tradeManager/backtester");
const TradeManager = require("./tradeManager");
const paperTimeout = 10000;

const fs = require("fs");

const args = process.argv.slice(2);
const actions = ["import", "process", "ga", "paper", "backtest"];

let fn = args[0];
let exchange = "binance";

//Check if a function was specified. If not throw error and exit. If so format it for processing
if (fn) {
  fn = fn.toLowerCase();
} else {
  Logger.error(`You must specify an action. Valid options are: ${actions}`);
  process.exit();
}

switch (fn) {
  case "import":
    //import requires a pair to be specified
    if (args[1]) {
      const exchangeImport = Object.create(ExchangeImport);
      exchangeImport.init(exchange, dataDir, dbExt);
      exchangeImport.getPair(args[1]);
    } else {
      Logger.error("No pair provided");
    }
    break;

  case "process":
    try {
      if (!args[1]) {
        throw "No pair provided";
      }

      if (!args[2]) {
        throw "No types provided";
      }

      if (!args[3]) {
        throw "No lengths provided";
      }

      processCandles(args[1], args[2], args[3]);
    } catch (e) {
      Logger.error(e.message);
    }
    break;

    case "update":
    try {
      if (!args[1]) {
        throw "No pair provided";
      }

      if (!args[2]) {
        throw "No types provided";
      }

      if (!args[3]) {
        throw "No lengths provided";
      }

      batchCandles(args[1], args[2], args[3]);
    } catch (e) {
      Logger.error(e.message);
    }
    break;

  case "paper":
    try{
      if (!args[1]) {
        throw "No pair provided";
      }

      if (!args[2]) {
        throw "No types provided";
      }

      if (!args[3]) {
        throw "No lengths provided";
      }
      const exchangeImport = Object.create(ExchangeImport);
      exchangeImport.init(exchange, dataDir, dbExt)

      batchImport(args[1], args[2], args[3]);
      
      //setInterval(() => {exchangeImport.getPair(args[1]).then (() => batchCandles(args[1], args[2], args[3]))}, paperTimeout)
      //while (true)
      //await exchangeImport.getPair(args[1]).then (() => batchCandles(args[1], args[2], args[3]))

    } catch (e) {
      Logger.error(e.message);
    }
    break;

  case "backtest":
  try {
    if (!args[1]) {
      throw "No pair specified";
    }

    if (!args[2]) {
      throw "No candle type specified";
    }

    if (!args[3]) {
      throw "No length specified";
    }

    if (!args[4]) {
      throw "No Strategy specified";
    }

    //INIT DB
    this.dataManager = Object.create(DataManager);
    this.dataManager.init(exchange, dataDir, dbExt);
    //INIT BACKTESTER
    const backtester = Object.create(Backtester);
    //SET PAIR/TYPE/LENGTH/STRATEGY NAME TO BACKTEST/TRADER CONFIG.
    const pair = args[1]
    const type = args[2]
    const length = args[3]
    const strategy = args[4]
    const indicatorConfig = []; //WE DONT USE INDCATORS FOR BACKTEST
    //LOAD CANDLES INTO MEMORY FROM DB.
    this.data = this.dataManager.checkDataExists(pair, type, length)
          ? this.dataManager.loadData(pair, type, length, indicatorConfig)
          : [];
    //DO BACKTEST + PRINT RESULTS.
    backtester.init(
      strategy,
      pair,
      type,
      length,
      this.data,
      backtestConfig
    );
    backtester.runTrades();

  } catch(e) {
    Logger.error(e.message);
  }
    break;

  case "ga":
    try {
      if (!args[1]) {
        throw "No pair specified";
      }

      if (!args[2]) {
        throw "No candle type specified";
      }

      if (!args[3]) {
        throw "No length specified";
      }

      const neat = Object.create(Neat);
      neat.init({
        pair: args[1],
        type: args[2],
        length: args[3],
        neatConfig,
        indicatorConfig,
        exchange,
        dataDir,
        dbExt
      });

      if (!neat.data.length) {
        const prompt = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        prompt.question(
          `There is no data for ${args[1]} ${args[2]} ${
            args[3]
          } would you like it processed now? (y/n)`,
          answer => {
            if (answer.toLowerCase() === "y") {
              processCandles(args[1], args[2], args[3]).then(() =>
                Logger.info("Data processed. You can run GA again.")
              );
            } else {
              Logger.info("Data must be processed before running GA");
            }
            process.exit();
          }
        );
      } else {
        neat.start();
      }
      break;
    } catch (e) {
      Logger.error(e.message);
    }
  default:
    Logger.error(`Invalid action ${fn}. Valid options are: ${actions}`);
}

async function processCandles(pair, type, length) {
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);

  const types = length.split(",").map(length => ({ type: type, length }));
  await dataManager.processCandles(pair, types);
}

async function batchCandles(pair, type, length) {
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);

  const types = length.split(",").map(length => ({ type: type, length }));
  await dataManager.batchCandles(pair, `${pair.toLowerCase()}_${type}_${length}`, types);
}

async function batchImport(pair, type, length) {
  const exchangeImport = Object.create(ExchangeImport);
  exchangeImport.init(pair,type,length);

  while (true)
  await exchangeImport.getPair(pair).then (() => batchCandles(pair, type, length))
}


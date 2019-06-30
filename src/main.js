require("dotenv-safe").config();
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

const readline = require("readline");

const { neatConfig, indicatorConfig, traderConfig, backtestConfig } = require("./config/config");
const ExchangeImport = require("./exchangeImporter");
const DataManager = require("./dataManager");
const PaperTrader = require("./paperTrader");
const { Logger } = require("./logger");
const Neat = require("./neat");
const TradeManager = require("./tradeManager");

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
      exchangeImport.getPair(args[1].toLowerCase());
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

      processCandles(args[1].toLowerCase(), args[2].toLowerCase(), args[3].toLowerCase());
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

    this.dataManager = Object.create(DataManager);
    this.dataManager.init(exchange, dataDir, dbExt);
    const backtester = Object.create(TradeManager);
    const pair = args[1].toLowerCase()
    const type = args[2].toLowerCase()
    const length = args[3].toLowerCase()
    const strategy = args[4]
    const indicatorConfig = []; //WE DONT USE INDCATORS FOR BACKTEST
    this.data = this.dataManager.checkDataExists(pair, type, length)
          ? this.dataManager.loadData(pair, type, length, indicatorConfig)
          : [];
    backtester.init(
      null,
      strategy,
      this.data,
      null,
      `${pair}_${type}_${length}`,
      traderConfig
    );
    backtester.runBacktest();

  } catch(e) {
    Logger.error(e.message);
  }
    break;

  case "paper":
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
        throw "No Genome specified";
      }
  
      const pair = args[1].toLowerCase()
      const type = args[2].toLowerCase()
      const length = args[3].toLowerCase()
      const genomeName = args[4]
      runPaper(exchange, pair, type, length, genomeName, dataDir, dbExt);
  
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
        pair: args[1].toLowerCase(),
        type: args[2].toLowerCase(),
        length: args[3].toLowerCase(),
        neatConfig,
        indicatorConfig,
        traderConfig,
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
              processCandles(args[1].toLowerCase(), args[2].toLowerCase(), args[3].toLowerCase()).then(() =>
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
  await dataManager.processCandles(pair, `${pair.toLowerCase()}_${type}_${length}`, types);
}

async function runPaper(exchange, pair, type, length, genomeName, dataDir, dbExt) {
  const paperTrader = Object.create(PaperTrader);
  paperTrader.init(exchange, pair, type, length, genomeName, dataDir, dbExt);

  while(true) {
    await paperTrader.doPaper();
}
}

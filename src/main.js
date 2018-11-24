require("dotenv-safe").config();
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

const readline = require("readline");

const { sysConfig, indicatorConfig } = require("./config/config");
const ExchangeImport = require("./exchangeImporter/exchangeImporter");
const DataManager = require("./dataManager/dataManager");
const Logger = require("./logger/logger");
const Neat = require("./neat/neat");

const args = process.argv.slice(2);
const actions = ["import", "process", "ga"];

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
      neat
        .init({
          pair: args[1],
          type: args[2],
          length: args[3],
          config: sysConfig,
          indicatorConfig,
          exchange,
          dataDir,
          dbExt
        })
        .then(() => {
          if (!neat.data.length) {
            const prompt = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });
            prompt.question(
              `There is no data for ${args[1]} ${args[2]} ${
                args[3]
              } would you like it processed now? (y/n)`,
              async answer => {
                if (answer.toLowerCase() === "y") {
                  await processCandles(args[1], args[2], args[3]);
                  Logger.info("Data processed. You can run GA again.");
                } else {
                  Logger.info("Data must be processed before running GA");
                }
                process.exit();
              }
            );
          } else {
            neat.start();
          }
        });
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

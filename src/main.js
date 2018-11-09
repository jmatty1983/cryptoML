require("dotenv-safe").config();

const ExchangeImport = require("./exchangeImporter/exchangeImporter");
const DataManager = require("./dataManager/dataManager");
const Logger = require("./logger/logger");

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
      exchangeImport.init(exchange);
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

      const dataManager = Object.create(DataManager);
      dataManager.init(exchange);

      const types = args[3]
        .split(",")
        .map(length => ({ type: args[2], length }));
      dataManager.processCandles(args[1], types);
    } catch (e) {
      Logger.error(e.message);
    }
    break;
  case "ga":
    if (!args[1]) {
      throw "No pair specified";
    }

    if (!args[2]) {
      throw "No candle type specified";
    }

    if (!args[3]) {
      throw "No length specified";
    }

    const dataManager = Object.create(DataManager);
    dataManager.init(exchange);
    dataManager
      .loadCandles(
        `[${args[1].toUpperCase()}_${args[2].toLowerCase()}_${args[3].toLowerCase()}]`
      )
      .then(data => console.log(data.length));
    break;
  default:
    Logger.error(`Invalid action ${fn}. Valid options are: ${actions}`);
}

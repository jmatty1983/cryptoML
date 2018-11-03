require('dotenv-safe').config();

const ExchangeImport = require('./src/exchangeImporter/exchangeImporter');
const Logger = require('./src/logger/logger');

const args = process.argv.slice(2);
const actions = ['import'];

let fn = args[0];

//Check if a function was specified. If not throw error and exit. If so format it for processing
if (fn) {
  fn = fn.toLocaleLowerCase();
} else {
  Logger.error(`You must specify an action. Valid options are: ${actions}`);
  process.exit();
}

switch (fn) {
  case 'import':
    //import requires a pair to be specified
    if (args[1]) {
      const exchangeImport = Object.create(ExchangeImport);
      exchangeImport.init('binance');
      exchangeImport.getPair(args[1]);
    } else {
      Logger.error('No pair provided');
    }
    break;
  default:
    Logger.error(`Invalid action ${fn}. Valid options are: ${actions}`);
}

const { Network } = require("neataptic");
const { parentPort, workerData } = require("worker_threads");

const TradeManager = require("../tradeManager");

const { genome, data, trainData, traderConfig } = workerData;
const network = Network.fromJSON(genome);
const trader = Object.create(TradeManager);
trader.init(network, data, trainData, traderConfig);
const stats = trader.runTrades();
parentPort.postMessage(stats);

const { parentPort, workerData } = require("worker_threads");
const TradeManager = require("../tradeManager");

const script = workerData;

parentPort.postMessage(stats);

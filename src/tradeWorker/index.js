const { Network } = require("neataptic");
const { parentPort, workerData } = require("worker_threads");

const TradeManager = require("../tradeManager");

const { genomes, data, trainData, testData, traderConfig } = workerData;

const work = genomes.map(({ genome, id }) => {
  const network = Network.fromJSON(genome);
  const trader = Object.create(TradeManager);
  trader.init(network, data, trainData, traderConfig);
  const trainStats = trader.runTrades();
  trader.init(network, data, testData, traderConfig);
  const testStats = trader.runTrades();
  return { trainStats, testStats, id };
});

parentPort.postMessage(work);

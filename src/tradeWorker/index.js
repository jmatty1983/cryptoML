const { Network } = require("neataptic");
const { parentPort, workerData } = require("worker_threads");

const TradeManager = require("../tradeManager");

const { genomes, data, trainData, traderConfig } = workerData;

const work = genomes.map(({ genome, id }) => {
  const network = Network.fromJSON(genome);
  const trader = Object.create(TradeManager);
  trader.init(network, data, trainData, traderConfig);
  return { stats: trader.runTrades(), id };
});

parentPort.postMessage(work);

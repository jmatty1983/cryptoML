const { Network } = require("neataptic");
const { parentPort, workerData, MessagePort } = require("worker_threads");

const TradeManager = require("../tradeManager");

const {
  trainDataRaw,
  testDataRaw,
  trainData,
  testData,
  traderConfig
} = workerData;

//when the main threads hands over a port we'll setup a listener on that port
parentPort.on("message", ({ port }) => {
  //port listener, process data and close
  port.on("message", genomes => {
    const work = genomes.map(({ genome, id }) => {
      const network = Network.fromJSON(genome);
      const trader = Object.create(TradeManager);
      trader.init(network, trainDataRaw, trainData, traderConfig);
      const trainStats = trader.runTrades();
      trader.init(network, testDataRaw, testData, traderConfig);
      const testStats = trader.runTrades();
      return { trainStats, testStats, id };
    });

    port.postMessage(work);
    port.close();
  });
});

const { Network } = require("neataptic");
const { parentPort, workerData, MessagePort } = require("worker_threads");
const fs = require("fs");

const TradeManager = require("../tradeManager");

const { data, traderConfig } = workerData;

//when the main threads hands over a port we'll setup a listener on that port
parentPort.on("message", ({ port }) => {
  //port listener, process data and close
  port.on("message", genomes => {
    const work = genomes.map(({ genome, id }) => {
      const network = Network.fromJSON(genome);
      const trader = Object.create(TradeManager);
      const trainStats = data.map(current => {
        trader.init(
          network,
          current.train.candles,
          current.train.input,
          traderConfig
        );
        //console.log(current.train.candles)
        return trader.runTrades();
      });
      const testStats = data.map(current => {
        trader.init(
          network,
          current.test.candles,
          current.test.input,
          traderConfig
        );
        return trader.runTrades();
      });
      return { trainStats, testStats, id };
    });

    port.postMessage(work);
    port.close();
  });
});

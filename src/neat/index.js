const fs = require("fs");
const { Neat, methods, architect } = require("neataptic");
const os = require("os");
const { Worker, MessageChannel } = require("worker_threads");

const normaliseFunctions = {
  percentageChangeLog2: require("./normFuncs").percentChange
    .percentageChangeLog2
};

const { chunk, flatten } = require("../lib/array");
const {
  traderConfig,
  indicatorConfig,
  neatConfig
} = require("../config/config");
const DataManager = require("../dataManager");
const Logger = require("../logger");

const NeatTrainer = {
  init: function({
    exchange,
    pair,
    type,
    length,
    dataDir,
    dbExt,
    neatConfig,
    indicatorConfig
  }) {
    this.dataManager = Object.create(DataManager);
    this.dataManager.init(exchange, dataDir, dbExt);
    this.neatConfig = neatConfig;
    this.indicatorConfig = indicatorConfig;
    this.archive = [];
    this.generations = 0;
    this.highScore = -Infinity;
    this.pair = pair;
    this.type = type;
    this.length = length;
    this.workers = Array(
      parseInt(process.env.THREADS) || os.cpus().length
    ).fill(null);

    this.data = this.dataManager.checkDataExists(pair, type, length)
      ? this.dataManager.loadData(pair, type, length, indicatorConfig)
      : [];

    if (this.data.length) {
      this.neat = new Neat(this.data.length, 1, null, {
        mutation: methods.mutation.ALL,
        popsize: this.neatConfig.populationSize,
        mutationRate: this.neatConfig.mutationRate,
        network: new architect.Random(
          this.data.length,
          1,
          this.neatConfig.outputSize
        )
      });
    }
  },

  breed: function() {
    this.neat.sort();
    Logger.debug(
      `Gen: ${this.generations} - ${this.neat.population[0].score} ${
        this.neat.population[0].stats.buys
      } ${this.neat.population[0].stats.sells}`
    );
    this.neat.population = new Array(this.neat.popsize)
      .fill(null)
      .map(() => this.neat.getOffspring());

    this.neat.mutate();
  },

  getFitness: function({ currency, startCurrency }) {
    return (currency / startCurrency) * 100;
  },

  getNormalisedData: function() {
    //A little extra gymnastics because the candle data is an array of arrays. I considered
    //changing it to an object like {opens: [...], highs: [...]....} but the trade off is
    //the loss of js array functions like map, reduce etc.. without munging up the data more.
    //In the end I think this is actually cleaner even though it's not exactly clean.
    const dataToIndex = {
      opens: 0,
      highs: 1,
      lows: 2,
      closes: 3,
      volumes: 4
    };

    //This only works for norm funcs that don't need additional data stored at the moment.
    //High Low for example needs the min and max that was used to normalise the data. I need
    //to workout how I would want to store that and save it for later in an extendable way.
    const normalisedCandleData = this.neatConfig.inputs.map(
      ({ name, normFunc }) =>
        normaliseFunctions[normFunc](this.data[dataToIndex[name]])
    );
    const normalisedIndicatorData = this.data.slice(5).map((array, index) => {
      const { normFunc } = indicatorConfig[index];
      return normaliseFunctions[normFunc](array);
    });

    return [...normalisedCandleData, ...normalisedIndicatorData];
  },

  train: async function() {
    //Really considering abstracting the worker log it some where else. It doesn't really belong here.
    this.neat.population.forEach((genome, i) => (genome.id = i));
    const chunkedPop = chunk(
      this.neat.population,
      Math.ceil(this.neat.population.length / this.workers.length)
    );

    const work = chunkedPop.map((chunk, i) => {
      return new Promise((resolve, reject) => {
        const genomes = chunk.map(genome => ({
          genome: genome.toJSON(),
          id: genome.id
        }));

        const { port1, port2 } = new MessageChannel();
        this.workers[i].postMessage({ port: port1 }, [port1]);
        port2.postMessage(genomes);

        port2.on("message", data => {
          resolve(data);
          port2.close();
        });
        port2.on("error", err => {
          Logger.error(`Worker thread error ${err}`);
          reject(err);
        });
      });
    });

    const results = flatten(await Promise.all(work));
    results.forEach(({ trainStats, testStats, id }) => {
      this.neat.population[id].stats = trainStats;
      this.neat.population[id].score = this.getFitness(trainStats);
      const testScore = this.getFitness(testStats);
      if (testScore > this.highScore) {
        const data = {
          genome: this.neat.population[id].toJSON(),
          traderConfig,
          indicatorConfig,
          neatConfig
        };

        const safePairName = this.pair.replace(/[^a-z0-9]/gi, "");
        const filename = `${safePairName}_${this.type}_${
          this.length
        }_${testScore}`;
        const dir = `${__dirname}/../../genomes/${safePairName}`;
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }

        fs.writeFileSync(`${dir}/${filename}`, JSON.stringify(data));
        this.highScore = testScore;
      }
    });
  },

  start: async function() {
    Logger.info("Starting genome search");

    this.normalisedData = this.getNormalisedData();
    //Split data into 60% train, 5% gap, 35% test
    const trainAmt = Math.trunc(this.normalisedData[0].length * 0.6);
    const gapAmt = Math.trunc(this.normalisedData[0].length * 0.05);
    this.trainData = this.normalisedData.map(array => array.slice(0, trainAmt));
    this.testData = this.normalisedData.map(array =>
      array.slice(trainAmt + gapAmt)
    );

    this.workers = this.workers.map(() => {
      const newWorker = new Worker("./src/tradeWorker/index.js", {
        workerData: {
          data: this.data,
          trainData: this.trainData,
          testData: this.testData,
          traderConfig
        }
      });

      newWorker.on("exit", code => {
        if (code !== 0) {
          throw new Error(`Worker stopped with exit code ${code}`);
        }
      });

      return newWorker;
    });

    while (true) {
      await this.train();
      this.breed();
      this.generations++;
    }
  }
};

module.exports = NeatTrainer;

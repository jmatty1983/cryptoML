const fs = require("fs");
const { Neat, methods, architect } = require("neataptic");
const os = require("os");
const path = require("path");
const { Worker, MessageChannel } = require("worker_threads");

const ArrayUtils = require("../lib/array");
const {
  traderConfig,
  indicatorConfig,
  neatConfig
} = require("../config/config");
const DataManager = require("../dataManager");
const Logger = require("../logger");

const mutation = methods.mutation;
const mutations = [
  mutation.ADD_NODE,
  mutation.SUB_NODE,

  mutation.ADD_CONN,
  mutation.SUB_CONN,

  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.MOD_ACTIVATION,

  mutation.ADD_GATE,
  mutation.SUB_GATE,

  mutation.ADD_SELF_CONN,
  mutation.SUB_SELF_CONN,

  mutation.ADD_BACK_CONN,
  mutation.SUB_BACK_CONN,

  mutation.SWAP_NODES
  //  mutation.SWAP_NODES
];

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
    this.generation = 1;
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

    /*    if (this.data.length) {
      this.neat = new Neat(this.data.length, 1, null, {
        mutation: methods.mutation.ALL,
        popsize: this.neatConfig.populationSize,
        mutationRate: this.neatConfig.mutationRate,
      });

      this.neat.population = this.neat.population.map( m => new architect.Random(
          this.data.length,
          1,
          this.neatConfig.outputSize)
      )
    }*/
  },

  breed: function() {
    this.neat.sort();
    const R =
      this.neat.population[0].stats.avgWin /
      -this.neat.population[0].stats.avgLoss;
    Logger.debug(
      `Gen: ${this.generations} - ${this.neat.population[0].score} ${
        this.neat.population[0].stats.buys
      } ${this.neat.population[0].stats.sells} R:${R}`
      /*        this.generation +
        " " +
        this.neat.population[0].score +
        " " +
        this.neat.population[0].stats.buys +
        " " +
        this.neat.population[0].stats.sells +
        " " +
        this.neat.population[0].stats.avgPosAdd +
        " " +
        this.neat.population[0].stats.avgPosRem +
        " " +
        this.neat.population[0].stats.ticksWon / (this.neat.population[0].stats.ticksWon+this.neat.population[0].stats.ticksLost) +
        " W:" +
        this.neat.population[0].stats.avgWin +
        " L:" +
        this.neat.population[0].stats.avgLoss +
        " R:" +
        this.neat.population[0].stats.avgWin / -this.neat.population[0].stats.avgLoss
  */
    );
    this.neat.population = new Array(this.neat.popsize)
      .fill(null)
      .map(() => this.neat.getOffspring());

    this.neat.mutate();
  },

  getFitness: function({ currency, startCurrency, buys, sells }) {
    return (currency / startCurrency) * 100; //* (buys<2||sells<2?0:1);
  },

  train: async function() {
    //Really considering abstracting the worker log it some where else. It doesn't really belong here.
    this.neat.population.forEach((genome, i) => (genome.id = i));
    const chunkedPop = ArrayUtils.chunk(
      this.neat.population,
      Math.ceil(this.neat.population.length / this.workers.length)
    );

    //    console.log(this.workers)

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

    let results = ArrayUtils.flatten(await Promise.all(work));
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
        const filename = `${safePairName}_${this.type}_${this.length}_gen_${
          this.generation
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
    // this.normalisedPoints = this.data.map(this.dataManager.getNormalisedPoints);
    // this.normalisedData = this.data.map((array, index) =>
    // this.dataManager.normaliseArray(array, this.normalisedPoints[index])
    // );

    this.normalisedData = this.data
      .filter((_, index) => index === 2 || index === 3 || index === 4)
      .map((array, index) => {
        return array.map((_, i) => {
          return i > 0 ? Math.log2(array[i] / array[i - 1]) : 0;
        });
      });

    if (this.normalisedData.length) {
      Logger.info(
        `Creating new population. I/O size: ${this.normalisedData.length}/${
          this.neatConfig.outputSize
        }`
      );
      this.neat = new Neat(this.normalisedData.length, 1, null, {
        mutation: methods.mutation.ALL,
        popsize: this.neatConfig.populationSize,
        mutationRate: this.neatConfig.mutationRate
      });

      this.neat.population = this.neat.population.map(
        m =>
          new architect.Random(
            this.normalisedData.length,
            1,
            this.neatConfig.outputSize
          )
      );
    }

    //Split data into 60% train, 5% gap, 35% test
    const trainAmt = Math.trunc(this.normalisedData[0].length * 0.6);
    const gapAmt = Math.trunc(this.normalisedData[0].length * 0.05);
    this.trainData = this.normalisedData.map(array => array.slice(0, trainAmt));
    this.testData = this.normalisedData.map(array =>
      array.slice(trainAmt + gapAmt)
    );

    Logger.debug("Creating workers");

    const workerData = {
      data: this.data,
      trainData: this.trainData,
      testData: this.testData,
      traderConfig
    };

    this.workers = this.workers.map(() => {
      const newWorker = new Worker("./src/tradeWorker/index.js", {
        workerData: workerData
      });

      newWorker.on("exit", code => {
        if (code !== 0) {
          throw new Error(`Worker stopped with exit code ${code}`);
        }
      });

      return newWorker;
    });
    /*    function dubax(data) {
      let t = new SharedArrayBuffer(data.length)
      for( let i=0; i<data.length; i++) {
        t[i] = data[i]
      }
      return t
    }
    trainData = this.trainData.map( e=>new Float32Array(e) )
    testData = this.testData.map( e=>new Float32Array(e) )

    this.trainData = trainData
    this.testData = testData*/

    while (true) {
      await this.train();
      this.breed();
      this.generation++;
    }
  }
};

module.exports = NeatTrainer;

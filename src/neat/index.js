// TODO: Maintain a population of live/paper trading candidates
// TODO: Normalisation of Novelty Search objectives

const fs = require("fs");
const { Neat, methods, architect } = require("neataptic");
const os = require("os");
const path = require("path");
const { Worker, MessageChannel } = require("worker_threads");

const GBOS = require("GBOS-js");
const noveltySearch = require("./noveltySearch");

const ArrayUtils = require("../lib/array");
const {
  traderConfig,
  indicatorConfig,
  neatConfig
} = require("../config/config");
const DataManager = require("../dataManager");
const Logger = require("../logger");

// eww

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
    this.generation = 0;
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
    {
      Logger.debug(`Generation ${this.generation}`);
      this.neat.population
        .filter((g, index) => index < 6)
        .forEach(g => {
          const PL = 100 * g.stats.profit;
          Logger.debug(
            `G${g.generation}\t- ${g.rank} ${PL} ${g.stats.novelty} ${
              g.stats.buys
            } ${g.stats.sells} ${g.stats.avgPosAdd} ${g.stats.avgPosRem} ${
              g.stats.winRate
            }`
          );
        });
    }

    let dupes = 0;
    this.neat.population = new Array(this.neat.popsize).fill(null).map(() => {
      let offspring = null;
      dupes--;
      do {
        offspring = this.neat.getOffspring();
        dupes++;
      } while (
        this.parentPopulation.some(
          genome =>
            JSON.stringify(genome.toJSON()) ===
            JSON.stringify(offspring.toJSON())
        )
      );
      return offspring;
    });

    this.neat.mutate();

    /*    this.neat.population = this.neat.population
      .filter( (genome,index) => this.neat.population
        .some( (genome2,index2) => {
          return !(index2>index && JSON.stringify(genome.toJSON()) === JSON.stringify(genome2.toJSON()))
        })
      )*/

    /*    if (dupes) {
      Logger.debug(
        `Discarded & rebred ${dupes}`
      );
    }*/
  },

  getFitness: function({ profit, buys, sells }) {
    return (profit - 1) * 100 * Math.atan(buys * sells);
  },

  //

  processStatistics: function(results) {
    results.forEach(({ trainStats, testStats, id }) => {
      this.neat.population[id].stats = trainStats;
      this.neat.population[
        id
      ].noveltySearchObjectives = this.neatConfig.noveltySearchObjectives.map(
        objective => trainStats[objective]
      );
    });

    if (this.noveltySearchArchive === undefined) {
      this.noveltySearchArchive = [];
    }

    if (this.parentPopulation === undefined) {
      this.parentPopulation = [];
    }
    this.neat.population = [...this.neat.population, ...this.parentPopulation];

    const nsObj = this.neat.population.map(
      genome => genome.noveltySearchObjectives
    );

    const archive = this.noveltySearchArchive.map(
      genome => genome.noveltySearchObjectives
    );

    const novelties = noveltySearch(nsObj, archive, 1.75);

    this.neat.population.forEach((genome, index) => {
      genome.stats.novelty = novelties[index];
      if (!genome.sortingObjectives) {
        genome.sortingObjectives = this.neatConfig.sortingObjectives.map(
          objective => -results[index].trainStats[objective]
        ); // maximization of objectives requires a sign flip here
      }
    });

    //    this.neat.population.sort( (a,b) => b.stats.novelty - a.stats.novelty )

    // Logger.debug(this.noveltySearchArchive.length)

    // Logger.debug(this.neat.population.length)

    const toSort = this.neat.population.map(genome => genome.sortingObjectives);
    GBOS(toSort).forEach((rank, index) => {
      this.neat.population[index].score = -rank;
      this.neat.population[index].rank = rank;
    });

    this.neat.sort();

    for (let i = 0; i < 4; i++) {
      this.noveltySearchArchive.push(
        this.neat.population[
          Math.floor(Math.random() * this.neat.population.length)
        ]
      );
      //      console.log(this.neat.population[i].stats.novelty)//this.neat.population[i].noveltySearchObjectives)
      this.noveltySearchArchive
        .push
        // this.neat.population[i]
        ();
    }
    this.neat.population.length = this.neatConfig.populationSize;
    this.parentPopulation = this.neat.population;
  },

  //

  train: async function() {
    //Really considering abstracting the worker log it some where else. It doesn't really belong here.
    this.neat.population.forEach((genome, i) => {
      genome.generation = this.generation;
      genome.id = i;
      genome.clear();
    });

    const chunkedPop = ArrayUtils.chunk(
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

    let results = ArrayUtils.flatten(await Promise.all(work));
    this.processStatistics(results);

    results.forEach(({ trainStats, testStats, id }) => {
      const testScore = testStats.profit;
      if (testScore > this.highScore && trainStats.profit > 1) {
        const data = {
          genome: this.neat.population[id].toJSON(),
          trainStats,
          testStats,
          traderConfig,
          indicatorConfig,
          neatConfig
        };

        const safePairName = this.pair.replace(/[^a-z0-9]/gi, "");
        const filename = `${safePairName}_${this.type}_${this.length}_gen_${
          this.generation
        }_id_${id}_${testStats.profit * 100}`;
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

    // Candle differential / ratio
    this.normalisedData = this.data
      .filter((_, index) => index === 2 || index === 3 || index === 4)
      .map((array, index) => {
        return array.map((_, i) => {
          return i > 0 ? array[i] / array[i - 1] : 1;
        });
      });
    // diff of diff
    /*    this.normalisedData2 = this.normalisedData.map((array, index) => {
      return array.map((_, i) => {
        return i > 0 ? array[i] / array[i - 1] : 1;
      });
    });
*/
    // Log2 of both
    // this.normalisedData = [...this.normalisedData, ...this.normalisedData2];
    this.normalisedData = this.normalisedData.map(array =>
      array.map(v => Math.log2(v))
    );

    // this.normalisedData
    // .forEach( array => Logger.debug( array.reduce( (acc,val) => acc+val,0) / array.length))

    if (this.normalisedData.length) {
      Logger.info(
        `Creating new population. I/O size: ${this.normalisedData.length}/${
          this.neatConfig.outputSize
        }`
      );
      this.neat = new Neat(this.normalisedData.length, 1, null, {
        mutation: mutations, //methods.mutation.ALL,
        popsize: this.neatConfig.populationSize,
        mutationRate: this.neatConfig.mutationRate,
        mutationAmount: this.neatConfig.mutationAmount,
        selection: methods.selection.TOURNAMENT,
        clear: true
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
    const trainAmt = Math.trunc(this.normalisedData[0].length * 0.75);
    const gapAmt = Math.trunc(this.normalisedData[0].length * 0.05);
    this.trainData = this.normalisedData.map(array => array.slice(0, trainAmt));
    this.testData = this.normalisedData.map(array =>
      array.slice(trainAmt + gapAmt)
    );

    const workerData = {
      data: this.data,
      trainData: this.trainData,
      testData: this.testData,
      traderConfig
    };

    this.workers = this.workers.map(() => {
      const newWorker = new Worker("./src/tradeWorker/index.js", {
        workerData
      });

      newWorker.on("exit", code => {
        if (code !== 0) {
          throw new Error(`Worker stopped with exit code ${code}`);
        }
      });

      return newWorker;
    });

    while (true) {
      this.generation++;
      await this.train();
      this.breed();
    }
  }
};

module.exports = NeatTrainer;

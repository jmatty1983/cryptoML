const express = require("express");
const fs = require("fs");
const path = require("path");

const Neat = require("../../src/neat");
const DataManager = require("../../src/dataManager");

const router = express.Router();
const exchange = "binance";
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

//Route to get candle data for a chart
router.get("/chart/:table", (req, res) => {
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const candles = dataManager.loadCandles(
    `[${decodeURIComponent(req.params.table)}]`
  );

  res.json(candles);
});

//Route to get a list of genomes
router.get("/genomes", (req, res) => {
  const genomeDir = "./genomes/";

  const walkSync = dir =>
    fs.readdirSync(dir).reduce((files, file) => {
      const name = path.join(dir, file);
      return fs.statSync(name).isDirectory()
        ? [...files, ...walkSync(name)]
        : [...files, name];
    }, []);

  const genomeList = walkSync(genomeDir);

  const genomesFinal = genomeList.map(genome => ({
    name: genome,
    data: JSON.parse(fs.readFileSync(`./${genome}`, "utf8"))
  }));

  res.json(genomesFinal);
});

router.get("/candles", (req, res) => {
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const tables = dataManager.getCandleTables();

  res.json(tables);
});

router.get("/garun/:candle", (req, res) => {
  const neat = Object.create(Neat);
  const table = decodeURIComponent(req.params.candle);
  const args = table.split("_");

  neat.init({
    pair: args[0],
    type: args[1],
    length: args[2],
    exchange,
    dataDir,
    dbExt
  });

  neat.getEventEmitter().on("update", data => {
    const extractStats = ({ generation, stats, testStats }) => ({
      generation,
      stats,
      testStats
    });

    const toEmit = {
      generation: data.generation,
      candidates: data.candidates.map(extractStats),
      parents: data.parents.map(extractStats)
    };

    req.app.io.emit("msg", toEmit);
  });

  neat.start();
  res.send("starting ga");
});

module.exports = router;

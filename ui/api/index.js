const express = require("express");
const fs = require("fs");
const path = require("path");

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
  res.setHeader("Content-Type", "application/json");
  res.json(candles);
});

//Route to get a list of genomes
router.get("/genomes/", (req, res) => {
  const genomeDir = "./genomes/";
  const genomesFinal = [];

  const walkSync = dir =>
    fs.readdirSync(dir).reduce((files, file) => {
      const name = path.join(dir, file);
      return fs.statSync(name).isDirectory()
        ? [...files, ...walkSync(name)]
        : [...files, name];
    }, []);

  const genomeList = walkSync(genomeDir);

  genomeList.map(genome => {
    const name = `./${genome}`;
    const genomeData = JSON.parse(fs.readFileSync(name, "utf8"));
    genomesFinal.push({ name: genome, data: genomeData });
  });

  res.json(genomesFinal);
});

router.get("/candles", (req, res) => {
  console.log("sumfin");
});

module.exports = router;

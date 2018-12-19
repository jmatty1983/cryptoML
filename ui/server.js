require("dotenv-safe").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const webpackConfig = require("../webpack.config");
const compiler = webpack(webpackConfig);

const DataManager = require("../src/dataManager");

const exchange = "binance";
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

const app = express();

app.use(
  require("webpack-dev-middleware")(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  })
);
app.use(require("webpack-hot-middleware")(compiler));
app.use(express.static(path.join(__dirname, "./dist")));

app.get("/chart/json/:table", (req, res) => {
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const candles = dataManager.loadCandles(
    `[${decodeURIComponent(req.params.table)}]`
  );
  res.setHeader("Content-Type", "application/json");
  res.json(candles);
});

app.get("/api/genomes/", (req, res) => {
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
    const name = `${genomeDir}${genome.split("_")[0]}/${genome}`;
    const genomeData = JSON.parse(fs.readFileSync(name, "utf8"));
    genomesFinal.push({ name: genome, data: genomeData });
  });

  res.json(genomesFinal);
});

app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "./dist/index.html"))
);

app.listen(3000, () => console.log("App listening on port 3000!"));

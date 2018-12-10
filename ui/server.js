require("dotenv-safe").config();

const express = require("express");
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

//none of this is necessary
//=======
app.get("/json/:coin/:asset/:type/:length", (req, res) => {
  //let table = "BCHSV/USDT"
  //let pair = 'BCHSV/USDT';
  let pair = req.params.coin + "/" + req.params.asset;
  //let type = 'tick';
  //let length = '100';
  //let indicators = [];
  //const pair = req.params.pair;
  const type = req.params.type;
  const length = req.params.length;
  const indicators = req.params.indicators;
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  //const data = dataManager.loadCandles(table)
  const data = dataManager.loadData(pair, type, length, indicators);
  res.setHeader("Content-Type", "application/json");
  res.json(data);
});
//=======

app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "./dist/index.html"))
);

app.listen(3000, () => console.log("App listening on port 3000!"));

require("dotenv-safe").config();

const express = require("express");
const path = require("path");
const webpack = require("webpack");
const webpackConfig = require("../webpack.config");
const compiler = webpack(webpackConfig);
const fs = require("fs");

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
  const genomeList = [];

  //DIRWALK w/ SUB DIRS.
  const walkSync = function(dir, filelist) {
    files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        filelist = walkSync(path.join(dir, file), filelist);
      } else {
        filelist.push(file);
        //genomeList.push(file);
      }
    });
    return filelist;
  };

  //RETURN ARRAY OF GENOME NAMES IN ALL SUBDIRS
  walkSync(genomeDir, genomeList);

  //RETURN OBJECT WITH NAME, DATA
  genomeList.map(genome => {
    const genomeDir = "./genomes/";
    const genomeSplit = genome.split("_");
    const genomeSplitDir = genomeSplit[0].concat("/");
    const finalDir = genomeDir.concat(genomeSplitDir);
    const finalName = finalDir.concat(genome);
    const genomeData = JSON.parse(fs.readFileSync(finalName, "utf8"));
    //console.log
    genomesFinal.push({ name: genome, data: genomeData });
  });

  res.json(genomesFinal);
});

/*app.get("/api/genome/:genome", (req, res) => {
  const genomeDir = "./genomes/";
  const genome = req.params.genome;
  const genomeSplit = genome.split("_");
  console.log(genomeSplit[0]);
  const genomeSplitDir = genomeSplit[0].concat("/");
  const finalDir = genomeDir.concat(genomeSplitDir);
  const finalName = finalDir.concat(genome);
  console.log(finalName);
  function readJSONFile(filename, callback) {
    fs.readFile(filename, function(err, data) {
      if (err) {
        callback(err);
        return;
      }
      try {
        callback(null, JSON.parse(data));
      } catch (exception) {
        callback(exception);
      }
    });
  }

  readJSONFile(finalName, function(err, json) {
    if (err) {
      throw err;
    }
    console.log(json);
    res.setHeader("Content-Type", "application/json");
    res.json(json);
  });
});

app.get("/api/genomes/", (req, res) => {
  const genomeDir = "./genomes/";

  const walkSync = function(dir, filelist) {
    files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        filelist = walkSync(path.join(dir, file), filelist);
      } else {
        filelist.push(file);
      }
    });
    return filelist;
  };

  res.setHeader("Content-Type", "application/json");
  res.json(walkSync(genomeDir));
});*/

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

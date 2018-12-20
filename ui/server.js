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

//Middleware for hot module reloading
app.use(
  require("webpack-dev-middleware")(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  })
);
app.use(require("webpack-hot-middleware")(compiler));
app.use(express.static(path.join(__dirname, "./dist")));

//Route to get candle data for a chart
app.get("/api/chart/:table", (req, res) => {
  const dataManager = Object.create(DataManager);
  dataManager.init(exchange, dataDir, dbExt);
  const candles = dataManager.loadCandles(
    `[${decodeURIComponent(req.params.table)}]`
  );
  res.setHeader("Content-Type", "application/json");
  res.json(candles);
});

//Route to get a list of genomes
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
    const name = `./${genome}`;
    const genomeData = JSON.parse(fs.readFileSync(name, "utf8"));
    genomesFinal.push({ name: genome, data: genomeData });
  });

  res.json(genomesFinal);
});

//Base route to serve react app
app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "./dist/index.html"))
);

app._router.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  }
});
console.log("\n");

const server = app.listen(3000, () =>
  console.log("App listening on port 3000!")
);
const io = require("socket.io").listen(server);

io.on("connection", socket => {
  setInterval(() => socket.emit("msg", "POC Testing"), 2000);
  socket.on("disconnect", () => console.log("Client disconnected"));
});

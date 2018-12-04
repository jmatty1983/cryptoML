require("dotenv-safe").config();

const express = require("express");
const next = require("next");

const DataManager = require("../src/dataManager");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dir: "./ui", dev });
const handle = app.getRequestHandler();

let exchange = "binance";
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

app
  .prepare()
  .then(() => {
    const server = express();

    server.get("/chart/:table", (req, res) => {
      const actualPage = "/Chart";
      const queryParams = {
        table: encodeURIComponent(req.params.table)
      };
      app.render(req, res, actualPage, queryParams);
    });

    server.get("/chart/json/:table", (req, res) => {
      const dataManager = Object.create(DataManager);
      dataManager.init(exchange, dataDir, dbExt);
      const candles = dataManager.loadCandles(
        `[${decodeURIComponent(req.params.table)}]`
      );
      res.send(JSON.stringify(candles));
    });

    server.get("*", (req, res) => handle(req, res));

    server.listen(3000, err => {
      if (err) {
        throw err;
      }

      console.log("> Ready on http://localhost:3000");
    });
  })
  .catch(ex => {
    console.error(ex.stack);
    process.exit(1);
  });

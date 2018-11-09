const db = require("sqlite3");
const _ = require("lodash");

const Logger = require("../logger/logger");

const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;
const limit = 100000;

const DataManager = {
  /**
   * Constructor for OLOO style behavior delgation.
   * @param {string} dbFile - data base file name
   */
  init: function(dbFile) {
    if (!dbFile || !dataDir || !dbExt) {
      Logger.error("Database or exchange is undefined");
    } else {
      this.dbFile = dbFile;
    }

    Logger.info("Data manager initialized.");
  },

  /**
   * Builds candles of different types
   * @param {string tick|time|volume|currency} type - type of candle
   * @param {integer} length - length of candle
   * @param {array{}} data - array of trade objects
   *
   * @returns {promise} Promise object contains {candles - new candles, remaineder - unprocessed trades at tail end}
   */
  buildCandles: function({ type, length, rows }) {
    return new Promise(resolve => {
      switch (type) {
        case "tick":
          const tickChunks = _.chunk(rows, length);
          const tickRemainder =
            tickChunks[tickChunks.length - 1].length < length
              ? tickChunks.pop()
              : null;
          const tickCandles = tickChunks.map(trades => this.makeCandle(trades));
          resolve({ candles: tickCandles, tickRemainder });
          break;
        case "time":
          length = this.convertLengthToTime(length);
          if (!length) {
            throw "Invalid time duration";
          }
        case "volume":
        case "currency":
          const toChunks = this.makeToChunksReducer(type, length);
          const chunks = rows.reduce(toChunks, [[]]);
          const remainder = chunks.pop();
          const candles = chunks.map(trades => this.makeCandle(trades));
          resolve({ candles, remainder });
          break;
        default:
          throw `Invalid candle type ${type}`;
      }
    });
  },

  /**
   * Converts a length string like 5s, 5m, 5h, 5d to milliseconds
   * @param {string} length
   * @returns {integer}
   */
  convertLengthToTime: function(length) {
    const unit = length[length.length - 1];
    const number = length.slice(0, -1);
    switch (unit) {
      case "s":
        return number * 1000;
      case "m":
        return number * 1000 * 60;
      case "h":
        return number * 1000 * 60 * 60;
      case "d":
        return number * 1000 * 60 * 60 * 24;
      default:
        return null;
    }
  },

  /**
   * Returns a live sqlite connection
   * @returns {sqlite3 connection instance}
   */
  getDb: function() {
    const dbConn = new db.Database(`${dataDir}${this.dbFile}${dbExt}`);
    dbConn.run("PRAGMA journal_mode = WAL");
    return dbConn;
  },

  /**
   * Returns largest tradeId
   * @param {string} table
   * @returns {integer}
   */
  getNewestTrade: function(table) {
    return new Promise(resolve => {
      dbConn = this.getDb();
      dbConn.each(
        `SELECT MAX(tradeId) as lastId FROM [${table}] LIMIT 1`,
        [],
        (err, row) => resolve(row && row.lastId ? row.lastId : 0)
      );
      dbConn.close();
    });
  },

  loadCandles: function({
    table,
    fromId,
    fromTime,
    tick,
    time,
    volume,
    currency
  }) {
    if (!fromId && !fromTime) {
      fromId = 1;
    }

    if (!tick && !time && !volume && !currency) {
      tick = 233;
    }

    //const dbConn = this.getDb();

    if (tick) {
      //TODO: Tick Candles
    } else if (time) {
      //TODO: Time candles
    } else if (volume) {
      //TODO: Volume candles
    } else if (currency) {
      //TODO: Currency candles
    }
  },

  /**
   * Candle is a candle is a candle is a candle. All get built the same, only difference is
   * how we decide which trades to build them from
   * @param {array{}} - array of trade objects
   * @returns {object} - returns a candle object of type OHLCV
   */
  makeCandle: function(trades) {
    return trades.reduce(
      (acc, trade) => {
        acc.open = acc.open || trade.price;
        acc.close = trade.price;
        acc.high = trade.price > acc.high ? trade.price : acc.high;
        acc.low = trade.price < acc.low ? trade.price : acc.low;
        acc.volume += trade.quantity;
        acc.tradeId = acc.tradeId;
        return acc;
      },
      { volume: 0, high: 0, low: Infinity }
    );
  },

  /**
   * Makes a comparator to be used in making chunks for candle processing
   * @param {string} type - time|volume|currency
   * @param {integer} length - length for determining candle boundries
   * @return {function} - returns a comparater function with two inputs
   * the first is the current trade to check and the second is the current chunk being checked
   * to see if it can have the trade added or if a new candle needs to be started
   */
  makeChunkComparator: function(type, length) {
    switch (type) {
      case "time":
        return (trade, chunk) => trade.timestamp - chunk[0].timestamp < length;
      case "volume":
        return (trade, chunk) =>
          chunk.reduce((total, item) => (total += item.quantity), 0) +
            trade.quantity <
          length;
      case "currency":
        return (trade, chunk) =>
          chunk.reduce(
            (total, item) => (total += item.price * item.quantity),
            0
          ) +
            trade.price * trade.quantity <
          length;
    }
  },

  /**
   * Makes a reducer for candle processing
   * @param {string} type - time|volume|currency
   * @param {integer} length - sets the boundry for creating a new candle
   * @returns {function} - returns a reducer function to be used for creating
   * chunks for candle processing
   */
  makeToChunksReducer: function(type, length) {
    const comparator = this.makeChunkComparator(type, length);

    return (chunks, row) => {
      const current = chunks[chunks.length - 1];

      if (current.length) {
        if (comparator(row, current)) {
          current.push(row);
        } else {
          //These could be optimized but to be honest I ran out of patience with it.
          //I tested and they appear to be working. I might revisit in the future
          //... but probably not.
          if (type === "volume") {
            const total = current.reduce(
              (total, item) => (total += item.quantity),
              0
            );
            const firstHalf = {
              ...row,
              quantity: length - total
            };
            const secondHalf = {
              ...row,
              quantity: row.quantity - firstHalf.quantity
            };
            current.push(firstHalf);
            chunks.push([secondHalf]);
          } else if (type === "currency") {
            const total = current.reduce(
              (total, item) => (total += item.price * item.quantity),
              0
            );
            const firstHalf = {
              ...row,
              quantity: (length - total) / row.price
            };
            const secondHalf = {
              ...row,
              quantity: row.quantity - firstHalf.quantity
            };
            current.push(firstHalf);
            chunks.push([secondHalf]);
          } else {
            chunks.push([row]);
          }
        }
      } else {
        current.push(row);
      }

      return chunks;
    };
  },

  /**
   * @param {string} table - table to process from
   * @param {array{}} types - array of candles to process into
   * types need to be in the format:
   * [{
   *   type: tick|time|volume|currency,
   *   length: number
   * }]
   */
  processCandles: async function(table, types) {
    try {
      let rowLen;
      const dbConn = this.getDb();
      dbConn.serialize(() => {
        for (let i = 0; i < types.length; i++) {
          dbConn.run(
            `DROP TABLE IF EXISTS [${table}_${types[i].type}_${
              types[i].length
            }]`
          );
        }
      });

      await new Promise(resolve => dbConn.close(resolve));
      let remainders = {};
      let offset = 0;
      do {
        rowLen = new Promise(resolve => {
          const dbConn = this.getDb();
          dbConn.all(
            `SELECT * FROM [${table}] ORDER BY tradeId ASC LIMIT ${limit} OFFSET ${offset}`,
            [],
            async (err, rows) => {
              const candles = types.map(({ type, length }) => {
                if (err) {
                  throw err;
                }

                return new Promise(async resolve => {
                  const extra = remainders[`${table}_${type}_${length}`]
                    ? remainders[`${table}_${type}_${length}`]
                    : [];

                  const built = await this.buildCandles({
                    type,
                    length,
                    rows: [...extra, ...rows]
                  });
                  resolve({ type, length, built });
                });
              });
              dbConn.close();

              const allCandles = await Promise.all(candles);
              //this makes me so unhappy
              remainders = {};
              for (let i = 0; i < allCandles.length; i++) {
                const { type, length, built } = allCandles[i];
                await this.storeCandles(
                  `${table}_${type}_${length}`,
                  built.candles
                );
                remainders[`${table}_${type}_${length}`] = built.remainder;
              }
              offset += limit;
              resolve(rows.length);
            }
          );
        });
      } while ((await rowLen) === limit);
    } catch (e) {
      Logger.error(e.message);
    }
  },

  /**
   * Stores candle data
   * @param {string} table - table name
   * @param {array{}} candles - array of candle objects
   */
  storeCandles: async function(table, candles) {
    return new Promise(resolve => {
      try {
        if (!this.dbFile) {
          throw "Database file unspecified";
        }

        const dbConn = this.getDb();
        dbConn.serialize(() => {
          dbConn.run(
            `CREATE TABLE IF NOT EXISTS [${table}] (id INTEGER PRIMARY KEY AUTOINCREMENT, open REAL, close REAL, high REAL, low REAL, volume REAL, tradeId INTEGER)`
          );
          dbConn.run("BEGIN TRANSACTION");
          const insertStmt = dbConn.prepare(
            `INSERT INTO [${table}] (open, close, high, low, volume, tradeId) VALUES (?, ?, ?, ?, ?, ?)`
          );
          candles.forEach(({ open, close, high, low, volume, tradeId }) =>
            insertStmt.run(open, close, high, low, volume, tradeId)
          );
          insertStmt.finalize();
          dbConn.run("COMMIT");
        });
        dbConn.close(resolve);

        Logger.debug(`${candles.length} added to ${table}`);
      } catch (e) {
        Logger.error(e.message);
      }
    });
  },

  /**
   * Stores a batch of trades in the sqlite db
   * @param {array} batch - batch of trades
   */
  storeTrades: async function(batch) {
    try {
      return new Promise(resolve => {
        if (!this.dbFile) {
          throw "Database file unspecified";
        }

        if (!batch || !batch.length) {
          throw "Data must be specified and an array";
        }

        const dbConn = this.getDb();
        const table = `${batch[0].symbol}`;
        dbConn.serialize(() => {
          dbConn.run(
            `CREATE TABLE IF NOT EXISTS [${table}] (id INTEGER PRIMARY KEY AUTOINCREMENT, tradeId INTEGER, timestamp INTEGER, price REAL, quantity REAL)`
          );
          dbConn.run(
            `CREATE UNIQUE INDEX IF NOT EXISTS [${table}_tradeId] ON [${table}] (tradeId)`
          );
          dbConn.run("BEGIN TRANSACTION");
          const insertStmt = dbConn.prepare(
            `INSERT INTO [${table}] (tradeId, timestamp, price, quantity) VALUES (?, ?, ?, ?)`
          );
          batch.forEach(trade =>
            insertStmt.run(
              trade.id,
              trade.timestamp,
              trade.info.p,
              trade.info.q
            )
          );
          insertStmt.finalize();
          dbConn.run("COMMIT");
        });

        dbConn.close(resolve);
        Logger.debug(`${batch.length} rows inserted into table`);
      });
    } catch (e) {
      Logger.error(e.message);
    }
  }
};

module.exports = DataManager;

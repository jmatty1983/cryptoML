const db = require("better-sqlite3");

const ArrayUtils = require("../lib/array");
const Indicators = require("./indicators");
const Logger = require("../logger");

const limit = 100000;

const DataManager = {
  /**
   * Constructor for OLOO style behavior delgation.
   * @param {string} dbFile - data base file name
   */
  init: function(dbFile, dataDir, dbExt) {
    if (!dbFile || !dataDir || !dbExt) {
      Logger.error("Database or exchange is undefined");
    } else {
      this.dbFile = dbFile;
      this.dataDir = dataDir;
      this.dbExt = dbExt;
    }

    Logger.info("Data manager initialized.");
  },

  /**
   * Builds candles of different types
   * @param {string tick|time|volume|currency} type - type of candle
   * @param {integer} length - length of candle
   * @param {array{}} data - array of trade objects
   *
   * @returns {object} object contains {candles - new candles, remaineder - unprocessed trades at tail end}
   */
  buildCandles: function({ type, length, rows }) {
    switch (type) {
      case "tick":
        const tickChunks = ArrayUtils.chunk(rows, length);
        const tickRemainder =
          tickChunks[tickChunks.length - 1].length < length
            ? tickChunks.pop()
            : null;
        const tickCandles = tickChunks.map(trades => this.makeCandle(trades));
        return { candles: tickCandles, remainder: tickRemainder };
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
        return { candles, remainder };
      default:
        throw `Invalid candle type ${type}`;
    }
  },

  /**
   * Checks if a table exists already for the pair and candle type
   *
   * @param {string} pair - Pair to check if data exists for
   * @param {string} type - Tick|Time|Volume|Currency
   * @param {string} length - Length of candle to check for
   * @returns {boolean}
   */
  checkDataExists: function(pair, type, length) {
    const table = type ? `${pair}_${type}_${length}` : `${pair}`;
    const ret = this.getDb()
      .prepare(
        `SELECT count(*) AS num FROM sqlite_master WHERE type = 'table' AND name = '${table}'`
      )
      .get();

    return ret && ret.num;
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
  getDb: /* istanbul ignore next */ function() {
    const dbConn = db(`${this.dataDir}${this.dbFile}${this.dbExt}`);
    dbConn.prepare("PRAGMA journal_mode = WAL").run();
    return dbConn;
  },

  /**
   * Returns largest tradeId
   * @param {string} table
   * @returns {integer}
   */
  getNewestTrade: function(table) {
    if (this.checkDataExists(table)) {
      const ret = this.getDb()
        .prepare(`SELECT MAX(tradeId) as lastId FROM [${table}] LIMIT 1`)
        .get();

      return ret.lastId;
    } else {
      return 0;
    }
  },

  /**
   * Returns an object with keys min and max for the minimum and maximum values of an array
   *
   * @param {Array} array - array of numbers
   * @returns {Object {min, max}}
   */
  getNormalisedPoints: function(array) {
    return {
      min: Math.min(...array),
      max: Math.max(...array)
    };
  },

  /**
   * Loads candles from the data base
   * @param {string} table - Table name
   * @param {integer=0} from - tradeId to start from - ignored for now
   * @returns {array} - returns an array of candles
   */
  loadCandles: function(table, from = 0) {
    return this.getDb()
      .prepare(`SELECT * FROM ${table} WHERE id > ${from} ORDER BY tradeId`)
      .all();
  },

  /**
   * Loads candle data
   *
   * @param {string} pair - string value of pair to load
   * @param {string} type - type of candle to load
   * @param {string} length - length of candle
   * @param {array} indicators - indicators to use
   *
   * @return {array[array]} - an array of arrays with open, close, high, low, volume and any indicators requested
   */
  loadData: function(pair, type, length, indicators = []) {
    const candles = this.loadCandles(
      `[${pair.toUpperCase()}_${type.toLowerCase()}_${length.toLowerCase()}]`
    );
    let candleArrays = [
      ArrayUtils.getProp("open", candles),
      ArrayUtils.getProp("close", candles),
      ArrayUtils.getProp("high", candles),
      ArrayUtils.getProp("low", candles),
      ArrayUtils.getProp("volume", candles)
    ];

    indicators.forEach(indicator =>
      candleArrays.push(
        Indicators[indicator.name](...indicator.params, candleArrays)
      )
    );

    //When using different indicators it can take a few candles until they're able to output values.
    //So we cut off the front of everything longer than the shortest array so the values will all line
    //up with the appropriate candles.
    const minLength = Math.min(...candleArrays.map(array => array.length));
    candleArrays = candleArrays.map(array =>
      array.slice(array.length - minLength, array.length)
    );
    return candleArrays;
  },

  /**
   * Candle is a candle is a candle is a candle. All get built the same, only difference is
   * how we decide which trades to build them from
   * @param {array{}} - array of trade objects
   * @returns {object} - returns a candle object of type OHLCV tradeId startTime endTime
   */
  makeCandle: function(trades) {
    return trades.reduce(
      (candle, trade) => {
        candle.startTime = candle.startTime || trade.timestamp;
        candle.endTime = trade.timestamp;
        candle.open = candle.open || trade.price;
        candle.close = trade.price;
        candle.high = trade.price > candle.high ? trade.price : candle.high;
        candle.low = trade.price < candle.low ? trade.price : candle.low;
        candle.volume += trade.quantity;
        candle.tradeId = trade.tradeId;
        return candle;
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
   * Returns an array of normalised data between 0 and 1
   *
   * @param {Array} array - array of numbers
   * @param {Object {min, max}} - an object with a min and max number to normalise data with
   * @returns {Array}
   */
  normaliseArray: function(array, { min, max }) {
    return array.map(n => (n - min) / (max - min));
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
  processCandles: function(table, types) {
    types.forEach(({ type, length }) =>
      this.getDb()
        .prepare(`DROP TABLE IF EXISTS [${table}_${type}_${length}]`)
        .run()
    );

    let remainders = {};
    let offset = 0;
    let rowLen = 0;
    do {
      const rows = this.getDb()
        .prepare(
          `SELECT * FROM [${table}] ORDER BY tradeId ASC LIMIT ${limit} OFFSET ${offset}`
        )
        .all();

      rowLen = rows.length;
      const candles = types.map(({ type, length }) => {
        const extra = remainders[`${table}_${type}_${length}`]
          ? remainders[`${table}_${type}_${length}`]
          : [];

        const built = this.buildCandles({
          type,
          length,
          rows: [...extra, ...rows]
        });
        return { type, length, built };
      });

      remainders = candles.reduce((remainderObj, { type, length, built }) => {
        this.storeCandles(`${table}_${type}_${length}`, built.candles);
        remainderObj[`${table}_${type}_${length}`] = built.remainder;
        return remainderObj;
      }, {});
      offset += limit;
    } while (rowLen === limit);
  },

  /**
   * Stores candle data
   * @param {string} table - table name
   * @param {array{}} candles - array of candle objects
   */
  storeCandles: function(table, candles) {
    try {
      if (!this.dbFile) {
        throw "Database file unspecified";
      }

      const dbConn = this.getDb();
      dbConn
        .prepare(
          `CREATE TABLE IF NOT EXISTS [${table}] (id INTEGER PRIMARY KEY AUTOINCREMENT, open REAL, close REAL, high REAL, low REAL, volume REAL, tradeId INTEGER, startTime INTEGER, endTime INTEGER)`
        )
        .run();

      const insertStmt = dbConn.prepare(
        `INSERT INTO [${table}] (open, close, high, low, volume, tradeId, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      dbConn.transaction(() => {
        candles.forEach(
          ({ open, close, high, low, volume, tradeId, startTime, endTime }) =>
            insertStmt.run(
              open,
              close,
              high,
              low,
              volume,
              tradeId,
              startTime,
              endTime
            )
        );
      })();
      Logger.debug(`${candles.length} added to ${table}`);
    } catch (e) {
      Logger.error(e.message);
    }
  },

  /**
   * Stores a batch of trades in the sqlite db
   * @param {array} batch - batch of trades
   */
  storeTrades: function(batch) {
    try {
      if (!this.dbFile) {
        throw "Database file unspecified";
      }

      if (!batch || !batch.length) {
        throw "Data must be specified and an array";
      }

      const dbConn = this.getDb();
      const table = `${batch[0].symbol}`;
      dbConn
        .prepare(
          `CREATE TABLE IF NOT EXISTS [${table}] (id INTEGER PRIMARY KEY AUTOINCREMENT, tradeId INTEGER, timestamp INTEGER, price REAL, quantity REAL)`
        )
        .run();

      dbConn
        .prepare(
          `CREATE UNIQUE INDEX IF NOT EXISTS [${table}_tradeId] ON [${table}] (tradeId)`
        )
        .run();

      const insertStmt = dbConn.prepare(
        `INSERT INTO [${table}] (tradeId, timestamp, price, quantity) VALUES (?, ?, ?, ?)`
      );
      dbConn.transaction(() => {
        batch.forEach(({ id, timestamp, info }) =>
          insertStmt.run(id, timestamp, info.p, info.q)
        );
      })();

      Logger.debug(`${batch.length} rows inserted into table`);
    } catch (e) {
      Logger.error(e.message);
    }
  }
};

module.exports = DataManager;

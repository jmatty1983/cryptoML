const db = require('sqlite3');
const _ = require('lodash');

const Logger = require('../logger/logger');

const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;
const limit = 100000;

const DataManager = {
  /**
   * Constructor for OLOO style behavior delgation.
   * @param {string} dbFile - data base file name
   */
  init: function (dbFile) {
    if (!dbFile || !dataDir || !dbExt) {
      Logger.error('Database or exchange is undefined');
    } else {
      this.dbFile = dbFile;
    }

    Logger.info('Data manager initialized.');
  },

  /**
   * Builds candles of different types
   * @param {string tick|time|volume|currency} type - type of candle
   * @param {integer} length - length of candle
   * @param {array{}} data - array of trade objects
   * 
   * @returns {promise} Promise object contains {candles - new candles, remaineder - unprocessed trades at tail end}
   */
  buildCandles: function ({type, length, rows}) {
    return new Promise(resolve => {
      switch (type) {
        case 'tick':
          const chunks = _.chunk(rows, length);
          const remainder = chunks[chunks.length - 1].length < length ? chunks.pop() : null;
          const candles = chunks.map(trades => this.makeCandle(trades));
          resolve({candles, remainder});
          break;
        default:
          throw(`Invalid candle type ${type}`);
      }
    });
  },

  /**
   * Returns a live sqlite connection
   */
  getDb: function () {
    const dbConn = new db.Database(`${dataDir}${this.dbFile}${dbExt}`);
    dbConn.run('PRAGMA journal_mode = WAL');
    return dbConn;
  },

  /**
   * Returns largest tradeId
   * @param {string} table
   * @returns {integer}
   */
  getNewestTrade: function (table) {
    return new Promise(resolve => {
      dbConn = this.getDb();
      dbConn.each(`SELECT MAX(tradeId) as lastId FROM [${table}] LIMIT 1`, [], (err, row) => resolve(row && row.lastId ? row.lastId : 0));
      dbConn.close();
    });
  },

  loadCandles: function ({table, fromId, fromTime, tick, time, volume, currency}) {
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
  makeCandle: function (trades) {
    return trades.reduce((acc, trade) => {
      acc.open = acc.open || trade.price;
      acc.close = trade.price;
      acc.high = trade.price > acc.high ? trade.price : acc.high;
      acc.low = trade.price < acc.low ? trade.price : acc.low;
      acc.volume += trade.quantity;

      return acc;
    }, {volume: 0, high: 0, low: Infinity});
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
  processCandles: async function (table, types) {
    try {
      let rowLen;
      const dbConn = this.getDb();
      dbConn.serialize(() => {
        for (let i = 0; i < types.length; i++) {
          dbConn.run(`DROP TABLE IF EXISTS [${table}_${types[i].type}_${types[i].length}]`);  
        }
      });
      await new Promise(resolve => dbConn.close(resolve));
      let remainders = {};
      do {
        rowLen = new Promise(resolve => {
          const dbConn = this.getDb();
          dbConn.all(`SELECT * FROM [${table}] ORDER BY tradeId ASC LIMIT ${limit}`, [], async (err, rows) => {
            const candles = types.map(({type, length}) => {
              if (err) {
                throw(err);
              }

              return new Promise(async resolve => {
                const extra = remainders[`${table}_${type}_${length}`] ? remainders[`${table}_${type}_${length}`] : [];

                const built = await this.buildCandles({type, length, rows: [...extra, ...rows]});
                resolve({ type, length, built });
              });
            });
            dbConn.close();

            const allCandles = await Promise.all(candles);
            //this makes me so unhappy
            remainders = {};
            for (let i = 0; i < allCandles.length; i++) {
              const {type, length, built} = allCandles[i];
              await this.storeCandles(`${table}_${type}_${length}`, built.candles);
              remainders[`${table}_${type}_${length}`] = built.remainder;
            }
            resolve(rows.length);
          });
        });
      } while (await rowLen === limit)
    } catch (e) {
      Logger.error(e.message);
    }
  },

  /**
   * Stores candle data
   * @param {string} table - table name
   * @param {array{}} candles - array of candle objects
   */
  storeCandles: async function (table, candles) {
    return new Promise(resolve => {
      try {
        if (!this.dbFile) {
          throw('Database file unspecified');
        }

        const dbConn = this.getDb();
        dbConn.serialize(() => {
          dbConn.run(`CREATE TABLE IF NOT EXISTS [${table}] (id INTEGER PRIMARY KEY AUTOINCREMENT, open REAL, close REAL, high REAL, low REAL, volume REAL)`);
          dbConn.run('BEGIN TRANSACTION');
          const insertStmt = dbConn.prepare(`INSERT INTO [${table}] (open, close, high, low, volume) VALUES (?, ?, ?, ?, ?)`);
          candles.forEach(candle => insertStmt.run(candle.open, candle.close, candle.high, candle.low, candle.volume));
          insertStmt.finalize();
          dbConn.run('COMMIT');
        });
      
        dbConn.close(resolve);
        
        Logger.debug(`${candles.length} added to ${table}`)
      } catch (e) {
        Logger.error(e.message);
      }
    });
  },

  /**
   * Stores a batch of trades in the sqlite db
   * @param {array} batch - batch of trades
   */
  storeTrades: async function (batch) {
    try {
      return new Promise(resolve => {
        if (!this.dbFile) {
          throw('Database file unspecified');
        }

        if (!batch || !batch.length) {
          throw('Data must be specified and an array');
        }

        const dbConn = this.getDb();
        const table = `[${batch[0].symbol}]`;
        const query = `CREATE TABLE IF NOT EXISTS ${table} (id INTEGER PRIMARY KEY AUTOINCREMENT, tradeId INTEGER, timestamp INTEGER, price REAL, quantity REAL)`;
        dbConn.serialize(() => {
          dbConn.run(query);
          dbConn.run('BEGIN TRANSACTION');
          const insertStmt = dbConn.prepare(`INSERT INTO ${table} (tradeId, timestamp, price, quantity) VALUES (?, ?, ?, ?)`);
          batch.forEach(trade => insertStmt.run(trade.id, trade.timestamp, trade.info.p, trade.info.q));
          insertStmt.finalize();
          dbConn.run('COMMIT');
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
const db = require('sqlite3');

const Logger = require('../Logger/Logger');

const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

const DataManager = {
  init: function (dbFile) {
    if (!dbFile || !dataDir || !dbExt) {
      Logger.error('Database or exchange is undefined');
    } else {
      this.dbFile = dbFile;
    }

    Logger.info('Data manager initialized.');
  },

  getDb: function () {
    return new db.Database(`${dataDir}${this.dbFile}${dbExt}`);
  },

  getNewestTrade: function (table) {
    return new Promise(resolve => {
      dbConn = this.getDb();
      const res = dbConn.each(`SELECT MAX(tradeId) as lastId FROM [${table}] LIMIT 1`, [], (err, row) => resolve(row.lastId));
    });
  },

  store: function (batch) {
    try {
      if (!this.dbFile) {
        throw('Database file unspecified');
      }

      if (!batch || !batch.length) {
        throw('Data must be specified and an array');
      }

      const dbConn = this.getDb()
      const table = `[${batch[0].symbol}]`;
      const query = `CREATE TABLE IF NOT EXISTS ${table} (id INTEGER PRIMARY KEY AUTOINCREMENT, tradeId INTEGER, timestamp INTEGER, price REAL, quantity REAL)`
      dbConn.serialize(() => {
        dbConn.run(query);
        dbConn.run('BEGIN TRANSACTION');
        const insertStmt = dbConn.prepare(`INSERT INTO ${table} (tradeId, timestamp, price, quantity) VALUES (?, ?, ?, ?)`);
        batch.forEach(trade => insertStmt.run(trade.id, trade.timestamp, trade.info.p, trade.info.q));
        insertStmt.finalize();
        dbConn.run('COMMIT');
      });

      dbConn.close();
      Logger.debug(`${batch.length} rows inserted into table`);
    } catch (e) {
      Logger.error(e.message);
    }
  }
};

module.exports = DataManager;
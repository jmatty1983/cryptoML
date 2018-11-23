const config = require("../config/config");
const DataManager = require("../dataManager/dataManager");

const Neat = {
  init: async function({ exchange, pair, type, length, dataDir, dbExt }) {
    this.dataManager = Object.create(DataManager);
    this.dataManager.init(exchange, dataDir, dbExt);
    this.data = (await this.dataManager.checkDataExists(pair, type, length))
      ? await this.dataManager.loadData(pair, type, length)
      : [];
  }
};

module.exports = Neat;

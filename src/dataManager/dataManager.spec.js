require("dotenv-safe").config();
process.env.ENV = "test";
const { expect, use } = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
use(sinonChai);

const DataManager = require("./dataManager");
let dataManager;

const tradeData = [
  {
    id: 1,
    tradeId: 1,
    timestamp: 1538647253444,
    price: 1.0058,
    quantity: 10.9
  },
  {
    id: 2,
    tradeId: 2,
    timestamp: 1538647253728,
    price: 1.0048,
    quantity: 100.2
  },
  {
    id: 3,
    tradeId: 3,
    timestamp: 1538647253769,
    price: 1.0048,
    quantity: 12.95
  },
  {
    id: 4,
    tradeId: 4,
    timestamp: 1538647253825,
    price: 1.0048,
    quantity: 100.13
  },
  {
    id: 5,
    tradeId: 5,
    timestamp: 1538647255599,
    price: 1.0048,
    quantity: 65.94
  },
  {
    id: 6,
    tradeId: 6,
    timestamp: 1538647256713,
    price: 1.0048,
    quantity: 159.24
  },
  {
    id: 7,
    tradeId: 7,
    timestamp: 1538647256742,
    price: 1.0048,
    quantity: 44.64
  },
  {
    id: 8,
    tradeId: 8,
    timestamp: 1538647271296,
    price: 1.0,
    quantity: 10.0
  },
  {
    id: 9,
    tradeId: 9,
    timestamp: 1538647291893,
    price: 1.0,
    quantity: 0.9
  },
  {
    id: 10,
    tradeId: 10,
    timestamp: 1538647295964,
    price: 1.05,
    quantity: 0.01
  },
  {
    id: 11,
    tradeId: 11,
    timestamp: 1538647319117,
    price: 1.0496,
    quantity: 10.0
  },
  {
    id: 12,
    tradeId: 12,
    timestamp: 1538647322155,
    price: 1.0496,
    quantity: 377.42
  }
];

describe("Data Manager Module", () => {
  beforeEach(() => {
    dataManager = Object.create(DataManager);
    dataManager.init("binance", "./data/", ".db");
  });

  it("should be defined", () => {
    expect(typeof DataManager).not.to.be.undefined;
  });

  it("should have an init function", () => {
    expect(typeof dataManager.init).to.equal("function");
  });

  it("should add required properties when calling init", () => {
    const dm = Object.create(DataManager);
    dm.init("foo", "bar", "baz");

    expect(dm.dbFile).to.equal("foo");
  });

  it("should not set a dbFile property if calling init without required data", () => {
    let dm = Object.create(DataManager);
    dm.init();

    expect(dm.dbFile).to.be.undefined;

    dm.init("foo");
    expect(dm.dbFile).to.be.undefined;

    dm.init("foo", "./data/");
    expect(dm.dbFile).to.be.undefined;
  });

  it("should have a buildCandles function", () => {
    expect(typeof dataManager.buildCandles).to.equal("function");
  });

  it("should build tick candles appropriately when calling buildCandles with tick data", async () => {
    const buildCandlesInput = {
      type: "tick",
      length: 2,
      rows: tradeData
    };

    expect(await dataManager.buildCandles(buildCandlesInput)).to.eql(undefined);
  });
});

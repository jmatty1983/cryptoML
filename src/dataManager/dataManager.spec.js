require("dotenv-safe").config();
process.env.ENV = "test";
const { expect, use } = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const {
  tradeInput,
  tickOutput,
  timeOutput,
  volumeOutput,
  currencyOutput
} = require("./dataManager.fixture");

use(sinonChai);

const DataManager = require("./dataManager");
let dataManager;

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

  it("should build tick candles appropriately when calling buildCandles with trade data", async () => {
    const buildCandlesInput = {
      type: "tick",
      length: 2,
      rows: tradeInput
    };

    expect(await dataManager.buildCandles(buildCandlesInput)).to.eql(
      tickOutput
    );
  });

  it("should build time candles appropriately when calling buildCandles with trade data", async () => {
    const buildCandlesInput = {
      type: "time",
      length: "1s",
      rows: tradeInput
    };

    expect(await dataManager.buildCandles(buildCandlesInput)).to.eql(
      timeOutput
    );
  });

  it("should build volume candles appropriately when calling buildCandles with trade data", async () => {
    const buildCandlesInput = {
      type: "volume",
      length: "10",
      rows: tradeInput
    };

    expect(await dataManager.buildCandles(buildCandlesInput)).to.eql(
      volumeOutput
    );
  });

  it("should build currency candles appropriately when calling buildCandles with trade data", async () => {
    const buildCandlesInput = {
      type: "currency",
      length: "10",
      rows: tradeInput
    };

    expect(await dataManager.buildCandles(buildCandlesInput)).to.eql(
      currencyOutput
    );
  });

  it("should throw an error if trying to build candles with an invalid type", () => {
    const buildCandlesInput = {
      type: "foo",
      length: "10",
      rows: tradeInput
    };

    expect(dataManager.buildCandles(buildCandlesInput)).to.throw;
  });

  it("should have a convertLengthToTime function", () => {
    expect(typeof dataManager.convertLengthToTime).to.equal("function");
  });

  it("should convert lengths to times correctly when calling convertLengthToTime", () => {
    expect(dataManager.convertLengthToTime("3s")).to.equal(3000);
    expect(dataManager.convertLengthToTime("3m")).to.equal(180000);
    expect(dataManager.convertLengthToTime("3h")).to.equal(10800000);
    expect(dataManager.convertLengthToTime("3d")).to.equal(259200000);
  });

  it("should return null when calling convertLengthToTime with an invalid string", () => {
    expect(dataManager.convertLengthToTime("foo")).to.be.null;
  });

  it("should have a getNewestTrade function", () => {
    expect(typeof dataManager.getNewestTrade).to.equal("function");
  });

  it("should return a number when calling getNewestTrade", async () => {
    sinon.stub(dataManager, "getDb").returns({
      each: (str, args, fn) => {
        fn(null, { lastId: 16 });
      },
      close: () => {
        return;
      }
    });

    expect(await dataManager.getNewestTrade("foo")).to.equal(16);
  });
});

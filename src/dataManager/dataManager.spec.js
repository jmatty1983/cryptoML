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
  currencyOutput,
  candleData,
  candleArrays,
  candleArraysInd
} = require("./dataManager.fixture");

use(sinonChai);

const DataManager = require(".");
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

  it("should build tick candles appropriately when calling buildCandles with trade data", () => {
    const buildCandlesInput = {
      type: "tick",
      length: 2,
      rows: tradeInput
    };

    expect(dataManager.buildCandles(buildCandlesInput)).to.eql(tickOutput);

    buildCandlesInput.rows = [...buildCandlesInput.rows, {}];
    expect(dataManager.buildCandles(buildCandlesInput)).to.eql({
      ...tickOutput,
      remainder: [{}]
    });
  });

  it("should build time candles appropriately when calling buildCandles with trade data", () => {
    const buildCandlesInput = {
      type: "time",
      length: "1s",
      rows: tradeInput
    };

    expect(dataManager.buildCandles(buildCandlesInput)).to.eql(timeOutput);
  });

  it("should throw when calling buildCandles with time and an invalid time duration", () => {
    const buildCandlesInput = {
      type: "time",
      length: "foo",
      rows: tradeInput
    };

    try {
      dataManager.buildCandles(buildCandlesInput);
    } catch (e) {
      expect(e).not.to.be.undefined;
    }
  });

  it("should build volume candles appropriately when calling buildCandles with trade data", () => {
    const buildCandlesInput = {
      type: "volume",
      length: "10",
      rows: tradeInput
    };

    expect(dataManager.buildCandles(buildCandlesInput)).to.eql(volumeOutput);
  });

  it("should build currency candles appropriately when calling buildCandles with trade data", () => {
    const buildCandlesInput = {
      type: "currency",
      length: "10",
      rows: tradeInput
    };

    expect(dataManager.buildCandles(buildCandlesInput)).to.eql(currencyOutput);
  });

  it("should throw an error if trying to build candles with an invalid type", () => {
    const buildCandlesInput = {
      type: "foo",
      length: "10",
      rows: tradeInput
    };
    try {
      dataManager.buildCandles(buildCandlesInput);
    } catch (e) {
      expect(e).not.to.be.undefined;
    }
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

  it("should return a number when calling getNewestTrade", () => {
    const checkDataExistsStub = sinon
      .stub(dataManager, "checkDataExists")
      .returns(true);
    const dbConnStub = sinon.stub(dataManager, "getDb").returns({
      prepare: () => ({
        get: () => ({ lastId: 16 })
      })
    });

    expect(dataManager.getNewestTrade("foo")).to.equal(16);
    dbConnStub.restore();
    checkDataExistsStub.restore();
  });

  it("should default to 0 if none is found when calling getNewestTrade", () => {
    const checkDataExistsStub = sinon
      .stub(dataManager, "checkDataExists")
      .returns(false);

    expect(dataManager.getNewestTrade("foo")).to.equal(0);
    checkDataExistsStub.restore();
  });

  it("should have a loadCandles function", () => {
    expect(typeof dataManager.loadCandles).to.equal("function");
  });

  it("should return candle data when calling loadCandles", () => {
    const dbConnStub = sinon.stub(dataManager, "getDb").returns({
      prepare: () => ({
        all: () => "foo"
      })
    });

    expect(dataManager.loadCandles("bar")).to.equal("foo");
    dbConnStub.restore();
  });

  it("should have a loadData function", () => {
    expect(typeof dataManager.loadData).to.equal("function");
  });

  it("should return data in the expected format when calling loadData", () => {
    const loadCandlesStub = sinon
      .stub(dataManager, "loadCandles")
      .returns(candleData);
    const indicators = [
      {
        name: "sma",
        params: [7]
      }
    ];

    expect(dataManager.loadData("foo", "time", "1h")).to.eql(candleArrays);
    expect(dataManager.loadData("foo", "time", "1h", indicators)).to.eql(
      candleArraysInd
    );
    loadCandlesStub.restore();
  });

  it("should have a makeCandle function", () => {
    expect(typeof dataManager.makeCandle).to.equal("function");
  });

  it("should return a candle data object when calling makeCandle", () => {
    expect(dataManager.makeCandle(tradeInput)).to.eql({
      volume: 892.3299999999999,
      high: 1.05,
      low: 1,
      open: 1.0058,
      close: 1.0496,
      tradeId: 12
    });
  });

  it("should have a makeChunkComparator function", () => {
    expect(typeof dataManager.makeChunkComparator).to.equal("function");
  });

  it("should return a comparator function when calling makeChunkComparator", () => {
    expect(typeof dataManager.makeChunkComparator("time")).to.equal("function");
    expect(typeof dataManager.makeChunkComparator("volume")).to.equal(
      "function"
    );
    expect(typeof dataManager.makeChunkComparator("currency")).to.equal(
      "function"
    );
  });

  it("should have a processCandles function", () => {
    expect(typeof dataManager.processCandles).to.equal("function");
  });

  it("should process and save candles when calling processCandles", () => {
    let runCalls = 0;
    let allCalls = 0;
    let allCalled = false;

    const dbConnStub = sinon.stub(dataManager, "getDb").returns({
      prepare: () => ({
        run: () => {
          runCalls++;
        },
        all: () => {
          allCalls++;
          if (!allCalled) {
            allCalled = true;
            return new Array(100000);
          } else {
            return [];
          }
        }
      })
    });

    let buildCalls = 0;
    const buildCandlesStub = sinon
      .stub(dataManager, "buildCandles")
      .callsFake(() => {
        buildCalls++;
        return {
          built: ["foo"],
          remainder: buildCalls % 2 ? null : ["bar"]
        };
      });

    const storeCandlesStub = sinon.stub(dataManager, "storeCandles");

    const types = [
      {
        type: "tick",
        length: 3
      },
      {
        type: "tick",
        length: 5
      },
      {
        type: "tick",
        length: 10
      }
    ];

    dataManager.processCandles("foo", types);
    expect(runCalls).to.equal(3);
    expect(allCalls).to.equal(2);
    expect(buildCandlesStub).to.have.been.called;
    expect(storeCandlesStub).to.have.been.called;
    dbConnStub.restore();
    buildCandlesStub();
    storeCandlesStub();
  });

  it("should have a storeCandles function", () => {
    expect(typeof dataManager.storeCandles).to.equal("function");
  });

  it("should store candle data in the db when calling storeCandles", () => {
    let prepareCalls = 0;
    let runCalls = 0;
    let transactionCalls = 0;

    let candles = [
      {
        open: "foo",
        close: "foo",
        high: "foo",
        low: "foo",
        volume: "foo",
        tradeId: "foo"
      },
      {
        open: "bar",
        close: "bar",
        high: "bar",
        low: "bar",
        volume: "bar",
        tradeId: "bar"
      }
    ];

    const dbConnStub = sinon.stub(dataManager, "getDb").returns({
      prepare: () => {
        prepareCalls++;
        return {
          run: () => runCalls++
        };
      },
      transaction: fn => () => {
        transactionCalls++;
        fn();
      }
    });

    dataManager.storeCandles("baz", candles);
    expect(prepareCalls).to.equal(2);
    expect(runCalls).to.equal(3);
    expect(transactionCalls).to.equal(1);
    dbConnStub.restore();
  });

  it("should throw an error if the dbFile is not set when calling storeCandles", () => {
    delete dataManager.dbFile;

    dataManager.storeCandles("foo", "bar");
  });

  it("should have a storeTrades function", () => {
    expect(typeof dataManager.storeTrades).to.equal("function");
  });

  it("should store trades when calling storeTrades", () => {
    let prepareCalls = 0;
    let runCalls = 0;
    let transactionCalls = 0;

    let trades = [
      {
        symbol: "foo",
        id: "foo",
        timestamp: "foo",
        info: {
          p: "foo",
          q: "foo"
        }
      },
      {
        symbol: "bar",
        id: "bar",
        timestamp: "bar",
        info: {
          p: "bar",
          q: "bar"
        }
      }
    ];

    const dbConnStub = sinon.stub(dataManager, "getDb").returns({
      prepare: () => {
        prepareCalls++;
        return {
          run: () => runCalls++
        };
      },
      transaction: fn => () => {
        transactionCalls++;
        fn();
      }
    });

    dataManager.storeTrades(trades);
    expect(prepareCalls).to.equal(3);
    expect(runCalls).to.equal(4);
    expect(transactionCalls).to.equal(1);
    dbConnStub.restore();
  });

  it("should throw an error if calling storeTrades without trade data", () => {
    const spy = sinon.spy(dataManager, "storeTrades");

    try {
      const res = dataManager.storeTrades(true);
      expect(res).to.be.undefined;
    } catch (e) {
      expect(e).not.to.be.undefined;
    }
    expect(spy).to.have.thrown;
  });

  it("should have a getDb function", () => {
    expect(typeof dataManager.getDb).to.equal("function");
  });

  it("should have a getNormalisedPoints function", () => {
    expect(typeof dataManager.getNormalisedPoints).to.equal("function");
  });

  it("should return the min and max values for an array when calling getNormalisedPoints", () => {
    const input = [7, 78, 1289, 387, 2198, 2, 29];

    expect(dataManager.getNormalisedPoints(input)).to.eql({
      min: 2,
      max: 2198
    });
  });

  it("should have a normaliseArray function", () => {
    expect(typeof dataManager.normaliseArray).to.equal("function");
  });

  it("should return an array of normalised data when calling normaliseArray", () => {
    const input = [
      59,
      185,
      96,
      232,
      123,
      248,
      74,
      173,
      106,
      220,
      244,
      139,
      60,
      55,
      99
    ];

    expect(dataManager.normaliseArray(input, { min: 55, max: 248 })).to.eql([
      0.02072538860103627,
      0.6735751295336787,
      0.21243523316062177,
      0.917098445595855,
      0.35233160621761656,
      1,
      0.09844559585492228,
      0.6113989637305699,
      0.26424870466321243,
      0.8549222797927462,
      0.9792746113989638,
      0.43523316062176165,
      0.025906735751295335,
      0,
      0.22797927461139897
    ]);
  });

  it("should have a checkDataExists function", () => {
    expect(typeof dataManager.checkDataExists).to.equal("function");
  });

  it("should return true or false when calling checkDataExists", () => {
    const dbConnStub = sinon.stub(dataManager, "getDb").returns({
      prepare: () => ({
        get: () => ({ num: 1 })
      })
    });

    let resp = dataManager.checkDataExists("foo");
    expect(resp).not.to.be.undefined;
    resp = dataManager.checkDataExists("foo", "bar", "baz");
    expect(resp).not.to.be.undefined;
    dbConnStub.restore();
  });
});

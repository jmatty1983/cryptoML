process.env.ENV = "test";
const { expect, use } = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
use(sinonChai);

const ccxt = require("ccxt");
const ExchangeImporter = require("./exchangeImporter");

let exchangeImporter;

describe("Exchange Importer Module", () => {
  beforeEach(() => {
    exchangeImporter = Object.create(ExchangeImporter);
    exchangeImporter.init("binance");
  });

  it("should be defined", () => {
    expect(ExchangeImporter).not.to.be.undefined;
  });

  it("should have an init function", () => {
    expect(typeof ExchangeImporter.init).to.equal("function");
  });

  it("should intialize properties when calling init", () => {
    expect(exchangeImporter.dataManager).not.to.be.undefined;
    expect(exchangeImporter.exchange).not.to.be.undefined;
  });

  it("should have a fetchTrades function", () => {
    expect(typeof ExchangeImporter.fetchTrades).to.equal("function");
  });

  it("should return data when calling the fetchTrades function", async () => {
    const fetchTradesStub = sinon
      .stub(exchangeImporter.exchange, "fetchTrades")
      .returns(["foo", "bar"]);
    const storeBatchStub = sinon.stub(
      exchangeImporter.dataManager,
      "storeTrades"
    );

    expect(await exchangeImporter.fetchTrades(0, "foo")).to.equal(2);

    fetchTradesStub.restore();
    storeBatchStub.restore();
  });

  it("should call fetchTrades again if it times out", () => {
    const fetchTradesStub = sinon.stub(
      exchangeImporter.exchange,
      "fetchTrades"
    );
    fetchTradesStub.onCall(0).throws(new ccxt.RequestTimeout());
    fetchTradesStub.onCall(1).returns(["foo", "bar"]);
    fetchTradesStub.onCall(0).throws("foo");

    const storeBatchStub = sinon.stub(
      exchangeImporter.dataManager,
      "storeTrades"
    );

    exchangeImporter.fetchTrades(0, "foo");
    expect(fetchTradesStub).to.have.been.calledTwice;

    exchangeImporter.fetchTrades(0, "foo");
    expect(fetchTradesStub).to.have.been.calledThrice;

    fetchTradesStub.restore();
    storeBatchStub.restore();
  });

  it("should have a getPair function", () => {
    expect(typeof exchangeImporter.getPair).to.equal("function");
  });

  it("should try to store data when calling getPair", async () => {
    const fetchTradesStub = sinon.stub(exchangeImporter, "fetchTrades");
    const getNewestTradeStub = sinon.stub(
      exchangeImporter.dataManager,
      "getNewestTrade"
    );

    fetchTradesStub.onCall(0).returns(1000);
    fetchTradesStub.onCall(1).returns(1000);
    fetchTradesStub.onCall(2).returns(750);
    fetchTradesStub.onCall(3).returns(750);

    getNewestTradeStub.onCall(0).returns(0);
    getNewestTradeStub.onCall(1).returns(1);
    await exchangeImporter.getPair("foo");

    expect(fetchTradesStub).to.have.been.calledThrice;

    await exchangeImporter.getPair("foo");
    expect(fetchTradesStub).to.have.callCount(4);

    fetchTradesStub.restore();
    getNewestTradeStub.restore();
  });

  it("should throw if calling getPair without specifying a pair", async () => {
    expect(await exchangeImporter.getPair()).to.throw;
  });
});

process.env.ENV = "test";
const { expect } = require("chai");
const ExchangeImporter = require("./exchangeImporter");

describe("Exchange Importer Module", () => {
  it("should be defined", () => {
    expect(ExchangeImporter).not.to.be.undefined;
  });

  it("should have an init function", () => {
    expect(typeof ExchangeImporter.init).to.equal("function");
  });

  it("should intialize properties when calling init", () => {
    const exchangeImporter = Object.create(ExchangeImporter);
    exchangeImporter.init("binance");

    expect(exchangeImporter.dataManager).not.to.be.undefined;
    expect(exchangeImporter.exchange).not.to.be.undefined;
  });
});

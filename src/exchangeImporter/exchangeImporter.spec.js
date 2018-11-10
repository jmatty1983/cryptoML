const { expect } = require("chai");
const exchangeImporter = require("./exchangeImporter");

describe("Exchange Importer Module", () => {
  it("should be defined", () => {
    expect(exchangeImporter).not.to.be.undefined;
  });
});

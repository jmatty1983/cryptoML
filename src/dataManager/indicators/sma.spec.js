const { expect } = require("chai");
const sma = require("./sma");

describe("Simple Moving Average", () => {
  it("should be defined", () => {
    expect(sma).not.to.be.undefined;
  });

  it("should return an array of values for the moving average", () => {
    const array = [...Array(10).keys()];
    const candles = [
      [...array],
      [...array],
      [...array],
      [...array],
      [...array]
    ];
    const expectedReturn = [...Array(8).keys()].map(item => item + 1);

    expect(sma(3, candles)).to.eql(expectedReturn);
  });
});

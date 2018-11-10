const { expect } = require("chai");
const sma = require("./sma");
const deepFreeze = require("deep-freeze");

describe("Simple Moving Average", () => {
  it("should be defined", () => {
    expect(sma).not.to.be.undefined;
  });

  it("should return an array of values for the moving average", () => {
    const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const candles = [
      [...array],
      [...array],
      [...array],
      [...array],
      [...array]
    ];
    deepFreeze(candles);
    const expectedReturn = [1, 2, 3, 4, 5, 6, 7, 8];

    expect(sma(3, candles)).to.eql(expectedReturn);
  });
});

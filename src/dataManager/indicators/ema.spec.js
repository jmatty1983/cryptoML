const { expect } = require("chai");
const ema = require("./ema");
const deepFreeze = require("deep-freeze");

describe("Simple Moving Average", () => {
  it("should be defined", () => {
    expect(ema).not.to.be.undefined;
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
    const expectedReturn = [
      0,
      0.5,
      1.25,
      2.125,
      3.0625,
      4.03125,
      5.015625,
      6.0078125,
      7.00390625
    ];

    expect(ema(3, candles)).to.eql(expectedReturn);
  });
});

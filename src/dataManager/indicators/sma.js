const ArrayUtils = require("../../lib/array");

const SMA = ({ length, index = 3 }, candles) =>
  candles[index].reduce((sma, item, idx, array) => {
    sma.push(
      ArrayUtils.average(array.slice(Math.max(0, idx + 1 - length), idx + 1))
    );
    //console.log("sma", sma)
    return sma;
  }, []);

module.exports = SMA;

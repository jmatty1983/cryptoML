const ArrayUtils = require("../../lib/array");

const SMA = (length, [, closes]) =>
  closes.reduce((sma, item, idx, array) => {
    if (idx + 1 >= length) {
      sma.push(ArrayUtils.average(array.slice(idx + 1 - length, idx + 1)));
    }
    return sma;
  }, []);

module.exports = SMA;

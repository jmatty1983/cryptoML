const ArrayUtils = require("../../lib/array");

const ZSCORE = ({ length, index = 3 }, candles) =>
  candles[index].reduce((zscore, item, idx, array) => {
    const avg = ArrayUtils.average(array.slice(Math.max(0, idx + 1 - length), idx + 1))
    const std = ArrayUtils.stdDev(array.slice(Math.max(0, idx + 1 - length), idx + 1))
    const z = ((item - avg) / std) || 0
    zscore.push(z)
    return zscore;
  }, []);

module.exports = ZSCORE;

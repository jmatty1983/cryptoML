const ArrayUtils = require("../../lib/array");

const VOLATILITY = ({ length, index = 3 }, candles) =>

  candles[index].reduce((volatility, item, idx, array) => {
    const deviation = ArrayUtils.stdDev(array.slice(Math.max(0, idx + 1 - length), idx + 1))
    volatility.push(Math.sqrt(deviation / length));
    return volatility;
      
  }, []);

module.exports = VOLATILITY;

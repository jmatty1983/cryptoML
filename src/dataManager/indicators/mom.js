const ArrayUtils = require("../../lib/array");

const MOM = ({ length, index = 3 }, candles) =>

  candles[index].reduce((median, item, idx, array) => {
      const med = ArrayUtils.average(array.slice(Math.max(0, idx + 1 - length), idx + 1))
      median.push(item - med);
      return median;
      
  }, []);

module.exports = MOM;


const ArrayUtils = require("../../lib/array");

const STOCH = ({ length, index = 3 }, candles) =>
  candles[index].reduce((stoch, item, idx, array) => {
      
    const low = Math.min(array.map(item => item))
    const high = Math.max(array.map(item => item))
    
    let K = item - low;
    K = K / (high - low) * 100
    stoch.push(K);
    console.log(K)
    return stoch;
  }, []);

module.exports = STOCH;

const math = require("mathjs");

const ZSCORE = ({ length, index = 3 }, candles) =>
  candles[index].reduce((zscore, item, idx, array) => {
    let avg = math.mean(array.slice(Math.max(0, idx + 1 - length), idx + 1))
    let std = math.std(array.slice(Math.max(0, idx + 1 - length), idx + 1))
    const z = ((item - avg) / std) || 0
    zscore.push(z)
    //console.log(zscore.slice(0,10))
    return zscore;
  }, []);

module.exports = ZSCORE;

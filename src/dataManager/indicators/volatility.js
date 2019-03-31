const ArrayUtils = require("../../lib/array");

const VOLATILITY = ({ length, index = 3 }, candles) =>

  candles[index].reduce((volatility, item, idx, array) => {
     
    const n = length
    let values = array.slice(Math.max(0, idx + 1 - length), idx + 1)
    //console.log(length)
    let mean = values.reduce((a, b) => (a + b), 0) / n
    //console.log(mean)
    let deviation = values.reduce((dev, val) => (dev + (val - mean) * (val - mean)), 0)
    //console.log(deviation)
    //let vola = Math.sqrt(deviation / n)
    //console.log(vola)
    volatility.push(Math.sqrt(deviation / n));
      //console.log(volatility)
    return volatility;
      
  }, []);

module.exports = VOLATILITY;

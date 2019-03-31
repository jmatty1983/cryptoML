

const low = Math.min(...this.candles.map(item => item.low))
const high = Math.max(...this.candles.map(item => item.high))
if (this.candles.length > this.KPeriods)
    this.candles.shift();

let K = candle.close - low;
K = K / (high - low) * 100 || 0;

const ArrayUtils = require("../../lib/array");

const STOCH = ({ length, index }, candles) =>
  candles[index].reduce((stoch, item, idx, array) => {
      
    const low = Math.min(...this.candles.map(item => item.low))
    const high = Math.max(...this.candles.map(item => item.high))
    
    let K = candle.close - low;
    K = K / (high - low) * 100 || 0;
    stoch.push(
      ArrayUtils.average(array.slice(Math.max(0, idx + 1 - length), idx + 1))
    );
    //console.log("sma", sma)
    return stoch;
  }, []);

module.exports = STOCH;

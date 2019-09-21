const tulind = require('tulind');

const candles = [];
const closed = [];
const rsiLength = 24;

let currPosition = "none";
let rsi = 0;
const rsiLow = 20;
const rsiHigh = 80;


const RSI = (candle) =>
{   
    const currPrice = candle[3]
    let pos = currPosition;
    let output = ["none", 0]
    //console.log(pos)
    const [open, high, low, close, volume, startTime, endTime, tradeId] = candle.map((row) => row);
    //console.log(close)


    //build rolling windows for calcs.
    candles.push(candle)
    closed.push(candle[3])

    
    //Only start when we have enough data.
    if (candles.length > rsiLength){
        //LOAD TULIP INDICATORS
        /*tulind.indicators.ema.indicator([closed.slice(closed.length - emaLength, closed.length)], [emaLength], function(err, results) {
            ema = results[0];
          });*/
        tulind.indicators.rsi.indicator([closed.slice(closed.length-1 - rsiLength)], [rsiLength], function(err, results) {
            rsi = Math.floor(results[0] * 100) / 100.0;
            //rsi = results[0]
            //console.log(Math.floor(results[0] * 100) / 100.0)
          });
          /*tulind.indicators.sma.indicator([closed.slice(closed.length - smaLength/2)], [smaLength/2], function(err, results) {
            smaFast = Math.floor(results[0] * 100) / 100.0;
          });*/

          if (rsi < rsiLow && pos == "none") {
            currPosition = "long" 
            output = ["long", 100]
            //console.log(`LONG @ ${candle[3]}. FAST:${smaFast} SLOW:${sma} TIMESTAMP:${endTime}`) 
        } else if (rsi > rsiHigh && pos == "long") {
            currPosition = "none" 
            output = ["closelong", 100]
            //console.log(`EXIT LONG @ ${candle[3]}. FAST:${smaFast} SLOW:${sma} TIMESTAMP:${endTime}`) 
        }
        /*if (currPrice < results[0] && pos == "none") {
            currPosition = "short" 
            output = ["short", 100]
            //console.log(`SHORT @ ${candle[3]}`) 
        } else if (currPrice > results[0] && pos == "short") {
            currPosition = "none" 
            output = ["closeshort", 100]
            //console.log(`EXIT SHORT @ ${candle[3]}`) 
        }*/
    }
    return output
}


module.exports = RSI;

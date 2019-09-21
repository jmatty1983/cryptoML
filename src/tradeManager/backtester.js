const { Logger } = require("../logger");
const ArrayUtils = require("../lib/array");
const Strategies = require("../strategies")

const fs = require("fs");

const TradeManager = {
  init: function(
    strategy, //name of the strategy file
    pair,
    type,
    length,
    data, //candle data (NOT normalised)
    //below will be settings from config.js which will include backtesting parms.
    {
      maxOpenPositions,
      minPositionSize,
      maxPositionSize,
      startCurrency,  
      fees,
      slippage
    }
  ) {

    //import strategy by file name. Which has to be a function that takes a single candle as an update.
    this.strategy = strategy;
    this.Strategies = Strategies

    this.pair = pair;
    this.type = type;
    this.length = length;

    const [opens, highs, lows, closes, volumes, start, end, tradeid] = data;
    this.data = data;
    this.opens = opens;
    this.highs = highs;
    this.lows = lows;
    this.closes = closes;
    this.volumes = volumes;
    this.start = start;
    this.end = end;
    this.tradeid = tradeid;

    this.maxOpenPositions = maxOpenPositions;
    this.minPositionSize = minPositionSize;
    this.maxPositionSize = maxPositionSize;
    this.fees = fees;
    this.slippage = slippage;
    //this.allowShorts = allowShorts;

    this.asset = 0;
    this.startCurrency = startCurrency;
    this.currency = this.startCurrency;

    this.buys = 0;
    this.sells = 0;

    this.tradesLost = 0;
    this.tradesWon = 0;
    this.avgWin = 0;
    this.avgLoss = 0;

    this.candleCount = 0;

    this.avgPosSize = 0;

    this.exposure = 0;
    this.avgExpDepth = 0;

    this.drawDown = 0;
    this.maxDrawDown = 0;
    this.upDraw = 0;
    this.maxUpDraw = 0;

    this.returns = [];
    this.values = [];

    this.sharpe = 0;
    this.riskFreeReturns = 0.04;

    this.avgDroop = 0;
    this.avgRise = 0;
    this.maxDroop = 0;
    this.maxRise = 0;

    this.maxProfit = 0;
    this.maxLoss = 0;
    this.minQuantity = this.stepSize = 0.000001; // BTC 0.00000100; // XRP 0.10000000

    this.positionsLong = [];
    this.positionsShort = [];
    this.trades = [];
    this.tickStatsdata = []; //ADDED
  },

  //we just need this function do buy if the strategy says so. so we can use it like neat does just need to make it simpler here
  //convert signal into a long/short/exit rather then >0 && <0.
  //if signal == "LONG", "SHORT", "EXIT"
  //WE FEED LONG & AMOUNT & and the current candle close and trade ids and start and clsoe time.
  //its using amount now so keep that in mind.
  doSignal: function(
    signal,
    amount,
    [, , , close, , startTime, endTime, tradeId]
  ) {
    //console.log("DOLONG", signal, amount, close)
    try {
        this.positionsLong.forEach(pos => {
          pos.droop = Math.min(pos.droop, close);
          pos.rise = Math.max(pos.rise, close);
        });

        this.positionsShort.forEach(pos => {
          pos.droop = Math.min(pos.droop, close);
          pos.rise = Math.max(pos.rise, close);
        });
  
        let changeAmt =
          this.minPositionSize +
          (this.maxPositionSize - this.minPositionSize) *
            (Math.min(1, Math.max(-1, amount)) * 0.5 + 0.5);
      if (
        signal == "long" &&
        this.currency > 0
      ) {
        //console.log(changeAmt)
        let change = this.currency * changeAmt;
        let quantity = change / close;

        quantity *= 1 - (this.fees + this.slippage);

        //console.log("quantitty", quantity)

        if (quantity >= this.minQuantity) {
          this.currency -= change;
          this.avgPosAdd += changeAmt;

          this.asset += quantity;
          this.buys++;

          this.positionsLong.push({
            price: close,
            quantity: quantity,
            currency: change,
            depth: changeAmt,
            droop: close,
            rise: close
          });

          const totalPositions = this.positionsLong.reduce(
            (sum, { currency }) => sum + currency,
            0
          );

          this.trades.push({
            type: "longOpen",
            asset: quantity,
            currency: change,
            actionPrice: change / quantity,
            candleClose: close,
            time: endTime,
            tradeid: tradeId,
            balance: this.currency + totalPositions,
            wallet: this.getValue(close)
          });
        }
      } else if (signal == "closelong" && this.asset > 0 && this.positionsLong.length > 0) {
        const {
          price,
          currency,
          quantity,
          depth,
          droop,
          rise
        } = this.positionsLong.shift();

        let change = Math.min(this.asset, quantity);
        this.asset -= change;
        {
          const sellVal = change * (1 - (this.fees + this.slippage)) * close;
          this.currency += sellVal;

          const totalPositions = this.positionsLong.reduce(
            (sum, { currency }) => sum + currency,
            0
          );

          this.trades.push({
            type: "longClose",
            asset: change,
            currency: sellVal,
            actionPrice: sellVal / quantity,
            candleClose: close,          //const totalBalance = totalPosition.reduce((total, num) => (total + num))
            //console.log(totalPositions)
            //console.log(totalBalance)
            time: endTime,
            tradeid: tradeId,
            balance: this.currency + totalPositions,
            wallet: this.getValue(close)
          });

          const deltaValue = sellVal / currency - 1;

          this.returns.push(deltaValue);
          this.values.push(sellVal / currency) / close;

          const droop2 = droop / price - 1;
          const rise2 = close / rise - 1;

          this.avgDroop += droop2;
          this.avgRise += rise2;

          this.maxDroop = Math.max(this.maxDroop, droop2);
          this.maxRise = Math.max(this.maxRise, rise2);

          if (deltaValue >= 0) {
            this.maxProfit = Math.max(deltaValue, this.maxProfit);
            this.avgWin += deltaValue;
            this.upDraw += deltaValue * depth;
            this.maxDrawDown = Math.min(this.maxDrawDown, this.drawDown);
            this.drawDown = 0;
            this.tradesWon++;
          } else if (deltaValue < 0) {
            this.maxLoss = Math.min(deltaValue, this.maxLoss);
            this.avgLoss += deltaValue;
            this.drawDown += deltaValue * depth;
            this.maxUpDraw = Math.max(this.maxUpDraw, this.upDraw);
            this.upDraw = 0;
            this.tradesLost++;
          }

          this.sells++;
        }
      }

      if (
        signal == "short" &&
        this.currency > 0
      ) {
        //console.log(changeAmt)
        let change = this.currency * changeAmt;
        let quantity = change / close;

        quantity *= 1 - (this.fees + this.slippage);

        //console.log("quantitty", quantity)

        if (quantity >= this.minQuantity) {
          this.currency -= change;
          this.avgPosAdd += changeAmt;

          this.asset += quantity;
          this.buys++;

          this.positionsShort.push({
            price: close,
            quantity: quantity,
            currency: change,
            depth: changeAmt,
            droop: close,
            rise: close
          });

          const totalPositions = this.positionsShort.reduce(
            (sum, { currency }) => sum - currency,
            0
          );

          this.trades.push({
            type: "shortOpen",
            asset: quantity,
            currency: change,
            actionPrice: change / quantity,
            candleClose: close,
            time: endTime,
            tradeid: tradeId,
            balance: this.currency + totalPositions,
            wallet: this.getValue(close)
          });
        }
      } else if (signal == "closeshort" && this.asset > 0 && this.positionsShort.length > 0) {
        const {
          price,
          currency,
          quantity,
          depth,
          droop,
          rise
        } = this.positionsShort.shift();

        let change = Math.min(this.asset, quantity);
        this.asset -= change;
        {
          const sellVal = change * (1 - (this.fees + this.slippage)) * close;
          this.currency += sellVal;

          const totalPositions = this.positionsShort.reduce(
            (sum, { currency }) => sum - currency,
            0
          );

          this.trades.push({
            type: "shortClose",
            asset: change,
            currency: sellVal,
            actionPrice: sellVal / quantity,
            candleClose: close,          //const totalBalance = totalPosition.reduce((total, num) => (total + num))
            //console.log(totalPositions)
            //console.log(totalBalance)
            time: endTime,
            tradeid: tradeId,
            balance: this.currency + totalPositions,
            wallet: this.getValue(close)
          });

          const deltaValue = sellVal / currency - 1;

          this.returns.push(deltaValue);
          this.values.push(sellVal / currency) / close;

          const droop2 = droop / price - 1;
          const rise2 = close / rise - 1;

          this.avgDroop += droop2;
          this.avgRise += rise2;

          this.maxDroop = Math.max(this.maxDroop, droop2);
          this.maxRise = Math.max(this.maxRise, rise2);

          if (deltaValue >= 0) {
            this.maxProfit = Math.max(deltaValue, this.maxProfit);
            this.avgWin += deltaValue;
            this.upDraw += deltaValue * depth;
            this.maxDrawDown = Math.min(this.maxDrawDown, this.drawDown);
            this.drawDown = 0;
            this.tradesWon++;
          } else if (deltaValue < 0) {
            this.maxLoss = Math.min(deltaValue, this.maxLoss);
            this.avgLoss += deltaValue;
            this.drawDown += deltaValue * depth;
            this.maxUpDraw = Math.max(this.maxUpDraw, this.upDraw);
            this.upDraw = 0;
            this.tradesLost++;
          }

          this.sells++;
        }
      }

      if (this.currency < 0 || this.asset < 0) {
        console.log(`${this.currency} ${this.asset}`);
        throw "Currency or Asset dropped below 0";
      }
    } catch (e) {
      Logger.error(`${e}`);
      process.exit();
    }
  },

  getValue: function(price) {
    return (
      this.currency + this.asset * price * (1 - (this.fees + this.slippage))
    );
  },

  // doShort: function(positionSize, candle) {
  //   if (this.allowShorts) {
  //   }
  // },


  //This is where we handle every candle by passing the candle in and long/short and amount.
  handleCandle: function(candle, [longSig, amount]) {
    // Buy/Sell signal mapping as below
    //
    //         /
    //    ____/
    //   /
    //  /
    //

    const signal = longSig

    if (signal) {
      this.doSignal(signal, amount, candle);
    }
    /*if (signal === "short") {
      this.doShort(signal, amount, candle);
    }*/
    if (this.asset > 0) {
      this.avgExpDepth += this.asset / this.getValue(candle[3]);
      this.exposure++;
    }

    this.candleCount++;
  },

  //This function is for WEB UI to calculate the statistics of the portfolio every candle/tick. For plotting PNL charts and such.
  tickStats: function(candle) {
    
    const profit = Math.max(
      -1,
      (this.currency / this.startCurrency - 1)
    );

    const market = this.closes[this.closes.length - 1] / this.closes[0];



    /*const ret = {
      candle: candle[6],
      currency: this.currency,
      asset: this.asset,
      profit: profit,
      value: this.getValue(candle[3])
    }*/
    
    //TIMESTAMP(close), close, totalvalue, alpha, profit

    const ret = [new Date(candle[6]), candle[3], this.getValue(candle[3]), ((market + this.getValue(candle[3])) - this.getValue(candle[3])), profit]
    this.tickStatsdata.push(ret)
  },


  calcStats: function() {
    let safeDiv = (num, denom) =>
      Math.abs(denom) <= Number.EPSILON || isNaN(num) || isNaN(denom)
        ? 0
        : num / denom;

    this.maxDrawDown = Math.min(this.maxDrawDown, this.drawDown);
    this.maxUpDraw = Math.max(this.maxUpDraw, this.upDraw);

    const market = this.closes[this.closes.length - 1] / this.closes[0];
    const value = this.getValue(this.closes[this.closes.length - 1]);
    this.currency = value;

    const R = safeDiv(this.avgWin, -this.avgLoss);

    this.avgWin = safeDiv(this.avgWin, this.tradesWon);
    this.avgLoss = safeDiv(this.avgLoss, this.tradesLost);

    const timeSpanInMonths =
      (this.start[this.start.length - 1] - this.start[0]) /
      (1000 * 60 * 60 * 24 * (365.25 / 12));

    const alpha = this.currency / this.startCurrency - market;
    const profit = Math.max(
      -1,
      (this.currency / this.startCurrency - 1) / timeSpanInMonths
    );
    const winRate = safeDiv(this.tradesWon, this.tradesWon + this.tradesLost);

    const EV = winRate * this.avgWin + (1 - winRate) * this.avgLoss;

    const RTs = this.sells;
    const RTsToTimeSpanRatio = RTs / this.candleCount;

    this.avgExpDepth = safeDiv(this.avgExpDepth, this.exposure);

    const meanReturns = ArrayUtils.average(this.returns);
    // const sumReturns = ArrayUtils.sum(this.returns)
    const stdReturns = Math.sqrt(
      this.returns.reduce((acc, val) => acc + Math.pow(val - meanReturns, 2), 0)
    );

    this.sharpe =
      safeDiv(meanReturns - this.riskFreeReturns, stdReturns) *
      Math.sqrt((timeSpanInMonths * 365.25) / 12);

    this.avgDroop = safeDiv(this.avgDroop, RTs);
    this.avgRise = safeDiv(this.avgRise, RTs);

    const { sum } = this.values.reduce(
      (acc, val) => {
        const peak = Math.max(val, acc.peak);
        return {
          peak,
          sum: acc.sum + (x => x * x)(val / peak - 1)
        };
      },
      { peak: 0, sum: 0 }
    );

    const v2ratioN =
      Math.pow(this.currency / this.startCurrency, 12 / timeSpanInMonths) - 1;
    const v2ratioD = Math.sqrt(sum / timeSpanInMonths) + 1;
    const v2ratio = safeDiv(v2ratioN, v2ratioD);

    this.values.length = this.returns.length = 0;

    const ret = {
      currency: this.currency,
      startCurrency: this.startCurrency,
      asset: this.asset,
      profit,
      value,
      alpha,
      buys: this.buys / timeSpanInMonths,
      sells: this.sells / timeSpanInMonths,

      buysToTimeSpanRatio: this.buys / this.candleCount,
      sellsToTimeSpanRatio: this.sells / this.candleCount,

      buysToTradesRatio: safeDiv(this.buys, this.buys + this.sells),

      avgWin: this.avgWin,
      avgLoss: this.avgLoss,
      avgExpDepth: this.avgExpDepth,
      risk: 1 - this.avgExpDepth,

      EV,

      RTs,
      RTsPerMonth: RTs / timeSpanInMonths,
      RTsToTimeSpanRatio,

      tradesWon: this.tradesWon,
      tradesLost: this.tradesLost,
      wins: this.tradesWon / timeSpanInMonths,
      losses: this.tradesLost / timeSpanInMonths,

      avgPosSize: safeDiv(this.avgPosSize, this.buys),

      R,
      sharpe: this.sharpe,
      v2ratio: v2ratio,
      RoMaD: safeDiv(profit, -this.maxDrawDown),
      winRate,

      maxUpDraw: this.maxUpDraw,
      maxDrawDown: this.maxDrawDown,

      maxProfit: this.maxProfit,
      maxLoss: this.maxLoss,

      avgBottomDist: this.avgDroop,
      avgPeakDist: this.avgRise,

      maxBottomDist: this.maxDroop,
      maxPeakDist: this.maxRise,

      exposure: this.exposure / this.candleCount,

      OK:
        v2ratio > 0 &&
        // RTs > 0 &&
        // winRate > 0 &&
        true
          ? 1
          : 0,

      novelty: 0,
      //tickStats: this.tickStatsdata,
      trades: this.trades

    };
    console.log(ret)
    this.saveBacktestResults(ret)
    return ret;
  },

  saveBacktestResults: function(backtestResults) {
    console.log("SAVING BACKTEST!")
    //const pair = "btc/usdt"
    //const type = "time"
    //const length = "4h"
    //const strategy = "example"
    const safePairName = this.pair
      .replace(/\//g, "_")
      .replace(/[^a-z0-9_]/gi, "");
      const filename = `${this.strategy}_${safePairName}_${this.type}_${this.length}`;
      //const dir = `../../backtests/${filename}`;
      const dir = `${__dirname}/../../backtests/${this.strategy}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      if (!fs.existsSync(`${dir}/${filename}`)) {
        const data = {
          results: backtestResults
        };
        fs.writeFileSync(`${dir}/${filename}`, JSON.stringify(data));
      }
    },

    //MAP IS FASTER THEN FOREACH AND LESS AGGRESSIVE.
  /*runTrades: function() {
    this.opens.forEach((x, index) => {
     /* const candleInput = this.networkInput.reduce(
        (array, item) => [...array, item[index]],
        []
      );*/
      /*const candle = this.data.reduce(
        (array, item) => [...array, item[index]],
        []
      );
      //const output = this.genome.noTraceActivate(candleInput);
      const output = Strategies[this.strategy](candle); //this sends the candle to strategy which will return [SIGNAL, AMOUNT]
      this.handleCandle(candle, output);
    });
    //console.log(this.calcStats())

    return this.calcStats();
  },*/

  runTrades: function() {
    this.opens.map((x, index) => {
      const candle = this.data.reduce(
        (array, item) => [...array, item[index]],
        []
      );
      //const output = this.genome.noTraceActivate(candleInput);
      const output = Strategies[this.strategy](candle); //this sends the candle to strategy which will return [SIGNAL, AMOUNT]
      this.handleCandle(candle, output);
    });
    //console.log(this.calcStats())

    return this.calcStats();
  },

  runStats: function() {
    this.opens.forEach((x, index) => {
      const candleInput = this.networkInput.reduce(
        (array, item) => [...array, item[index]],
        []
      );
      const candle = this.data.reduce(
        (array, item) => [...array, item[index]],
        []
      );
      const output = this.genome.noTraceActivate(candleInput);
      this.handleCandle(candle, output);
      this.tickStats(candle);
    });

    return this.tickStatsdata;
  }

};

module.exports = TradeManager;

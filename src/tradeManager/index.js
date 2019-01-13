const { Logger } = require("../logger");
const ArrayUtils = require("../lib/array");

const TradeManager = {
  init: function(
    genome,
    data,
    networkInput,
    {
      longThresh,
      shortThresh,
      maxPositions,
      minPositionSize,
      maxPositionSize,
      fees,
      slippage,
      allowShorts
    }
  ) {
    this.genome = genome;

    const [opens, highs, lows, closes, volumes, start] = data;
    this.data = data;
    this.opens = opens;
    this.highs = highs;
    this.lows = lows;
    this.closes = closes;
    this.volumes = volumes;
    this.start = start;

    this.networkInput = networkInput;
    this.longThresh = longThresh;
    this.shortThresh = shortThresh;
    this.maxPositions = maxPositions;
    this.minPositionSize = minPositionSize;
    this.maxPositionSize = maxPositionSize;
    this.fees = fees;
    this.slippage = slippage;
    this.allowShorts = allowShorts;

    this.asset = 0;
    this.startCurrency = 10000;
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

    this.positions = [];
    this.trades = [];
  },

  doLong: function(signal, amount, [, , , close, , startTime]) {
    try {
      this.positions.forEach(pos => {
        pos.droop = Math.min(pos.droop, close);
        pos.rise = Math.max(pos.rise, close);
      });

      let changeAmt =
        this.minPositionSize +
        (this.maxPositionSize - this.minPositionSize) *
          (Math.min(1, Math.max(-1, amount)) * 0.5 + 0.5);

      if (
        signal > 0 &&
        this.currency > 0 &&
        changeAmt > 0 &&
        this.positions.length < this.maxPositions
      ) {
        let change = this.currency * changeAmt;
        let quantity = change / close;

        quantity = this.stepSize * Math.floor(quantity / this.stepSize);
        quantity = Math.max(quantity, this.minQuantity);
        change = quantity * close;

        change = Math.min(change, this.currency);

        quantity *= 1 - (this.fees + this.slippage);

        if (quantity >= this.minQuantity) {
          this.currency -= change;
          this.avgPosAdd += changeAmt;

          this.asset += quantity;
          this.buys++;

          /*          this.trades.push({
            type: "open",
            asset: quantity,
            currency: change,
            time: startTime
          });*/

          this.positions.push({
            price: close,
            quantity: quantity,
            currency: change,
            depth: changeAmt,
            droop: close,
            rise: close
          });
        }
      } else if (signal < 0 && this.asset > 0 && this.positions.length > 0) {
        const {
          price,
          currency,
          quantity,
          depth,
          droop,
          rise
        } = this.positions.shift();
        let change = Math.min(this.asset, quantity);
        this.asset -= change;
        {
          const sellVal = change * (1 - (this.fees + this.slippage)) * close;
          this.currency += sellVal;

          /*          this.trades.push({
            type: "close",
            asset: change,
            currency: sellVal,
            time: startTime
          });*/

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

  handleCandle: function(candle, [longSig, amount]) {
    // Buy/Sell signal mapping as below
    //
    //         /
    //    ____/
    //   /
    //  /
    //

    const signal =
      Math.max(0, Math.abs(longSig) - this.longThresh) * Math.sign(longSig);

    // const signal = longSig

    if (signal) {
      this.doLong(signal, amount, candle);
    }
    if (this.asset > 0) {
      this.avgExpDepth += this.asset / this.getValue(candle[3]);
      this.exposure++;
    }

    this.candleCount++;
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
    const profit = (this.currency / this.startCurrency - 1) / timeSpanInMonths;
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
      profit: profit,
      value: value,
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

      genomeNodes: this.genome.nodes.length,
      genomeConnections: this.genome.connections.length,
      genomeGates: this.genome.gates.length,
      genomeSelfConnections: this.genome.selfconns.length,

      OK:
        alpha > 0 &&
        profit > 0 &&
        v2ratio > 0 &&
        RTs > 0 &&
        RTs < 2000 &&
        winRate > 0.5 &&
        winRate < 1
          ? 1
          : 0,

      novelty: 0
    };

    return ret;
  },

  runTrades: function() {
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
    });

    return this.calcStats();
  }
};

module.exports = TradeManager;

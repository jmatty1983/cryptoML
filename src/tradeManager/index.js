const { Logger } = require("../logger");
const tradeStats = require("./tradeStats");

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

    this.maxProfit = 0;
    this.maxLoss = 0;
    this.minQuantity = this.stepSize = 0.000001; // BTC 0.00000100; // XRP 0.10000000

    this.positions = [];
    this.trades = [];
  },

  doLong: function(signal, amount, [, , , close, , startTime]) {
    try {
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

        while (change > this.currency) {
          quantity -= this.minQuantity;
          change -= this.minQuantity * close;
        }

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
            quantity: quantity,
            currency: change,
            depth: changeAmt
          });
        }
      } else if (signal < 0 && this.asset > 0 && this.positions.length > 0) {
        const { currency, quantity, depth } = this.positions.shift();
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
      Math.abs(denom) <= Number.EPSILON ? 0 : num / denom;

    this.maxDrawDown = Math.min(this.maxDrawDown, this.drawDown);
    this.maxUpDraw = Math.max(this.maxUpDraw, this.upDraw);

    const value = this.getValue(this.closes[this.closes.length - 1]);
    this.currency = value;
    this.avgWin = safeDiv(this.avgWin, this.tradesWon);
    this.avgLoss = safeDiv(this.avgLoss, this.tradesLost);

    const timeSpanInMonths =
      (this.start[this.start.length - 1] - this.start[0]) /
      (1000 * 60 * 60 * 24 * (365 / 12));

    const profit = (this.currency / this.startCurrency - 1) / timeSpanInMonths;
    const winRate = safeDiv(this.tradesWon, this.tradesWon + this.tradesLost);

    const EV = winRate * this.avgWin + (1 - winRate) * this.avgLoss;
    const R = safeDiv(this.avgWin, -this.avgLoss);

    const RTs = this.sells;
    const RTsToTimeSpanRatio = RTs / this.candleCount;

    this.avgExpDepth = safeDiv(this.avgExpDepth, this.exposure);

    const ret = {
      currency: this.currency,
      startCurrency: this.startCurrency,
      asset: this.asset,
      profit: profit,
      value: value,
      buys: this.buys / timeSpanInMonths,
      sells: this.sells / timeSpanInMonths,

      buysToTimeSpanRatio: this.buys / this.candleCount,
      sellsToTimeSpanRatio: this.sells / this.candleCount,

      buysToTradesRatio: safeDiv(this.buys, this.buys + this.sells),

      avgWin: this.avgWin,
      avgLoss: this.avgLoss,
      avgExpDepth: this.avgExpDepth,

      EV,

      RTs,
      RTsPerMonth: RTs / timeSpanInMonths,
      RTsToTimeSpanRatio,

      wins: this.tradesWon / timeSpanInMonths,
      losses: this.tradesLost / timeSpanInMonths,

      avgPosSize: safeDiv(this.avgPosSize, this.buys),

      R,
      winRate,

      maxUpDraw: this.maxUpDraw,
      maxDrawDown: this.maxDrawDown,

      maxProfit: this.maxProfit,
      maxLoss: this.maxLoss,

      exposure: this.exposure / this.candleCount,

      genomeNodes: this.genome.nodes.length,
      genomeConnections: this.genome.connections.length,
      genomeGates: this.genome.gates.length,
      genomeSelfConnections: this.genome.selfconns.length,

      OK: profit > 0 && R > 1 && RTs > 0 ? 1 : 0,

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
      // if( Math.random()<0.1) Logger.debug(output)
      this.handleCandle(candle, output);
    });

    return this.calcStats();
  }
};

module.exports = TradeManager;

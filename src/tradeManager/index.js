const Logger = require("../logger");

const TradeManager = {
  init: function(
    genome,
    data,
    networkInput,
    {
      longThresh,
      shortThresh,
      positionChangeThresh,
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
    this.positionChangeThresh = positionChangeThresh;
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

    this.avgPosAdd = 0;
    this.avgPosRem = 0;

    this.exposure = 0;
    this.avgExpDepth = 0;

    this.minQuantity = this.stepSize = 0.000001; // BTC 0.00000100; // XRP 0.10000000

    this.positions = [];
    this.trades = [];

    //More notes for future me. It may be worth experimenting with inputting current position
    //information for the model.
    this.position = {
      type: "none",
      size: 0,
      startCurrency: 0
    };
  },

  doLong: function(signal, amount, [, , , close]) {
    try {
      // changeAmt = changeAmt>0?changeAmt:changeAmt*2

      // let changeAmt = Math.max(-1, Math.min(1, amount)) * this.maxPositionSize
      let changeAmt =
        this.minPositionSize +
        (this.maxPositionSize - this.minPositionSize) *
          (Math.tanh(amount) * 0.5 + 0.5);

      // changeAmt = 0.2
      if (signal > 0 && this.currency > 0 && changeAmt > 0) {
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

        if (quantity > this.minQuantity) {
          this.currency -= change;
          this.avgPosAdd += changeAmt;

          this.asset += quantity;
          this.buys++;

          this.positions.push({
            quantity: quantity,
            investment: change,
            price: close
          });
        }
      } else if (signal < 0 && this.asset > 0) {
        if (this.positions.length) {
          const position = this.positions.shift();
          let change = position.quantity;

          if (change >= this.minQuantity) {
            change = Math.min(this.asset, change);

            this.asset -= change;

            const sellVal = change * (1 - (this.fees + this.slippage)) * close;
            this.currency += sellVal;

            const deltaValue = sellVal / position.investment - 1;
            if (deltaValue >= 0) {
              this.avgWin += deltaValue;
              this.tradesWon++;
            } else if (deltaValue < 0) {
              this.avgLoss += deltaValue;
              this.tradesLost++;
            }

            this.sells++;
          }
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

    let safeDiv = (num, denom) =>
      Math.abs(denom) <= Number.EPSILON ? 0 : num / denom;

    const value = this.getValue(this.closes[this.closes.length - 1]);

    this.avgWin = safeDiv(this.avgWin, this.tradesWon);
    this.avgLoss = safeDiv(this.avgLoss, this.tradesLost);

    const timeSpanInMonths =
      (this.start[this.start.length - 1] - this.start[0]) /
      (1000 * 60 * 60 * 24 * (365 / 12));

    const profit = (this.currency / this.startCurrency - 1) / timeSpanInMonths;
    const winRate = safeDiv(this.tradesWon, this.tradesWon + this.tradesLost);

    const EV = winRate * this.avgWin + (1 - winRate) * this.avgLoss;
    const R = safeDiv(this.avgWin, -this.avgLoss);

    this.avgExpDepth = safeDiv(this.avgExpDepth, this.exposure);

    return {
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

      EV: EV,

      RTs: (this.buys + this.sells) / 2,

      wins: this.tradesWon / timeSpanInMonths,
      losses: this.tradesLost / timeSpanInMonths,

      avgPosAdd: safeDiv(this.avgPosAdd, this.buys),
      avgPosRem: safeDiv(this.avgPosRem, this.sells),

      R: R,
      winRate: winRate,

      exposure: this.exposure / this.candleCount,

      genomeNodes: this.genome.nodes.length / 10,
      genomeConnections: this.genome.connections.length / 10,
      genomeGates: this.genome.gates.length / 10,
      genomeSelfConnections: this.genome.selfconns.length / 10,

      OK: profit > 0 && this.tradesWon > 0 && this.tradesLost > 0 && R > 1
    };
  }
};

module.exports = TradeManager;

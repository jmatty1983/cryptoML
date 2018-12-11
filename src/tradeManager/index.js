const Logger = require("../logger");

const TradeManager = {
  init: function(
    genome,
    data,
    networkInput,
    {
      longThresh,
      shortThresh,
      positionChangeThesh,
      fees,
      slippage,
      allowShorts
    }
  ) {
    this.genome = genome;

    const [opens, highs, lows, closes, volumes] = data;
    this.data = data;
    this.opens = opens;
    this.highs = highs;
    this.lows = lows;
    this.closes = closes;
    this.volumes = volumes;

    this.networkInput = networkInput;
    this.longThresh = longThresh;
    this.shortThresh = shortThresh;
    this.positionChangeThesh = positionChangeThesh;
    this.fees = fees;
    this.slippage = slippage;
    this.allowShorts = allowShorts;

    this.asset = 0;
    this.startCurrency = 1;
    this.currency = this.startCurrency;

    this.buys = 0;
    this.sells = 0;

    this.posTrigger = false;

    this.prevValue = this.startCurrency;

    this.tradesLost = 0;
    this.tradesWon = 0;
    this.avgWin = 0;
    this.avgLoss = 0;

    this.candleCount = 0;

    this.avgPosAdd = 0;
    this.avgPosRem = 0;

    this.exposure = 0;

    this.minQuantity = 0.1;

    //More notes for future me. It may be worth experimenting with inputting current position
    //information for the model.
    this.position = {
      type: "none",
      size: 0,
      startCurrency: 0
    };
  },

  doLong: function(positionSize, [, , , close]) {
    try {
      if (positionSize > 1) {
        positionSize = 1;
      } else if (positionSize < -1) {
        positionSize = -1;
      }

      let changeAmt = positionSize;

      if (changeAmt > 0 && this.currency > 0) {
        const change = this.currency * changeAmt;

        const quantity = (change * (1 - (this.fees + this.slippage))) / close;
        if (quantity >= this.minQuantity) {
          const f = quantity / this.minQuantity;
          this.currency -= change;
          this.avgPosAdd += changeAmt;

          this.asset += quantity;
          this.buys++;

          this.currentValue = this.getValue(close);
        }
      } else if (changeAmt < 0 && this.asset > 0) {
        changeAmt = -changeAmt;

        let change = this.asset * changeAmt;
        this.asset -= change;

        if (this.asset * close < this.currency * 0.05) {
          change += this.asset;
          this.asset = 0;
          changeAmt = 1;
        }

        this.avgPosRem += changeAmt;

        const sellVal = change * (1 - (this.fees + this.slippage)) * close;
        this.currency += sellVal;

        const value = this.getValue(close);

        this.sells++;

        const deltaValue = value - this.currentValue;

        if (deltaValue >= 0) {
          this.avgWin += deltaValue;
          this.tradesWon++;
        } else if (deltaValue < 0) {
          this.avgLoss += deltaValue;
          this.tradesLost++;
        }

        // this.currentValue = Value;
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

  handleCandle: function(candle, [longSig, shortSig]) {
    // Buy/Sell signal mapping as below
    //
    //         /
    //    ____/
    //   /
    //  /
    //

    const signal =
      Math.max(0, Math.abs(longSig) - this.longThresh) * Math.sign(longSig);

    this.doLong(signal, candle);

    if (this.asset > 0) {
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

    // this.doLong(-1, this.data[this.data.length - 1]);

    const value = this.getValue(this.closes[this.closes.length - 1]);

    // this.tradesWon = Math.max(Number.EPSILON,this.tradesWon)
    // this.tradesLost = Math.max(Number.EPSILON,this.tradesLost)

    function safeDiv(num, denom) {
      if (Math.abs(denom) <= Number.EPSILON) return 0;
      return num / denom;
    }

    this.avgWin = safeDiv(this.avgWin, this.tradesWon);
    this.avgLoss = safeDiv(this.avgLoss, this.tradesLost);

    return {
      currency: this.currency,
      startCurrency: this.startCurrency,
      asset: this.asset,
      value: value,
      buys: this.buys,
      sells: this.sells,

      buysToTimeSpanRatio: this.buys / this.candleCount,
      sellsToTimeSpanRatio: this.sells / this.candleCount,

      buysToTradesRatio: safeDiv(this.buys, this.buys + this.sells),

      avgWin: this.avgWin,
      avgLoss: this.avgLoss,

      wins: this.tradesWon,
      losses: this.tradesLost,

      avgPosAdd: this.avgPosAdd / Math.max(Number.EPSILON, this.buys),
      avgPosRem: this.avgPosRem / Math.max(Number.EPSILON, this.sells),

      R: safeDiv(this.avgWin, -this.avgLoss),
      winRate: safeDiv(this.tradesWon, this.tradesWon + this.tradesLost),

      exposure: this.exposure / this.candleCount,

      genomeNodes: this.genome.nodes.length / 10,
      genomeConnections: this.genome.connections.length / 10,
      genomeGates: this.genome.gates.length / 10,
      genomeSelfConnections: this.genome.selfconns.length / 10,

      OK:
        this.buys > 0 &&
        this.sells > 0 &&
        this.wins > 0 &&
        this.losses > 0 &&
        value > 1
    };
  }
};

module.exports = TradeManager;

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
    this.data = data;
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

    this.prevWorth = this.startCurrency;
    this.tradesLost = 0;
    this.tradesWon = 0;
    this.avgWin = 0;
    this.avgLoss = 0;

    this.tickCount = 0;

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

  doLong: function(positionSize, candle) {
    try {
      if (positionSize > 1) {
        positionSize = 1;
      } else if (positionSize < -1) {
        positionSize = -1;
      }

      let changeAmt = positionSize;

      if (changeAmt > 0 && this.currency > 0) {
        const change = this.currency * changeAmt;

        const quantity =
          (change * (1 - (this.fees + this.slippage))) / candle[1];
        if (quantity >= this.minQuantity) {
          const f = quantity / this.minQuantity;
          this.currency -= change;
          this.avgPosAdd += changeAmt;

          this.asset += quantity;
          this.buys++;

          this.currentWorth = this.getValue(candle[1]);
        }
      } else if (changeAmt < 0 && this.asset > 0) {
        changeAmt = -changeAmt;
        let change = this.asset * changeAmt;
        this.asset -= change;

        if (this.asset * candle[1] < this.currency * 0.05) {
          change += this.asset;
          this.asset = 0;
          changeAmt = 1;
        }

        this.avgPosRem += changeAmt;

        const sellVal = change * (1 - (this.fees + this.slippage)) * candle[1];
        this.currency += sellVal;

        const worth = this.getValue(candle[1]);

        this.sells++;

        const deltaWorth = worth - this.currentWorth;

        if (deltaWorth >= 0) {
          this.avgWin += deltaWorth;
          this.tradesWon++;
        } else if (deltaWorth < 0) {
          this.avgLoss += deltaWorth;
          this.tradesLost++;
        }

        this.currentWorth = worth;
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

  getValue: function(currentPrice) {
    return (
      this.currency +
      this.asset * currentPrice * (1 - (this.fees + this.slippage))
    );
  },

  // doShort: function(positionSize, candle) {
  //   if (this.allowShorts) {
  //   }
  // },

  handleCandle: function(candle, [buySig, buySize, sellSig, sellSize]) {
    //    positionSize = positionSize === undefined ? 0 : positionSize;

    // buySize = 0.1
    // sellSize = 0.1

    if (buySig > this.longThresh && !this.posTrigger) {
      this.posTrigger = !this.posTrigger;
      this.doLong(buySize, candle);
    }
    /*    if (buySig < -this.longThresh) {
      this.doLong(-Math.max(0,sellSize), candle);
    } */
    /*    const foo = 0.1
    if (signal > this.longThresh && !this.posTrigger) {
      // this.posTrigger = !this.posTrigger
      this.doLong(positionSize, candle);
    } 
    if (signal < -this.longThresh && !this.posTrigger) {
      // this.posTrigger = !this.posTrigger
      this.doLong(-positionSize, candle);
    } else if (signal < this.shortThresh) {
      //this.doShort(positionSize, candle);
    } else {
      //do something? Exit all positions maybe?
    }*/
    if (
      buySig < this.longThresh &&
      buySig > -this.longThresh &&
      this.posTrigger
    ) {
      this.posTrigger = !this.posTrigger;
    }

    /*    if (!(this.tickCount & 1)) {
      const currentWorth =
        this.currency +
        this.asset * (1 - (this.fees + this.slippage)) * candle[1];
      const deltaWorth = currentWorth - this.prevWorth;
      this.prevWorth = currentWorth;

      if (deltaWorth > 0) {
        this.avgWin += deltaWorth;
        this.ticksWon++;
      } else if (deltaWorth < 0) {
        this.avgLoss += deltaWorth;
        this.ticksLost++;
      }
    }*/

    if (this.asset > 0) {
      this.exposure++;
    }

    this.tickCount++;
  },

  //leaving thoughts here for future me. probably don't need the raw candle data to be
  //in the form of an array of arrays. can leave it as an object of arrays so we can reference
  //something like this.data.close instead of this.data[1] which is a little awkward
  runTrades: function() {
    this.data[0].forEach((x, index) => {
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

    const profit = this.getValue(this.data[this.data.length - 1][1]);

    // this.tradesWon = Math.max(Number.EPSILON,this.tradesWon)
    // this.tradesLost = Math.max(Number.EPSILON,this.tradesLost)

    function safeDiv(num, denom) {
      if (Math.abs(denom) <= Number.EPSILON) return 0;
      return num / denom;
    }

    this.winSum = this.avgWin;
    this.loseSum = this.avgLoss;
    this.avgWin = safeDiv(this.avgWin, this.tradesWon);
    this.avgLoss = safeDiv(this.avgLoss, this.tradesLost);

    return {
      currency: this.currency,
      startCurrency: this.startCurrency,
      asset: this.asset,
      value: profit,

      buys: this.buys,
      sells: this.sells,

      buysToTimeSpanRatio: this.buys / this.tickCount,
      sellsToTimeSpanRatio: this.sells / this.tickCount,

      buysToSellsRatio: safeDiv(this.buys, this.sells),
      winSum: this.winSum,
      loseSum: this.loseSum,
      avgWin: this.avgWin,
      avgLoss: this.avgLoss,

      wins: this.tradesWon,
      losses: this.tradesLost,

      avgPosAdd: this.avgPosAdd / Math.max(Number.EPSILON, this.buys),
      avgPosRem: this.avgPosRem / Math.max(Number.EPSILON, this.sells),
      profit: profit,
      R: safeDiv(this.avgWin, -this.avgLoss),
      winRate: safeDiv(this.tradesWon, this.tradesWon + this.tradesLost),
      exposure: this.exposure / this.tickCount,

      genomeNodes: this.genome.nodes.length / 10,
      genomeConnections: this.genome.connections.length / 10,
      genomeGates: this.genome.gates.length / 10,
      genomeSelfConnections: this.genome.selfconns.length / 10
    };
  }
};

module.exports = TradeManager;

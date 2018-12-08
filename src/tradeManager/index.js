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
    this.ticksLost = 0;
    this.ticksWon = 0;
    this.avgWin = 0;
    this.avgLoss = 0;

    this.tickCount = 0;

    this.avgPosAdd = 0;
    this.avgPosRem = 0;

    this.totalTime = 0;
    this.exposure = 0;

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

      const changeAmt = positionSize;

      if (changeAmt > 0 && this.currency > 0) {
        const change = this.currency * changeAmt;
        this.currency -= change;

        this.avgPosAdd += changeAmt;

        this.asset += (change * (1 - (this.fees + this.slippage))) / candle[1];
        this.buys++;
      } else if (changeAmt < 0 && this.asset > 0) {
        const change = this.asset * -changeAmt;
        this.asset -= change;

        this.avgPosRem -= changeAmt;

        const sellVal = change * (1 - (this.fees + this.slippage)) * candle[1];
        this.currency += sellVal;
        this.sells++;
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

  // doShort: function(positionSize, candle) {
  //   if (this.allowShorts) {
  //   }
  // },

  handleCandle: function(candle, [signal, positionSize]) {
    positionSize = positionSize === undefined ? 1 : positionSize;

    if (signal > this.longThresh && !this.posTrigger) {
      //      this.posTrigger = !this.posTrigger
      this.doLong(positionSize, candle);
    } else if (signal < -this.longThresh && !this.posTrigger) {
      //      this.posTrigger = !this.posTrigger
      this.doLong(-positionSize, candle);
    } else if (signal < this.shortThresh) {
      //this.doShort(positionSize, candle);
    } else {
      //do something? Exit all positions maybe?
    }
    /*  if( signal < this.longThresh && signal > -this.longThresh && this.posTrigger) {
      this.posTrigger = !this.posTrigger
    }*/

    if (!(this.tickCount & 1)) {
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

    return {
      currency: this.currency,
      startCurrency: this.startCurrency,
      asset: this.asset,
      value: this.currency + this.asset * this.data[this.data.length - 1][1],
      buys: this.buys,
      sells: this.sells,
      ticksWon: this.ticksWon,
      ticksLost: this.ticksLost,
      avgWin: this.avgWin / this.ticksWon,
      avgLoss: this.avgLoss / this.ticksLost,
      avgPosAdd: this.avgPosAdd / this.buys,
      avgPosRem: this.avgPosRem / this.sells
    };
  }
};

module.exports = TradeManager;

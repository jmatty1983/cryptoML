const TradeManager = {
  init: function(
    genome,
    data,
    networkInput,
    { buyThresh, sellThresh, positionChangeThesh, fees, slippage, allowShorts }
  ) {
    this.genome = genome;
    this.data = data;
    this.networkInput = networkInput;
    this.buyThresh = buyThresh;
    this.sellThresh = sellThresh;
    this.positionChangeThesh = positionChangeThesh;
    this.fees = fees;
    this.slippage = slippage;
    this.asset = 0;
    this.currency = 1;
    this.allowShorts = allowShorts;

    this.position = {
      type: "none"
    };
  },

  checkOrder: function(type, positionSize, candle) {
    if (
      this.position.type === "none" &&
      positionSize > this.positionChangeThesh
    ) {
      if (type === "long") {
        //enter a long position
      } else if (type === "short" && this.allowShorts) {
        //enter a short position
      }
    }
    if (type !== this.position.type) {
      //check for exiting a position condition
    } else {
      //check for changing position size
    }
  },

  handleCandle: function(candle, [signal, positionSize]) {
    positionSize = positionSize === undefined ? 1 : positionSize;

    if (signal >= buyThresh) {
      this.checkOrder("long", positionSize, candle);
    } else if (signal <= sellThresh) {
      this.checkOrder("short", positionSize, candle);
    }
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
      const output = this.genome.activate(candleInput);

      this.handleCandle(candle, output);
    });
  }
};

module.exports = TradeManager;

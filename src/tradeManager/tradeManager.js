//For our trade manager we basically have 3 actions: BUY, SELL, DO NOTHING
//We'll set them up in such a way that each action takes 1/3rd fo the output
//from the network

//going to consider making this configurable ... i don't think it's necessary right now though
const buyThresh = 0.667;
const sellThresh = 0.333;

const TradeManager = {
  init: function(genome, data, networkInput) {
    this.genome = genome;
    this.data = data;
    this.networkInput = networkInput;
  },

  //leaving thoughts here for future me. probably don't need the raw candle data to be
  //in the form of an array of arrays. can leave it as an object of arrays so we can reference
  //something like this.data.close instead of this.data[3] which is a little awkward
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
  },

  handleCandle: function(candle, output) {
    if (output <= sellThresh) {
      console.log("sell");
    } else if (output >= buyThresh) {
      console.log("buy");
    }
  }
};

module.exports = TradeManager;

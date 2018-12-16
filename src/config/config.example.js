//IMPORTANT: All of these configs should be saved with the network genomes

exports.neatConfig = {
  populationSize: 100,
  mutationRate: 0.5,
  fitBreedAmt: 0.1,
  rndBreedAmt: 0.1,
  //1 - Buy Sell Only
  //2 - Buy Sell Position Size
  outputSize: 2,
  //just a place holder for now. Will allow configuring which candle inputs to feed the network
  inputs: [
    {
      name: "opens",
      normFunc: "percentageChangeLog2"
    },
    {
      name: "highs",
      normFunc: "percentageChangeLog2"
    },
    {
      name: "lows",
      normFunc: "percentageChangeLog2"
    },
    {
      name: "closes",
      normFunc: "percentageChangeLog2"
    },
    {
      name: "volumes",
      normFunc: "percentageChangeLog2"
    }
  ]
};

exports.indicatorConfig = [
  {
    name: "sma",
    params: [9],
    //just a place holder for now. Will allow different normalising functions to be applied
    //to different indicators
    normFunc: "percentageChangeLog2"
  }
];

exports.traderConfig = {
  //Threshold for network signal output to be interpreted as going long
  longThresh: 0.333,
  //Threshold for network signal output to be interpreted as going short
  shortThresh: 0,
  //Minimum positions size change required before placing an order
  positionChangeThesh: 0.05,
  //Fees and slippage used for calculating pnl
  fees: 0.001,
  slippage: 0.002,
  //Config for training with short positions - Ignored for now
  allowShorts: false
};

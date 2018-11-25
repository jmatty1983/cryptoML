exports.networkConfig = {
  populationSize: 100,
  mutationRate: 0.5,
  //1 - Buy Sell Only
  //2 - Buy Sell Position Size
  outputSize: 2,
  //just a place holder for now. Will allow configuring which candle inputs to feed the network
  inputs: ["open", "close", "high", "low", "volume"]
};

exports.indicatorConfig = [
  {
    name: "sma",
    params: [9],
    //just a place holder for now. Will allow different normalising functions to be applied
    //to different indicators
    normFunc: "norm"
  }
];

exports.traderConfig = {
  buyThresh: 0.667,
  sellThresh: 0.333,
  positionChangeThesh: 0.05,
  fees: 0.001,
  slippage: 0.002,
  allowShorts: false
};

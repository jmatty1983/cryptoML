//IMPORTANT: All of these configs should be saved with the network genomes

exports.neatConfig = {
  populationSize: 200,
  mutationRate: 1,
  mutationAmount: 1,
  fitBreedAmt: 0.1,
  rndBreedAmt: 0.1,
  //1 - Buy Sell Only
  //2 - Buy Sell Position Size
  outputSize: 4,
  // see what tradeManager returns
  noveltySearchAddRandom: 4,
  noveltySearchAddFittest: 0,
  noveltySearchObjectives: [
    "winRate",
    "exposure",
    "avgPosAdd",
    "avgPosRem",
    "genomeNodes",
    "genomeConnections",
    "genomeGates",
    "genomeSelfConnections",
    "buysToTradesRatio",
    "buysToTimeSpanRatio",
    "sellsToTimeSpanRatio"
  ],
  //
  sortingObjectives: [
    "OK",
    "profit",
    "currency",
    "R",
    "novelty",
    "winRate",
    "buys",
    "sells"
  ],
  //just a place holder for now. Will allow configuring which candle inputs to feed the network
  inputs: [
    {
      name: "open",
      normFunc: "norm"
    },
    {
      name: "close",
      normFunc: "norm"
    },
    {
      name: "high",
      normFunc: "norm"
    },
    {
      name: "low",
      normFunc: "norm"
    },
    {
      name: "volume",
      normFunc: "norm"
    }
  ]
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
  //Threshold for network signal output to be interpreted as going long
  longThresh: 1 / 32,
  //Threshold for network signal output to be interpreted as going short
  shortThresh: 0,
  //Minimum positions size change required before placing an order
  positionChangeThresh: 0.05,
  //Fees and slippage used for calculating pnl
  fees: 0.001,
  slippage: 0.002,
  //Config for training with short positions - Ignored for now
  allowShorts: false
};

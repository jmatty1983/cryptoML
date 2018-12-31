//IMPORTANT: All of these configs should be saved with the network genomes

exports.neatConfig = {
  populationSize: 256,
  mutationRate: 0.5,
  mutationAmount: 1,

  trainAmt: 0.65,
  gapAmt: 0.05,

  fitBreedAmt: 0.1,
  rndBreedAmt: 0.1,

  discardDuplicateGenomes: false,

  // 2 - Long Buy Sell & Position Size
  outputSize: 2,

  candidatePopulationSize: 32,
  candidateSortingCriteria: ["profit", "EV", "R", "winRate"],
  // novelty search related
  noveltySearchDistanceOrder: 1.8,
  noveltySearchAddRandom: 4,
  noveltySearchAddFittest: 0,
  noveltySearchObjectives: [
    "winRate",
    "exposure",
    "avgPosSize",
    "genomeNodes",
    "genomeConnections",
    "genomeGates",
    "genomeSelfConnections",
    "buysToTradesRatio",
    "avgExpDepth",
    "RTsToTimeSpanRatio"
  ],
  //
  sortingObjectives: [
    "OK",
    "profit",
    "R",
    "novelty",
    "winRate",
    "maxUpDraw",
    "maxDrawDown",
    "maxProfit",
    "maxLoss",
    "EV",
    "RTs"
  ],
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
  },
  {
    name: "kf",
    params: [{ R: 0.01, Q: 3, A: 1.05, index: 3 }],
    normFunc: "percentageChangeLog2"
  }
];

exports.traderConfig = {
  //Threshold for network signal output to be interpreted as going long
  longThresh: 1 / 32,
  //Threshold for network signal output to be interpreted as going short
  shortThresh: 0,
  // position size limits
  maxPositions: 250,
  minPositionSize: 0.05,
  maxPositionSize: 1.0,
  //Fees and slippage used for calculating pnl
  fees: 0.001,
  slippage: 0.002,
  //Config for training with short positions - Ignored for now
  allowShorts: false
};

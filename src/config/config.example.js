//IMPORTANT: All of these configs should be saved with the network genomes

exports.neatConfig = {
  populationSize: 256,
  mutationRate: 0.5,
  mutationAmount: 1,

  trainChunks: 3,
  trainAmt: 0.55,
  gapAmt: 0.05,

  fitBreedAmt: 0.1,
  rndBreedAmt: 0.1,

  // 2 - Long Buy Sell & Position Size
  outputSize: 2,
  //
  discardDuplicateGenomes: false,
  saveCandidateGenomes: true,

  candidatePopulationSize: 256,
  candidateSortingCriteria: ["profit", "R"],
  // novelty search related
  noveltySearchDistanceOrder: 1.78,
  noveltySearchAddRandom: 4,
  noveltySearchAddFittest: 0,
  noveltySearchObjectives: [
    "winRate",
    "exposure",
    "avgPosSize",
    "avgWin",
    "avgLoss",
    "maxProfit",
    "maxLoss",
    "maxDrawDown",
    "maxUpDraw",
    "genomeNodes",
    "genomeConnections",
    "genomeGates",
    "genomeSelfConnections",
    "avgExpDepth",
    "buys",
    "sells"
  ],
  localCompetitionObjectives: [
    "profit",
    "winRate",
    "sharpe",
    "avgWin",
    "maxDrawDown"
  ],
  //
  sortingObjectives: ["profit", "novelty", "sharpe", "maxDrawDown"],

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
    params: [{ length: 5, index: 3 }],
    normFunc: "percentageChangeLog2"
  },
  {
    name: "kf",
    params: [{ R: 0.02, Q: 3, A: 1.15, index: 3 }],
    normFunc: "percentageChangeLog2"
  }
];

exports.traderConfig = {
  //Threshold for network signal output to be interpreted as going long
  longThresh: 1 / 256,
  //Threshold for network signal output to be interpreted as going short
  shortThresh: 0,
  // position limits
  maxOpenPositions: 20,
  minPositionSize: 0.1,
  maxPositionSize: 1.0,
  //Fees and slippage used for calculating pnl
  fees: 0.001,
  slippage: 0.002,
  //Config for training with short positions - Ignored for now
  allowShorts: false
};

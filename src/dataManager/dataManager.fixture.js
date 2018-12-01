const tradeInput = [
  {
    id: 1,
    tradeId: 1,
    timestamp: 1538647253444,
    price: 1.0058,
    quantity: 10.9
  },
  {
    id: 2,
    tradeId: 2,
    timestamp: 1538647253728,
    price: 1.0048,
    quantity: 100.2
  },
  {
    id: 3,
    tradeId: 3,
    timestamp: 1538647253769,
    price: 1.0048,
    quantity: 12.95
  },
  {
    id: 4,
    tradeId: 4,
    timestamp: 1538647253825,
    price: 1.0048,
    quantity: 100.13
  },
  {
    id: 5,
    tradeId: 5,
    timestamp: 1538647255599,
    price: 1.0048,
    quantity: 65.94
  },
  {
    id: 6,
    tradeId: 6,
    timestamp: 1538647256713,
    price: 1.0048,
    quantity: 159.24
  },
  {
    id: 7,
    tradeId: 7,
    timestamp: 1538647256742,
    price: 1.0048,
    quantity: 44.64
  },
  {
    id: 8,
    tradeId: 8,
    timestamp: 1538647271296,
    price: 1.0,
    quantity: 10.0
  },
  {
    id: 9,
    tradeId: 9,
    timestamp: 1538647291893,
    price: 1.0,
    quantity: 0.9
  },
  {
    id: 10,
    tradeId: 10,
    timestamp: 1538647295964,
    price: 1.05,
    quantity: 0.01
  },
  {
    id: 11,
    tradeId: 11,
    timestamp: 1538647319117,
    price: 1.0496,
    quantity: 10.0
  },
  {
    id: 12,
    tradeId: 12,
    timestamp: 1538647322155,
    price: 1.0496,
    quantity: 377.42
  }
];

const tickOutput = {
  candles: [
    {
      volume: 111.10000000000001,
      high: 1.0058,
      low: 1.0048,
      open: 1.0058,
      close: 1.0048,
      tradeId: 2
    },
    {
      volume: 113.08,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 4
    },
    {
      volume: 225.18,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 6
    },
    {
      volume: 54.64,
      high: 1.0048,
      low: 1,
      open: 1.0048,
      close: 1,
      tradeId: 8
    },
    {
      volume: 0.91,
      high: 1.05,
      low: 1,
      open: 1,
      close: 1.05,
      tradeId: 10
    },
    {
      volume: 387.42,
      high: 1.0496,
      low: 1.0496,
      open: 1.0496,
      close: 1.0496,
      tradeId: 12
    }
  ],
  remainder: null
};

const timeOutput = {
  candles: [
    {
      volume: 224.18,
      high: 1.0058,
      low: 1.0048,
      open: 1.0058,
      close: 1.0048,
      tradeId: 4
    },
    {
      volume: 65.94,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 5
    },
    {
      volume: 203.88,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 7
    },
    {
      volume: 10,
      high: 1,
      low: 1,
      open: 1,
      close: 1,
      tradeId: 8
    },
    {
      volume: 0.9,
      high: 1,
      low: 1,
      open: 1,
      close: 1,
      tradeId: 9
    },
    {
      volume: 0.01,
      high: 1.05,
      low: 1.05,
      open: 1.05,
      close: 1.05,
      tradeId: 10
    },
    {
      volume: 10,
      high: 1.0496,
      low: 1.0496,
      open: 1.0496,
      close: 1.0496,
      tradeId: 11
    }
  ],
  remainder: [
    {
      id: 12,
      tradeId: 12,
      timestamp: 1538647322155,
      price: 1.0496,
      quantity: 377.42
    }
  ]
};

const volumeOutput = {
  candles: [
    {
      volume: 10,
      high: 1.0058,
      low: 1.0048,
      open: 1.0058,
      close: 1.0048,
      tradeId: 2
    },
    {
      volume: 10,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 3
    },
    {
      volume: 10,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 4
    },
    {
      volume: 10,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 5
    },
    {
      volume: 10,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 6
    },
    {
      volume: 10,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 7
    },
    {
      volume: 10,
      high: 1.0048,
      low: 1,
      open: 1.0048,
      close: 1,
      tradeId: 8
    },
    {
      volume: 10,
      high: 1,
      low: 1,
      open: 1,
      close: 1,
      tradeId: 9
    },
    {
      volume: 10,
      high: 1.05,
      low: 1,
      open: 1,
      close: 1.05,
      tradeId: 10
    },
    {
      volume: 10,
      high: 1.05,
      low: 1.0496,
      open: 1.05,
      close: 1.0496,
      tradeId: 11
    },
    {
      volume: 10,
      high: 1.0496,
      low: 1.0496,
      open: 1.0496,
      close: 1.0496,
      tradeId: 12
    }
  ],
  remainder: [
    {
      id: 12,
      tradeId: 12,
      timestamp: 1538647322155,
      price: 1.0496,
      quantity: 782.3299999999999
    }
  ]
};

const currencyOutput = {
  candles: [
    {
      volume: 9.94138136942675,
      high: 1.0058,
      low: 1.0048,
      open: 1.0058,
      close: 1.0048,
      tradeId: 2
    },
    {
      volume: 9.952229299363054,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 3
    },
    {
      volume: 9.952229299363069,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 4
    },
    {
      volume: 9.952229299363069,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 5
    },
    {
      volume: 9.95222929936304,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 6
    },
    {
      volume: 9.952229299363069,
      high: 1.0048,
      low: 1.0048,
      open: 1.0048,
      close: 1.0048,
      tradeId: 7
    },
    {
      volume: 7.915372133758012,
      high: 1.0048,
      low: 1,
      open: 1.0048,
      close: 1,
      tradeId: 8
    },
    {
      volume: 10,
      high: 1,
      low: 1,
      open: 1,
      close: 1,
      tradeId: 9
    },
    {
      volume: 29.870576190476186,
      high: 1.05,
      low: 1,
      open: 1,
      close: 1.05,
      tradeId: 10
    },
    {
      volume: 9.375982650987225,
      high: 1.05,
      low: 1.0496,
      open: 1.05,
      close: 1.0496,
      tradeId: 11
    },
    {
      volume: 9.527439024390276,
      high: 1.0496,
      low: 1.0496,
      open: 1.0496,
      close: 1.0496,
      tradeId: 12
    }
  ],
  remainder: [
    {
      id: 12,
      tradeId: 12,
      timestamp: 1538647322155,
      price: 1.0496,
      quantity: 765.9381021341462
    }
  ]
};

const candleData = [
  {
    id: 1,
    open: 1.0058,
    close: 1.01,
    high: 1.05,
    low: 1.0,
    volume: 94431.02,
    tradeId: 267
  },
  {
    id: 2,
    open: 1.0109,
    close: 1.0061,
    high: 1.0122,
    low: 1.0061,
    volume: 86105.07,
    tradeId: 482
  },
  {
    id: 3,
    open: 1.0065,
    close: 1.0067,
    high: 1.0097,
    low: 1.0047,
    volume: 109034.8,
    tradeId: 737
  },
  {
    id: 4,
    open: 1.0066,
    close: 1.0038,
    high: 1.01,
    low: 1.002,
    volume: 222153.41,
    tradeId: 1150
  },
  {
    id: 5,
    open: 1.004,
    close: 1.0066,
    high: 1.0071,
    low: 1.003,
    volume: 149768.14,
    tradeId: 1493
  },
  {
    id: 6,
    open: 1.0066,
    close: 1.0073,
    high: 1.0085,
    low: 1.0058,
    volume: 108068.79,
    tradeId: 1768
  },
  {
    id: 7,
    open: 1.0074,
    close: 1.0084,
    high: 1.01,
    low: 1.0066,
    volume: 130254.03,
    tradeId: 2064
  },
  {
    id: 8,
    open: 1.009,
    close: 1.0083,
    high: 1.0091,
    low: 1.0075,
    volume: 69910.69,
    tradeId: 2348
  },
  {
    id: 9,
    open: 1.0078,
    close: 1.0072,
    high: 1.0109,
    low: 1.0069,
    volume: 90891.92,
    tradeId: 2604
  },
  {
    id: 10,
    open: 1.0091,
    close: 1.0088,
    high: 1.0106,
    low: 1.0073,
    volume: 42802.76,
    tradeId: 2780
  }
];

const candleArrays = [
  [
    1.0058,
    1.0109,
    1.0065,
    1.0066,
    1.004,
    1.0066,
    1.0074,
    1.009,
    1.0078,
    1.0091
  ],
  [
    1.01,
    1.0061,
    1.0067,
    1.0038,
    1.0066,
    1.0073,
    1.0084,
    1.0083,
    1.0072,
    1.0088
  ],
  [1.05, 1.0122, 1.0097, 1.01, 1.0071, 1.0085, 1.01, 1.0091, 1.0109, 1.0106],
  [1.0, 1.0061, 1.0047, 1.002, 1.003, 1.0058, 1.0066, 1.0075, 1.0069, 1.0073],
  [
    94431.02,
    86105.07,
    109034.8,
    222153.41,
    149768.14,
    108068.79,
    130254.03,
    69910.69,
    90891.92,
    42802.76
  ]
];

const candleArraysInd = [
  [1.0074, 1.009, 1.0078, 1.0091],
  [1.0084, 1.0083, 1.0072, 1.0088],
  [1.01, 1.0091, 1.0109, 1.0106],
  [1.0066, 1.0075, 1.0069, 1.0073],
  [130254.03, 69910.69, 90891.92, 42802.76],
  [
    1.0069857142857142,
    1.0067428571428572,
    1.0069000000000001,
    1.0071999999999999
  ]
];

module.exports = {
  tradeInput,
  tickOutput,
  timeOutput,
  volumeOutput,
  currencyOutput,
  candleData,
  candleArrays,
  candleArraysInd
};

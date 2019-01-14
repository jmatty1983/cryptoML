const table = require("table");
const { Logger } = require("../../logger");

let displayPopulationStats = (genomes, generation) => {
  const tableOptions = {
    columnDefault: {
      paddingLeft: 0,
      paddingRight: 0
    },
    border: table.getBorderCharacters(`void`),
    columnDefault: {
      alignment: "right"
    },
    drawHorizontalLine: (index, size) => {
      return index < 1 || index === size;
    }
  };

  const header = [
    "Gen " + generation,
    "  ",
    "PnL",
    "RTs",
    "Win%",
    "MDD",
    // "V2R",
    "OK",
    // "̅dBt",
    // "̅dPk",
    "  ",
    "PnL",
    "RTs",
    "Win%",
    "MDD",
    "OK"
    // "V2R",
    // "̅dBt",
    // "̅dPk"
    // " ",
    // "Name"
  ];

  let sign = value => (Number(value) > 0 ? "+" + Number(value) : Number(value));

  const d = genomes.map((g, index) => [
    g.generation,
    "Train".charAt(index),
    sign((100 * g.stats.profit).toFixed(2)) + "%",
    g.stats.RTsPerMonth.toFixed(2),
    (100 * g.stats.winRate).toFixed(1),
    g.stats.maxDrawDown.toFixed(2),
    g.stats.OK.toFixed(1),
    // g.stats.avgBottomDist.toFixed(2),
    // g.stats.avgPeakDist.toFixed(2),
    // g.stats.novelty.toFixed(2),
    "Test".charAt(index),
    sign((100 * g.testStats.profit).toFixed(2)) + "%",
    g.testStats.RTsPerMonth.toFixed(2),
    (100 * g.testStats.winRate).toFixed(1),
    g.testStats.maxDrawDown.toFixed(2),
    g.testStats.OK.toFixed(1)
    // g.testStats.v2ratio.toFixed(2),
    // g.testStats.avgBottomDist.toFixed(2),
    // g.testStats.avgPeakDist.toFixed(2)
    // " ",
    // g.name
  ]);

  if (d.length) {
    table
      .table([[...header], ...d], tableOptions)
      .slice(1, -1)
      .split("\n")
      .map(item => item.slice(1, -1))
      .forEach(Logger.debug);
  } else {
    Logger.debug(`No candidates found in generation ${generation}`);
  }
};

module.exports = displayPopulationStats;

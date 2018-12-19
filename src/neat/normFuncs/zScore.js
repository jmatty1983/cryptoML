const math = require("mathjs");

/**
 * Returns an object with avg and std of said array.
 *
 * @param {Array} array - array of numbers
 * @returns {Object {median}
 */
exports.zScorePoints = function(array) {
  return {
    avg: math.mean(...array),
    std: math.std(...array)
  };
};

/**
 * Returns an array of normalised zScore data.
 *
 * @param {Array} array - array of numbers
 * @param {Object { avg, std }} - an object with a zScore number to normalise data with
 * @returns {Array}
 */
exports.zScoreArray = function(array, { avg, std }) {
  return array.map(val => {
    val = parseFloat(val);
    if (val === -Infinity) {
      return -1;
    } else if (val == Infinity) {
      return 1;
    }
    const zScore = (val - avg) / std;
    return zScore;
  });
};

/**
 * returns an object with the normalising points and normalised data
 *
 * @param {Array} - array of data
 * @returns {Object} - {points, data}
 */
exports.GetzScoreata = function(array) {
  const points = exports.zScorePoints(array);

  return {
    points,
    data: exports.zScoreArray(array, points)
  };
};

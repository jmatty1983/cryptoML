const math = require("mathjs");

/**
 * Returns an object with keys median for the minimum and maximum values of an array
 *
 * @param {Array} array - array of numbers
 * @returns {Object {median}
 */
exports.medianPoints = function(array) {
  return {
    median: math.median(...array)
  };
};

/**
 * Returns an array of normalised median data.
 *
 * @param {Array} array - array of numbers
 * @param {Object {median}} - an object with a median number to normalise data with
 * @returns {Array}
 */
exports.medianArray = function(array, { median }) {
  return array.map(val => {
    val = parseFloat(val);

    if (val === -Infinity) {
      return 0;
    } else if (val == Infinity) {
      return 1;
    }

    const normMedian = val / median;

    return normMedian;
  });
};

/**
 * returns an object with the normalising points and normalised data
 *
 * @param {Array} - array of data
 * @returns {Object} - {points, data}
 */
exports.GetmedianData = function(array) {
  const points = exports.medianPoints(array);

  return {
    points,
    data: exports.medianArray(array, points)
  };
};

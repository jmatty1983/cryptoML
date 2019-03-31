const math = require("mathjs");

/**
 * Returns an object with mean of an array
 *
 * @param {Array} array - array of numbers
 * @returns {Object {mean}
 */
exports.MADPoints = function(array) {
  console.log(array.reduce((a, b) => a + b, 0) / array.length);
  console.log(math.mean(...array));
  return {
    mean: array.reduce((a, b) => a + b, 0) / array.length
  };
};

/**
 * Returns an array of normalised MAD data.
 *
 * @param {Array} array - array of numbers
 * @param {Object {mean}} - an object with a min and max number to normalise data with
 * @returns {Array}
 */
exports.MADArray = function(array) {
  console.log(array.reduce((a, b) => a + b, 0) / array.length);
  console.log(math.mean(...array));
  array.map(val => {
    val = parseFloat(val);

    if (val === -Infinity) {
      return 0;
    } else if (val == Infinity) {
      return 0;
    }

    const distance = val - mean;
    //console.log(distance)
    return distance;
  });

  return array.map(distance => {
    distance = parseFloat(distance);
    const mad = distance / array.length;
    return mad;
  });
};

/**
 * returns an object with the normalising points and normalised data
 *
 * @param {Array} - array of data
 * @returns {Object} - {points, data}
 */
exports.GetMADData = function(array) {
  const points = exports.MADPoints(array);

  return {
    points,
    data: exports.MADArray(array, points)
  };
};

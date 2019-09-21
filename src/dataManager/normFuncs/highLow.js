/**
 * Returns an object with keys min and max for the minimum and maximum values of an array
 *
 * @param {Array} array - array of numbers
 * @returns {Object {min, max}}
 */
exports.NormalisedPoints = function(array) {
  return {
    min: Math.min(...array),
    max: Math.max(...array)
  };
};

/**
 * Returns an array of normalised data between 0 and 1
 *
 * @param {Array} array - array of numbers
 * @param {Object {min, max}} - an object with a min and max number to normalise data with
 * @returns {Array}
 */
exports.NormaliseArray = function(array, { min, max }) {
  return array.map(n => (n - min) / (max - min));
};

/**
 * returns an object with the normalising points and normalised data
 *
 * @param {Array} - array of data
 * @returns {Object} - {points, data}
 */
exports.GetNormalisedData = function(array) {
  const points = exports.NormalisedPoints(array);

  return {
    points,
    data: exports.NormaliseArray(array, points)
  };
};

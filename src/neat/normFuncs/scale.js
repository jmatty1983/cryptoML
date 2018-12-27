const math = require("mathjs");

/**
 * Returns an object with keys length of an array
 *
 * @param {Array} array - array of numbers
 * @returns {Object {median}
 */
exports.scalePoints = function(array) {
  function getlength(number) {
    return number.toString().length;
  }
  return {
    length: getlength(...array)
  };
};

/**
 * Returns an array of normalised median data.
 *
 * @param {Array} array - array of numbers
 * @param {Object {median}} - an object with a median number to normalise data with
 * @returns {Array}
 */
exports.scaleArray = function(array, { length }) {
  return array.map(val => {
    val = parseFloat(val);

    if (val === -Infinity) {
      return 0;
    } else if (val == Infinity) {
      return 1;
    }

    const normscale = val / math.pow(10, length);

    return normscale;
  });
};

/**
 * returns an object with the normalising points and normalised data
 *
 * @param {Array} - array of data
 * @returns {Object} - {points, data}
 */
exports.GetscaleData = function(array) {
  const points = exports.scalePoints(array);

  return {
    points,
    data: exports.scaleArray(array, points)
  };
};

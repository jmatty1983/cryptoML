const ArrayUtils = {
  /**
   * Returns an average of the array of numbers
   *
   * @param {Array} array - array of numbers
   * @returns {Array}
   */
  average: function(array) {
    return this.sum(array) / array.length;
  },

  /**
   * Takes an array of objects and returns an array of the values from a property name
   *
   * @param {string} prop - string name for property
   * @param {Array[Object]} array - array of objects
   * @returns {Array}
   */
  getProp: function(prop, array) {
    return array.map(item => item[prop]);
  },

  /**
   * Returns the sum of an array of numbers
   *
   * @param {Array} array - array of numbers
   * @returns {Number}
   */
  sum: function(array) {
    return array.reduce((total, item) => (total += item), 0);
  }
};

module.exports = ArrayUtils;

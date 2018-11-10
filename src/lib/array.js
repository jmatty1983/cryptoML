const ArrayUtils = {
  average: function(array) {
    return this.sum(array) / array.length;
  },
  getProp: function(prop, array) {
    return array.map(item => item[prop]);
  },
  sum: function(array) {
    return array.reduce((total, item) => (total += item), 0);
  }
};

module.exports = ArrayUtils;

exports.percentageChange = function(array) {
  return array.map((item, index) => (index ? item / array[index - 1] : 1));
};

exports.percentageChangeLog2 = function(array) {
  return exports.percentageChange(array).map(item => Math.log2(item) ? Math.log2(item) : 0);
};

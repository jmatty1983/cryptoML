exports.percentageChange = function(array) {
  return array
    .map((item, index) => {
      if (index === 0) {
        return null;
      } else {
        return item / array[index - 1];
      }
    })
    .slice(1);
};

exports.percentageChangeLog2 = function(array) {
  return exports.percentageChange(array).map(item => Math.log2(item));
};

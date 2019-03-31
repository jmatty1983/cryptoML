const math = require("mathjs");

const MEDIAN = ({ length, index = 3 }, candles) =>

  candles[index].reduce((median, item, idx, array) => {
     
      const med = math.median(array.slice(Math.max(0, idx + 1 - length), idx + 1))
      //console.log(med)
      median.push(item / med);
      //console.log(median.slice(0,50))
      return median;
      
  }, []);

module.exports = MEDIAN;

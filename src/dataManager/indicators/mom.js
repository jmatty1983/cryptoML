const math = require("mathjs");

const MOM = ({ length, index = 3 }, candles) =>

  candles[index].reduce((median, item, idx, array) => {
     
      const med = math.median(array.slice(Math.max(0, idx + 1 - length), idx + 1))
      const medshort = math.median(array.slice(Math.max(0, idx + 1 - (length/3)), idx + 1))
      //console.log("MED", med)
      //console.log("MEDSHORT", medshort)
      median.push(item - med);
      //median.push(medshort - med)
      //console.log(median.slice(0,50))
      return median;
      
  }, []);

module.exports = MOM;

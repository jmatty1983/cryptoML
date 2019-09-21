
const rollingWindow = ({ length }, candles) =>

  candles.reduce((window, item, idx, array) => {
     
      const window = array.slice(Math.max(0, idx + 1 - length), idx + 1)
      console.log(window)
      return window;
      
  }, []);

module.exports = rollingWindow;

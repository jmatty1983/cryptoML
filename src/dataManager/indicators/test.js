const TEST = (length, [ , highs, lows, closes]) =>
    closes.reduce((test, item, idx, array) => {
        const low = Math.min(...lows.slice(Math.max(0, idx + 1 - length), idx + 1))
        const high = Math.max(...highs.slice(Math.max(0, idx + 1 - length), idx + 1))        
        const K = (closes[idx] - low)  / (high - low ) * 100;
        return K
    }, []);

module.exports = TEST;



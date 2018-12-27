### Installation

After cloning, run `npm install`
Copy the .env.example to .env

### CLI Commands

- `npm start import <pair>` ex: `npm start import BTC/USDT`
  - will import all trade data for a given pair from an exchange
  - pair must be a valid exchange pair
- `npm start process <pair> <type> <lengths>` ex: `npm start process BTC/USDT tick 10,50,100`
  - processes downloaded trades into different candle types
  - type must be: `tick`|`time`|`volume`|`currency`
  - lengths are comma separated with no spaces

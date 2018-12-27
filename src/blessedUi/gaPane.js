//hard coded in 5 places now .. tisk tisk
const exchange = "binance";
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

const blessed = require("neo-blessed");

const { neatConfig, indicatorConfig } = require("../config/config");
const DataManager = require("../dataManager");
const { logTransports } = require("../logger");
const Neat = require("../neat");

const dataManager = Object.create(DataManager);
dataManager.init(exchange, dataDir, dbExt);

const GaPane = {
  draw: parent => {
    this.candles = [];

    this.gaContainer = blessed.box({
      parent,
      label: " GA ",
      left: "23%",
      width: "75%",
      height: "95%",
      border: "line",
      style: {
        fg: "green",
        border: {
          fg: "red"
        }
      },
      hidden: true
    });

    this.gaCandles = blessed.list({
      parent: this.gaContainer,
      label: " Candles ",
      width: "20%",
      top: "10%",
      border: "line",
      style: {
        fg: "green",
        selected: {
          bg: "green",
          fg: "white"
        }
      },
      mouse: true,
      keys: true,
      scrollbar: {
        ch: ".",
        track: {
          bg: "yellow"
        },
        style: {
          inverse: true
        }
      }
    });

    this.gaCandlesFilter = blessed.textbox({
      parent: this.gaContainer,
      label: " Filter ",
      width: "20%",
      height: "10%",
      border: "line",
      style: {
        fg: "green",
        focus: {
          bg: "green",
          fg: "white"
        }
      },
      inputOnFocus: true,
      mouse: true
    });

    this.gaButton = blessed.button({
      parent: this.gaContainer,
      left: "20%",
      top: "15",
      height: "10%",
      width: "15%",
      style: {
        bg: "blue",
        focus: {
          bg: "#ADD8E6"
        },
        hover: {
          bg: "green"
        }
      }
    });

    blessed.text({
      parent: this.gaButton,
      height: "10",
      width: "shrink",
      content: "Start",
      left: "center",
      top: "center"
    });

    this.gaLog = blessed.log({
      parent: this.gaContainer,
      left: "20%",
      top: "10%",
      label: " Log ",
      border: "line",
      scrollback: 100,
      scrollbar: {
        ch: " ",
        track: {
          bg: "yellow"
        },
        style: {
          inverse: true
        }
      }
    });

    logTransports.on("logged", data => {
      this.gaLog.log(data[Symbol.for("message")]);
    });

    this.gaCandlesFilter.key("C-c", () => {
      this.gaContainer.screen.destroy();
      process.exit();
    });

    this.gaCandlesFilter.on("submit", () =>
      this.gaCandles.setItems(
        this.candles.filter(candle =>
          candle
            .toLowerCase()
            .includes(this.gaCandlesFilter.value.toLowerCase())
        )
      )
    );

    this.gaButton.on("click", () => {
      const [pair, type, length] = this.gaCandles.items[this.gaCandles.selected]
        .getText()
        .split("_");
      const neat = Object.create(Neat);

      this.gaButton.hidden = true;
      this.gaContainer.screen.render();
      neat.init({
        pair,
        type,
        length,
        neatConfig,
        indicatorConfig,
        exchange,
        dataDir,
        dbExt
      });

      neat.start();
    });
  },

  hide: () => {
    this.gaContainer.hidden = true;
    this.gaContainer.screen.render();
  },

  show: () => {
    this.candles = dataManager.getCandleTables().sort();
    this.gaCandles.setItems(this.candles);
    this.gaCandles.items.forEach(item => item.setHover(item.getText().trim()));
    this.gaContainer.hidden = false;
    this.gaCandlesFilter.focus();
    this.gaContainer.screen.render();
  }
};

module.exports = GaPane;

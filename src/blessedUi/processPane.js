//hard coded in 5 places now .. tisk tisk
const exchange = "binance";
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

const blessed = require("neo-blessed");

const DataManager = require("../dataManager");
const { logTransports } = require("../logger");

const dataManager = Object.create(DataManager);
dataManager.init(exchange, dataDir, dbExt);

const types = ["Tick", "Time", "Volume", "Currency"];

const ProcessPane = {
  draw: parent => {
    this.processContainer = blessed.box({
      parent,
      label: " Process ",
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

    this.processPairs = blessed.list({
      parent: this.processContainer,
      label: " Pairs ",
      width: "20%",
      height: "35%",
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

    this.processTypes = blessed.list({
      parent: this.processContainer,
      label: " Types ",
      width: "20%",
      height: "25%",
      top: "35%",
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
      items: types
    });

    this.processLengthsText = blessed.textbox({
      parent: this.processContainer,
      label: " Add Length ",
      width: "20%",
      height: "10%",
      top: "60%",
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

    this.processLengths = blessed.list({
      parent: this.processContainer,
      label: " Lengths ",
      width: "20%",
      top: "70%",
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
      items: []
    });

    this.processButton = blessed.button({
      parent: this.processContainer,
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
      parent: this.processButton,
      height: "10",
      width: "shrink",
      content: "Process",
      left: "center",
      top: "center",
      style: {
        bg: "blue"
      }
    });

    this.loader = blessed.loading({
      parent: this.processContainer.screen,
      border: "line",
      height: "shrink",
      width: "half",
      top: "center",
      left: "center",
      label: " {blue-fg}Loader{/blue-fg} ",
      tags: true,
      keys: true,
      hidden: true,
      vi: true
    });

    this.processLog = blessed.log({
      parent: this.processContainer,
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

    this.processLengthsText.key("C-c", () => {
      this.processContainer.screen.destroy();
      process.exit();
    });

    this.processLengthsText.on("submit", () => {
      this.processLengths.add(this.processLengthsText.value);
      this.processLengthsText.value = "";
      this.processLengthsText.focus();
    });

    logTransports.on("logged", data => {
      this.processLog.log(data[Symbol.for("message")]);
    });

    this.processButton.on("click", async () => {
      const pair = this.processPairs.items[
        this.processPairs.selected
      ].getText();
      const type = this.processTypes.items[this.processTypes.selected]
        .getText()
        .toLowerCase();
      const lengths = this.processLengths.items.map(item => item.getText());
      const types = lengths.map(length => ({ type, length }));
      dataManager.processCandles(pair, types);
    });
  },

  show: () => {
    this.processContainer.hidden = false;
    this.loader.load("Loading trade tables from database");
    this.processContainer.screen.render();

    const tables = dataManager.getTradeTables();
    this.processPairs.setItems(tables);
    this.processPairs.items.forEach(item =>
      item.setHover(item.getText().trim())
    );
    this.processTypes.items.forEach(item =>
      item.setHover(item.getText().trim())
    );
    this.loader.stop();
    this.processLengthsText.focus();
    this.processContainer.screen.render();
  },

  hide: () => {
    this.processContainer.hidden = true;
    this.processContainer.screen.render();
  }
};

module.exports = ProcessPane;
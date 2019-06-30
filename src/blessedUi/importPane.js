//hard coded in 5 places now .. tisk tisk
const exchange = "binance";
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

const blessed = require("neo-blessed");

const ExchangeImport = require("../exchangeImporter");
const { logTransports } = require("../logger");

const exchangeImport = Object.create(ExchangeImport);
exchangeImport.init(exchange, dataDir, dbExt);

const getPairs = async () => {
  const data = await exchangeImport.getExchangeInfo();
  return data.symbols
    .sort((a, b) => {
      const field = a.quoteAsset === b.quoteAsset ? "baseAsset" : "quoteAsset";
      return a[field] > b[field] ? 1 : -1;
    })
    .map(({ baseAsset, quoteAsset }) => `${baseAsset}/${quoteAsset}`);
};

const ImportPane = {
  draw: parent => {
    this.pairs = [];

    this.importContainer = blessed.box({
      parent,
      label: " Import ",
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

    this.importPairs = blessed.list({
      parent: this.importContainer,
      label: " Pairs ",
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

    this.importPairsFilter = blessed.textbox({
      parent: this.importContainer,
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

    this.importButton = blessed.button({
      parent: this.importContainer,
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
      parent: this.importButton,
      height: "10",
      width: "shrink",
      content: "Import",
      left: "center",
      top: "center"
    });

    this.importButton.on("click", () =>
      exchangeImport.getPair(
        this.importPairs.items[this.importPairs.selected].getText()
      )
    );

    this.importLog = blessed.log({
      parent: this.importContainer,
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
      this.importLog.log(data[Symbol.for("message")]);
    });

    this.importPairsFilter.key("C-c", () => {
      this.importContainer.screen.destroy();
      process.exit();
    });

    this.importPairsFilter.on("submit", () =>
      this.importPairs.setItems(
        this.pairs.filter(pair =>
          pair
            .toLowerCase()
            .includes(this.importPairsFilter.value.toLowerCase())
        )
      )
    );

    this.loader = blessed.loading({
      parent: this.importContainer.screen,
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
  },

  show: async () => {
    this.importContainer.hidden = false;
    this.loader.load("Loading Pairs Available On Exchance...");
    this.importContainer.screen.render();

    try {
      this.pairs = await getPairs();
      this.importPairs.setItems(this.pairs);
      this.importPairs.items.forEach(item =>
        item.setHover(item.getText().trim())
      );
      this.loader.stop();
      this.importPairsFilter.focus();
      this.importContainer.screen.render();
    } catch (e) {
      this.importContainer.screen.destroy();
      console.log(e);
      process.exit();
    }
  },

  hide: () => {
    this.importContainer.hidden = true;
    this.importContainer.screen.render();
  }
};

module.exports = ImportPane;
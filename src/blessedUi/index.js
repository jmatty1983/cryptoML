require("dotenv-safe").config();
process.env.ENV = "blessed";
//hard coded in 3 places now .. tisk tisk
const exchange = "binance";
const dataDir = process.env.DATA_DIR;
const dbExt = process.env.DB_EXT;

const blessed = require("neo-blessed");

const ExchangeImport = require("../exchangeImporter");
const { logTransports } = require("../logger");

logTransports.on("logged", data => {
  importLog.log(data[Symbol.for("message")]);
});

const exchangeImport = Object.create(ExchangeImport);
exchangeImport.init(exchange, dataDir, dbExt);

const items = ["Import", "Process", "Ga"];
let pairs = [];

const getPairs = async () => {
  const data = await exchangeImport.getExchangeInfo();
  return data.symbols
    .sort((a, b) => {
      const field = a.quoteAsset === b.quoteAsset ? "baseAsset" : "quoteAsset";
      return a[field] > b[field] ? 1 : -1;
    })
    .map(({ baseAsset, quoteAsset }) => `${baseAsset}/${quoteAsset}`);
};

const quitBlessed = () => {
  screen.destroy();
  process.exit();
};

const screen = blessed.screen({
  smartCSR: true,
  autoPadding: true,
  cursor: {
    artificial: true,
    shape: "line",
    blink: true,
    color: null
  }
});

const container = blessed.box({
  parent: screen,
  label: " Main ",
  top: "3%",
  left: "3%",
  height: "94%",
  width: "94%",
  border: "line",
  style: {
    border: {
      fg: "blue"
    }
  }
});

const list = blessed.list({
  parent: container,
  align: "center",
  mouse: true,
  label: " Menu ",
  border: "line",
  style: {
    fg: "green",
    selected: {
      bg: "green",
      fg: "white"
    }
  },
  width: "20%",
  height: "30%",
  top: "1%",
  left: "1%",
  tags: true,
  invertSelected: false,
  items
});

list.items.forEach(item => item.setHover(item.getText().trim()));

list.on("keypress", (ch, { name }) => {
  const keyActionMap = {
    up: "up",
    k: "up",
    down: "down",
    j: "down"
  };

  if (keyActionMap[name]) {
    list[keyActionMap[name]]();
    screen.render();
  }

  if (name === "enter") {
    list.setLabel(` Menu - ${items[list.selected]} `);
    if (list.selected === 0) {
      showPairs();
    } else {
      importContainer.hidden = true;
    }
  }
});

list.focus();

const importContainer = blessed.box({
  parent: container,
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

const importPairs = blessed.list({
  parent: importContainer,
  label: " Pairs ",
  width: "20%",
  top: "60",
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

const importPairsFilter = blessed.textbox({
  parent: importContainer,
  label: " Filter ",
  width: "20%",
  height: "60",
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

const importButton = blessed.button({
  parent: importContainer,
  left: "20%",
  top: "15",
  height: "60",
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

importButton.on("click", () =>
  exchangeImport.getPair(importPairs.items[importPairs.selected].getText())
);

blessed.text({
  parent: importButton,
  height: "10",
  width: "shrink",
  content: "Import",
  left: "center",
  top: "center"
});

const importLog = blessed.log({
  parent: importContainer,
  left: "20%",
  top: "60",
  label: " Log ",
  border: "line"
});

importPairsFilter.key("C-c", quitBlessed);

importPairsFilter.on("submit", (ch, key) => {
  const text = importPairsFilter.getValue();
  importPairs.setItems(
    pairs.filter(pair =>
      pair.toLowerCase().includes(importPairsFilter.value.toLowerCase())
    )
  );
});

const showPairs = async () => {
  importContainer.hidden = false;
  loader.load("Loading Pairs Available On Exchance...");
  screen.render();

  try {
    pairs = await getPairs();
    importPairs.setItems(pairs);
    importPairs.items.forEach(item => item.setHover(item.getText().trim()));
    loader.stop();
    importPairsFilter.focus();
    screen.render();
  } catch (e) {
    console.log(e);
    quitBlessed();
  }
};

const loader = blessed.loading({
  parent: screen,
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

screen.key("C-c", quitBlessed);

screen.render();

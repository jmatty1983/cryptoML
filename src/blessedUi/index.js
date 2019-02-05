require("dotenv-safe").config();
process.env.ENV = "blessed";

const blessed = require("neo-blessed");

const ImportPane = require("./importPane");
const ProcessPane = require("./processPane");
const GaPane = require("./gaPane");
const PaperPane = require("./paperPane");

const panes = [ImportPane, ProcessPane, GaPane, PaperPane];

const items = ["Import", "Process", "Ga", "Paper Trader"];

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
    panes.forEach((pane, i) =>
      i === list.selected ? pane.show() : pane.hide()
    );
  }
});

list.focus();
panes.forEach(pane => pane.draw(container));

screen.key("C-c", quitBlessed);

screen.render();

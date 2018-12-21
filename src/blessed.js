const blessed = require("neo-blessed");

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
    fg: "blue",
    selected: {
      bg: "green"
    }
  },
  width: "20%",
  height: "30%",
  top: "2",
  left: "2",
  tags: true,
  invertSelected: false,
  items: ["Import", "Process", "Ga"],
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

list.select(0);

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
});

list.on("select", (item, select) => {
  list.setLabel(` Menu - ${item.getText()} `);
  screen.render();
});

screen.key("C-c", () => screen.destroy());

screen.render();

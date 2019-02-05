const blessed = require("neo-blessed");

const PaperPane = {
  draw: parent => {
    this.pairs = [];

    this.paperContainer = blessed.box({
      parent,
      label: " Paper Trader ",
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

    this.paperGenomes = blessed.list({
      parent: this.paperContainer,
      label: " Genomes ",
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
  },

  show: async () => {
    this.paperContainer.hidden = false;
  },

  hide: () => {
    this.paperContainer.hidden = true;
  }
};

module.exports = PaperPane;

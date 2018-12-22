const Transport = require("winston-transport");

module.exports = class EmitTransport extends Transport {
  constructor(opts) {
    super(opts);
  }

  log(info, callback) {
    setImmediate(() => this.emit("logged", info));

    callback();
  }
};

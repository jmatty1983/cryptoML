const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;
const emitTransport = require("./emitTransport");

/* istanbul ignore next */
const outputFormat = printf(
  info => `${info.timestamp} ${info.level}: ${info.message}`
);

/* istanbul ignore next */
let logTransports;
if (process.env.ENV === "blessed") {
  logTransports = new emitTransport({
    format: combine(
      timestamp({ format: "YY-MM-DD HH:mm:ss" }),
      colorize(),
      outputFormat
    )
  });
} else {
  logTransports = [
    new transports.Console({
      format: combine(
        timestamp({ format: "YY-MM-DD HH:mm:ss" }),
        colorize(),
        outputFormat
      )
    })
  ];
}

/* istanbul ignore next */
const Logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  silent: process.env.ENV === "test",
  transports: logTransports
});

module.exports = {
  Logger,
  logTransports
};

const express = require("express");
const path = require("path");
const Logger = require("../../logger");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "../dist")));

app.listen(port, () => Logger.info(`Server running on port: ${port}`));

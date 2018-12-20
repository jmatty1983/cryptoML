require("dotenv-safe").config();

const express = require("express");
const path = require("path");
const webpack = require("webpack");
const webpackConfig = require("../webpack.config");
const compiler = webpack(webpackConfig);

const api = require("./api");

const app = express();

//Middleware for hot module reloading
app.use(
  require("webpack-dev-middleware")(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  })
);
app.use(require("webpack-hot-middleware")(compiler));
app.use(express.static(path.join(__dirname, "./dist")));

app.use("/api", api);

//Base route to serve react app
app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "./dist/index.html"))
);

const server = app.listen(3000, () =>
  console.log("App listening on port 3000!")
);

//Socket connection
const io = require("socket.io").listen(server);

io.on("connection", socket => {
  socket.on("disconnect", () => console.log("Client disconnected"));
});

app.io = io;

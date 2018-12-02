const webpack = require("webpack");
const path = require("path");

const config = {
  entry: path.resolve(__dirname, "src/ui/app.js"),
  output: {
    path: path.resolve(__dirname, "src/ui/dist"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader"
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, "src/ui/dist"),
    compress: true,
    port: 9000
  }
};
console.log(config.entry);
module.exports = config;

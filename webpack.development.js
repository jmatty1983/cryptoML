const webpack = require("webpack");
const path = require("path");
module.exports = {
  entry: {
    index: [
      "webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000",
      "./ui/index.js"
    ]
  },
  output: {
    path: path.resolve(__dirname, "./ui/dist"),
    filename: "bundle.js",
    publicPath: "/"
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader"
      }
    ]
  },
  plugins: [new webpack.HotModuleReplacementPlugin()]
};

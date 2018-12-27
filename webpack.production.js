const path = require("path");
module.exports = {
  entry: {
    index: ["./ui/index.js"]
  },
  output: {
    path: path.resolve(__dirname, "./ui/dist"),
    filename: "bundle.js",
    publicPath: "/"
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader"
      }
    ]
  }
};

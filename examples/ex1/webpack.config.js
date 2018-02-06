const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './index',
  output: {
    path: path.resolve('./build'),
    filename: '[name].js'
  },

  devtool: 'cheap-module-eval-source-map',

  module: {
    noParse: /\.elm$/,
    rules: [
      {
        test: /\.elm$/,
        exclude: [/elm-stuff/, /node_modules/],
        loader: 'elm-webpack-loader',
        options: { warn: true }
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin()
  ]
}

const path = require('path');

module.exports = {
  entry: path.join(__dirname, 'src/index.ts'),
  output: {
    filename: 'web3-arkane-provider.js',
    path: path.join(__dirname, './dist'),
  },
  watch: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/,
        query: {
          declaration: false,
        },
      },
    ]
  },
  node: {
    fs: "empty"
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
};

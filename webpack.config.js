const path = require('path');

module.exports = {
  entry: path.join(__dirname, 'src/index.ts'),
  output: {
    filename: 'web3-provider.js',
    path: path.join(__dirname, './dist'),
  },
  watch: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      fs: false,
      util: false,
      buffer: false,
      stream: false,
      assert: false,
      crypto: false,
    }
  },
};

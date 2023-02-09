const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: "production",
  entry: {
    main: "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, './umd'),
    filename: "index.js",
    libraryTarget: 'umd',
    globalObject: 'this',
    library: 'VenlySubProvider',
    libraryExport: 'VenlySubProvider'
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      stream: false,
      buffer: false,
    }
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader",
        include: [
          path.resolve(__dirname, 'src')
        ]
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
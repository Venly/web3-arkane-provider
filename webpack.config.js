const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: "production",
  entry: {
    main: "./dist/index.js",
  },
  output: {
    path: path.resolve(__dirname, './umd'),
    filename: "index.js",
    libraryTarget: 'umd',
    globalObject: 'this',
    library: 'VenlyProvider',
    libraryExport: 'VenlyProvider'
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      buffer: require.resolve('buffer')
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
      Buffer: ['buffer', 'Buffer'],
    })
  ],
};
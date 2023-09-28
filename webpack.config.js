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
      assert: require.resolve('assert'),
      buffer: require.resolve('buffer'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      stream: require.resolve('stream-browserify'),
      url: require.resolve('url'),
      util: require.resolve('util'),
      zlib: require.resolve('browserify-zlib'),
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
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
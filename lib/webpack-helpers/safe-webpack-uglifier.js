'use strict';

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// TOFIX port to terser.
// This non-default Uglify madness is lifted from create-react-app:
// https://tinyurl.com/yc2zx5a4
function safeWebpackUglifier() {
  return new UglifyJsPlugin({
    sourceMap: true,
    uglifyOptions: {
      parse: {
        ecma: 8
      },
      compress: {
        ecma: 5,
        warnings: false,
        comparisons: false
      },
      mangle: {
        safari10: true
      },
      output: {
        ecma: 5,
        comments: false,
        ascii_only: true
      }
    },
    parallel: true,
    cache: true
  });
}

module.exports = safeWebpackUglifier;

'use strict';

const TerserPlugin = require('terser-webpack-plugin');

// This non-default Terser madness is lifted from create-react-app:
// https://tinyurl.com/yc2zx5a4
function safeWebpackUglifier() {
  return new TerserPlugin({
    terserOptions: {
      parse: {
        ecma: 8
      },
      compress: {
        ecma: 5,
        warnings: false,
        comparisons: false,
        inline: 2
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
    cache: true,
    sourceMap: true
  });
}

module.exports = safeWebpackUglifier;

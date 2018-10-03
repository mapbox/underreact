'use strict';

const webpack = require('webpack');
const normalizeWebpackError = require('./normalize-webpack-errors');
const createWebpackConfig = require('./create-webpack-config');

function webpackPromise(urc) {
  const webpackConfig = createWebpackConfig(urc);

  return new Promise((resolve, reject) => {
    const compiler = webpack(webpackConfig);
    compiler.run((error, stats) => {
      const normalizedError = normalizeWebpackError({
        error,
        stats
      });

      if (normalizedError) {
        reject(normalizedError);
        return;
      }

      resolve(stats);
    });
  });
}

module.exports = webpackPromise;

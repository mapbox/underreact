'use strict';

const normalizeWebpackError = require('./normalize-webpack-errors');
const createWebpackCompiler = require('./create-webpack-compiler');

function webpackRunPromise(webpackConfig) {
  return new Promise((resolve, reject) => {
    const compiler = createWebpackCompiler(webpackConfig);
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

module.exports = webpackRunPromise;

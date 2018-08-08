'use strict';

const webpack = require('webpack');
const renderWebpackErrors = require('./render-webpack-errors');

function webpackPromise(webpackConfig) {
  return new Promise((resolve, reject) => {
    const compiler = webpack(webpackConfig);
    compiler.run((error, stats) => {
      if (error) {
        reject(error);
        return;
      }

      const renderedErrors = renderWebpackErrors(stats);
      if (renderedErrors) {
        reject(new Error(renderedErrors));
        return;
      }

      resolve(stats);
    });
  });
}

module.exports = webpackPromise;

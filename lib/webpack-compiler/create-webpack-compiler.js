'use strict';

const webpack = require('webpack');

const normalizeWebpackError = require('./normalize-webpack-errors');

module.exports = function createWebpackCompiler(webpackConfig) {
  try {
    return webpack(webpackConfig);
  } catch (error) {
    throw normalizeWebpackError({ error });
  }
};

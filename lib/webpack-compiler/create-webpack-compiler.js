'use strict';

const webpack = require('webpack');

const createWebpackConfig = require('../webpack-config');
const normalizeWebpackError = require('./normalize-webpack-errors');

module.exports = function createWebpackCompiler(urc) {
  const webpackConfig = createWebpackConfig(urc);

  try {
    return webpack(webpackConfig);
  } catch (error) {
    throw normalizeWebpackError({ error });
  }
};

'use strict';

const webpack = require('webpack');

const normalizeWebpackError = require('./normalize-webpack-errors');
const createWebpackConfig = require('./create-webpack-config');

module.exports = function createWebpackCompiler(urc) {
  const webpackConfig = createWebpackConfig(urc);

  try {
    return webpack(webpackConfig);
  } catch (error) {
    throw normalizeWebpackError({ error });
  }
};

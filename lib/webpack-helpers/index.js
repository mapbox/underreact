'use strict';

const createWebpackConfig = require('./create-webpack-config');
const renderWebpackErrors = require('./render-webpack-errors');
const writeWebpackStats = require('./write-webpack-stats');
const webpackPromise = require('./webpack-promise');

module.exports = {
  createWebpackConfig,
  renderWebpackErrors,
  writeWebpackStats,
  webpackPromise
};

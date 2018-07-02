'use strict';

const webpack = require('webpack');
const del = require('del');
const chalk = require('chalk');
const createWebpackConfig = require('../lib/create-webpack-config');
const renderWebpackErrors = require('../lib/render-webpack-errors');
const startServer = require('../lib/start-server');
const publicFilesCopier = require('../lib/public-files-copier');
const htmlCompiler = require('../lib/html-compiler');
const cssCompiler = require('../lib/css-compiler');
const writeWebpackStats = require('../lib/write-webpack-stats');
const logger = require('../lib/logger');

function start(urc) {
  logger.log(`Starting underreact. ${chalk.yellow('Wait ...')}`);

  const webpackConfig = createWebpackConfig(urc);

  const onFirstCompilation = () => {
    htmlCompiler.watch(urc);
    cssCompiler.watch(urc);
    startServer(urc);
  };

  del.sync(urc.outputDirectory);

  publicFilesCopier.watch(urc, logger.error);

  const compiler = webpack(webpackConfig);
  let hasCompiled = false;
  let lastHash;
  const onCompilation = (compilationError, stats) => {
    // Don't do anything if the compilation is just repetition.
    // There's often a series of many compilations with the same output.
    if (stats.hash === lastHash) return;
    lastHash = stats.hash;

    if (!hasCompiled) {
      hasCompiled = true;
      onFirstCompilation();
    } else {
      logger.log('Compiled JS.');
    }

    if (compilationError) {
      logger.error(compilationError);
      return;
    }

    const renderedErrors = renderWebpackErrors(stats);
    if (renderedErrors) {
      logger.error(renderedErrors);
      return;
    }

    if (urc.stats) {
      writeWebpackStats(urc.stats, stats);
    }
  };

  compiler.watch({ ignored: [/node_modules/] }, onCompilation);
}

module.exports = start;

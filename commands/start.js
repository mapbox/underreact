'use strict';

const webpack = require('webpack');
const del = require('del');
const chalk = require('chalk');
const createWebpackConfig = require('../lib/create-webpack-config');
const validateConfig = require('../lib/validate-config');
const renderWebpackErrors = require('../lib/render-webpack-errors');
const startServer = require('../lib/start-server');
const publicFiles = require('../lib/public-files');
const htmlCreator = require('../lib/html-creator');
const cssCreator = require('../lib/css-creator');
const writeWebpackStats = require('../lib/write-webpack-stats');
const logger = require('../lib/chunk-light-logger');

function start(rawConfig, configDir) {
  logger.log(`Starting chunk-light. ${chalk.yellow('Wait ...')}`);

  const cl = validateConfig(rawConfig, configDir);

  const webpackConfig = createWebpackConfig(cl);

  const onFirstCompilation = () => {
    htmlCreator.write(cl);
    htmlCreator.watch(cl);
    cssCreator.write(cl).catch(handleError);
    cssCreator.watch(cl);
    startServer(cl);
  };

  del.sync(cl.outputDirectory);

  publicFiles.watch(cl, handleError);

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
      handleError(compilationError);
      return;
    }

    const renderedErrors = renderWebpackErrors(stats);
    if (renderedErrors) {
      logger.error(renderedErrors);
      return;
    }

    if (cl.stats) {
      writeWebpackStats(cl.stats, stats);
    }
  };

  compiler.watch({ ignored: [/node_modules/] }, onCompilation);
}

function handleError(error) {
  logger.error(error);
}

module.exports = start;

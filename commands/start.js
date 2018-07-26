'use strict';

const webpack = require('webpack');
const del = require('del');
const chalk = require('chalk');
const chokidar = require('chokidar');

const createWebpackConfig = require('../lib/create-webpack-config');
const renderWebpackErrors = require('../lib/render-webpack-errors');
const startServer = require('../lib/start-server');
const publicFilesCopier = require('../lib/public-files-copier');
const { writeHtml } = require('../lib/html-compiler');
const { writeCss } = require('../lib/css-compiler');
const writeWebpackStats = require('../lib/write-webpack-stats');
const autoCopy = require('../lib/packageable/auto-copy');
const logger = require('../lib/logger');

function start(urc) {
  logger.log(`Starting underreact. ${chalk.yellow('Wait ...')}`);

  const webpackConfig = createWebpackConfig(urc);

  const onFirstCompilation = () => {
    Promise.all([writeHtml(urc), writeCss(urc), publicFilesCopier(urc)])
      .then(() => {
        // HTML
        const watcherHtml = chokidar.watch(urc.htmlSource, {
          ignoreInitial: true
        });
        watcherHtml.on('all', () => {
          logger.log('Writing HTML');
          writeHtml(urc).catch(logger.error);
        });
        watcherHtml.on('error', logger.error);

        // CSS
        const watchStyleSheets = chokidar.watch(urc.stylesheets, {
          ignoreInitial: true
        });
        watchStyleSheets.on('all', () => {
          logger.log('Writing CSS');
          writeCss(urc).catch(logger.error);
        });
        watchStyleSheets.on('error', logger.error);

        // Public Dir files
        const copier = autoCopy.watch({
          sourceDir: urc.publicDirectory,
          destDir: urc.outputDirectory
        });
        copier.on('copy', filename => {
          logger.log(`Copying ${filename}`);
        });
        copier.on('delete', filename => {
          logger.log(`Deleting ${filename}`);
        });
        copier.on('error', logger.error);

        startServer(urc);
      })
      .catch(logger.error);
  };

  del.sync(urc.outputDirectory);

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

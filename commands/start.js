'use strict';

const del = require('del');
const chalk = require('chalk');
const chokidar = require('chokidar');
const webpack = require('webpack');

const startServer = require('../lib/start-server');
const { writeHtml } = require('../lib/html-compiler');
const { writeCss } = require('../lib/css-compiler');
const autoCopy = require('../lib/utils/auto-copy');
const mirrorDir = require('../lib/utils/mirror-dir');
const logger = require('../lib/logger');
const {
  createWebpackConfig,
  renderWebpackErrors,
  writeWebpackStats
} = require('../lib/webpack-helpers');

module.exports = main;

function main(urc) {
  logger.log(
    `Starting underreact in ${urc.mode} mode. ${chalk.yellow('Wait ...')}`
  );
  return (
    del(urc.outputDirectory, { force: true })
      // webpack needs to run first as others depend on the assets
      .then(() => new Promise(resolve => watchWebpack(urc, resolve)))
      .then(() => {
        Promise.all([
          writeHtml(urc),
          writeCss(urc),
          autoCopy.copy({
            sourceDir: urc.publicDirectory,
            destDir: urc.outputDirectory
          })
        ]);
      })
      .then(() => startServer(urc))
      .then(() => {
        watchCss(urc);
        watchPublicDir(urc);
      })
  );
}

function watchWebpack(urc, onFirstRun) {
  const webpackConfig = createWebpackConfig(urc);
  const compiler = webpack(webpackConfig);
  let isFirstRun = true;
  let lastHash;

  const onCompilation = (compilationError, stats) => {
    // Don't do anything if the compilation is just repetition.
    // There's often a series of many compilations with the same output.
    if (stats.hash === lastHash) return;
    lastHash = stats.hash;

    if (compilationError) {
      logger.error(compilationError);
      return;
    }

    const renderedErrors = renderWebpackErrors(stats);
    if (renderedErrors) {
      logger.error(new Error(renderedErrors));
      return;
    }

    if (isFirstRun) {
      isFirstRun = false;
      onFirstRun();
    }

    logger.log('Compiled JS.');

    if (urc.stats) {
      writeWebpackStats(urc.stats, stats);
      return;
    }
  };

  compiler.watch({ ignored: [/node_modules/] }, onCompilation);
}

function watchCss(urc) {
  const watchStyleSheets = chokidar.watch(urc.stylesheets, {
    ignoreInitial: true
  });

  watchStyleSheets.on('all', () => {
    writeCss(urc).catch(logger.error);
  });

  watchStyleSheets.on('error', logger.error);
}

function watchPublicDir(urc) {
  const watcher = mirrorDir({
    sourceDir: urc.publicDirectory,
    destDir: urc.outputDirectory
  });

  watcher.on('copy', ({ filename, commit }) => {
    logger.log(`Copying ${filename}`);
    return commit();
  });

  watcher.on('delete', ({ filename, commit }) => {
    logger.log(`Deleting ${filename}`);
    return commit();
  });
  watcher.on('error', logger.error);
}

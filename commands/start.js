'use strict';

const del = require('del');
const chalk = require('chalk');
const webpack = require('webpack');

const startServer = require('../lib/start-server');
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
  del.sync(urc.outputDirectory, { force: true });
  watchPublicDir(urc);

  return new Promise(res => watchWebpack(urc, res)).then(() => {
    return startServer(urc);
  });
}

function watchWebpack(urc, callback) {
  const webpackConfig = createWebpackConfig(urc);
  const compiler = webpack(webpackConfig);
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

    callback();

    logger.log('Compiled JS.');

    if (urc.stats) {
      writeWebpackStats(urc.stats, stats);
      return;
    }
  };

  compiler.watch({ ignored: [/node_modules/] }, onCompilation);
}

function watchPublicDir(urc) {
  autoCopy.copy({
    sourceDir: urc.publicDirectory,
    destDir: urc.outputDirectory
  });

  const watcher = mirrorDir({
    sourceDir: urc.publicDirectory,
    destDir: urc.outputDirectory
  });

  watcher.on('copy', ({ filename, commit }) => {
    logger.log(`Copying ${filename}`);
    commit();
  });

  watcher.on('delete', ({ filename, commit }) => {
    logger.log(`Deleting ${filename}`);
    commit();
  });
  watcher.on('error', logger.error);
}

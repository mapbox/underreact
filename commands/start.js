'use strict';

const del = require('del');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const autoCopy = require('../lib/utils/auto-copy');
const mirrorDir = require('../lib/utils/mirror-dir');
const logger = require('../lib/logger');
const { createWebpackConfig } = require('../lib/webpack-helpers');

module.exports = main;

function main(urc) {
  logger.log(
    `Starting underreact in ${urc.mode} mode. ${chalk.yellow('Wait ...')}`
  );
  del.sync(urc.outputDirectory, { force: true });
  watchPublicDir(urc);

  return new Promise(res => watchWebpack(urc, res));
}

function watchWebpack(urc, callback) {
  const webpackConfig = createWebpackConfig(urc);
  const compiler = webpack(webpackConfig);

  const server = new WebpackDevServer(compiler, {
    publicPath: urc.siteBasePath,
    // TOFIX implement out own webpack dev server output
    // logging to fully replace live-reload.
    clientLogLevel: 'none',
    contentBase: urc.publicDirectory,
    historyApiFallback: urc.devServerHistoryFallback && {
      index: urc.siteBasePath
    },
    port: urc.port,
    compress: urc.production
  });

  server.listen(urc.port, '127.0.0.1', () => {
    console.log('Starting server on http://localhost:8080');
    callback();
  });
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

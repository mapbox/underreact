'use strict';

const del = require('del');
const chalk = require('chalk');
const WebpackDevServer = require('webpack-dev-server');
const promisify = require('util.promisify');
const urlJoin = require('url-join');

const autoCopy = require('../lib/utils/auto-copy');
const mirrorDir = require('../lib/utils/mirror-dir');
const logger = require('../lib/logger');
const {
  createWebpackCompiler,
  normalizeWebpackError
} = require('../lib/webpack-compiler');
const webpackConfig = require('../lib/webpack-config');

module.exports = main;

function main(urc) {
  logger.log(
    `Starting underreact in ${urc.mode} mode. ${chalk.yellow('Wait ...')}`
  );

  try {
    require.resolve(urc.jsEntry);
  } catch (error) {
    throw new Error(`Could not find the entry Javascript file ${urc.jsEntry}.`);
  }

  del.sync(urc.outputDirectory, { force: true });
  watchPublicDir(urc);

  return promisify(watchWebpack)(urc);
}

function watchWebpack(urc, callback) {
  let compiler;

  try {
    compiler = createWebpackCompiler(webpackConfig(urc));
  } catch (error) {
    callback(error);
    return;
  }

  const server = new WebpackDevServer(compiler, {
    publicPath: urc.siteBasePath,
    // We have our own custom logging interface,
    // hence, we can quieten down `WebpackDevServer`.
    clientLogLevel: 'none',
    quiet: true,
    contentBase: urc.publicDirectory,
    historyApiFallback: urc.devServerHistoryFallback && {
      index: urc.siteBasePath
    },
    port: urc.port,
    compress: urc.production,
    hot: urc.hot
  });

  server.listen(urc.port, '127.0.0.1', () => {
    callback();
  });

  let isFirstCompile = true;

  // `invalid` event fires when you have changed a file, and Webpack is
  // recompiling a bundle.
  compiler.hooks.invalid.tap('invalid', () => {
    logger.log('Compiling...');
  });
  // `failed` is fired when Webpack encounters an error. For some reason
  // it is fired when `command=start`, `mode=production` and a module required
  // by user's application is not found. If we do not exit Underreact gets stuck
  // and does not respond. This might be a bug in webpack-dev-server, needs more investigation.
  compiler.hooks.failed.tap('failed', error => {
    console.error(error);
    process.exit(1);
  });
  // `done` event fires when Webpack has finished recompiling the bundle.
  // Whether or not you have warnings or errors
  compiler.hooks.done.tap('done', stats => {
    const webpackError = normalizeWebpackError({ stats });

    if (!webpackError) {
      logger.log(chalk.green('Compiled successfully!'));
      if (isFirstCompile) {
        logger.log(getReadyMessage(urc));
        isFirstCompile = false;
      }
      return;
    }

    logger.error(webpackError);
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

function getReadyMessage(urc) {
  const localUrl = urlJoin(`http://localhost:${urc.port}`, urc.siteBasePath);
  const chevron = chalk.green.bold('>');
  let startMsg = chalk.green.bold('Ready!');
  startMsg += `\n  ${chevron} Access your site at ${chalk.bold.magenta.underline(
    localUrl
  )}`;
  return startMsg;
}

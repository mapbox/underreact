'use strict';

const del = require('del');
const chalk = require('chalk');
const WebpackDevServer = require('webpack-dev-server');

const getReadyMessage = require('../lib/utils/get-ready-message');
const logger = require('../lib/logger');
const {
  createWebpackCompiler,
  normalizeWebpackError
} = require('../lib/webpack-compiler');
const webpackConfig = require('../lib/webpack-config');

module.exports = function main(urc) {
  logger.log(
    `Starting underreact in ${urc.mode} mode. ${chalk.yellow('Wait ...')}`
  );

  try {
    require.resolve(urc.jsEntry);
  } catch (error) {
    throw new Error(`Could not find the entry Javascript file ${urc.jsEntry}.`);
  }

  del.sync(urc.outputDirectory, { force: true });

  return watchWebpack(urc);
};

function watchWebpack(urc) {
  let compiler;

  try {
    compiler = createWebpackCompiler(webpackConfig(urc));
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise(resolve => {
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
      compress: urc.isProductionMode,
      hot: urc.hot
    });

    server.listen(urc.port, '127.0.0.1', () => {
      resolve();
      return;
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
  });
}

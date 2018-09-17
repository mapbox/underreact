'use strict';

const del = require('del');
const chalk = require('chalk');
const chokidar = require('chokidar');
const webpack = require('webpack');
const path = require('path');

const { WEBPACK_ASSETS_BASENAME } = require('../lib/constants');
const Assets = require('../lib/assets');
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

  return del(urc.outputDirectory, { force: true }).then(() =>
    watch(urc, () => startServer(urc))
  );
}

function watch(urc, onFirstWrite) {
  let cssOutput;
  let webpackAssets;
  let isFirst = true;
  const htmlCachedWrite = writeHtml(urc);
  const hasStylesheets = urc.stylesheets.length > 0;
  const htmlWriter = () => {
    if (isFirst) {
      onFirstWrite();
      isFirst = false;
    }
    htmlCachedWrite(
      new Assets({
        urc,
        cssOutput,
        webpackAssets
      })
    );
  };

  watchPublicDir(urc);

  if (hasStylesheets) {
    watchCss(urc, output => {
      cssOutput = output;
      if (webpackAssets) {
        htmlWriter();
      }
    });
  }

  watchWebpack(urc, output => {
    webpackAssets = output;
    if ((hasStylesheets && cssOutput) || !hasStylesheets) {
      htmlWriter();
    }
  });
}

function watchWebpack(urc, callback) {
  const webpackConfig = createWebpackConfig(urc);
  const compiler = webpack(webpackConfig);
  const webpackAssets = path.join(urc.outputDirectory, WEBPACK_ASSETS_BASENAME);
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

    callback(webpackAssets);

    logger.log('Compiled JS');

    if (urc.stats) {
      writeWebpackStats(urc.stats, stats);
      return;
    }
  };

  compiler.watch({ ignored: [/node_modules/] }, onCompilation);
}

function watchCss(urc, callback) {
  let previousPath;
  const cssHandler = () => {
    const { compilation, output } = writeCss(urc);
    compilation.catch(logger.error);
    output
      .then(path => {
        if (previousPath && previousPath !== path) {
          return Promise.all([
            del(previousPath),
            del(previousPath + '.map')
          ]).then(() => path);
        }
        return path;
      })
      .then(path => {
        previousPath = path;
        logger.log(`Writing CSS`);
        callback(path);
      });
  };

  cssHandler();

  const watchStyleSheets = chokidar.watch(urc.stylesheets, {
    ignoreInitial: true
  });

  watchStyleSheets.on('all', cssHandler);
  watchStyleSheets.on('error', logger.error);
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

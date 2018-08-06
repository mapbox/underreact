'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = process.env.BABEL_ENV || 'development';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const del = require('del');
const chalk = require('chalk');
const chokidar = require('chokidar');
const webpack = require('webpack');
const { EventEmitter } = require('events');

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
} = require('../lib/webpack');

module.exports = main;

function main(urc) {
  logger.log(`Starting underreact. ${chalk.yellow('Wait ...')}`);
  return (
    del(urc.outputDirectory, { force: true })
      // webpack needs to run first as others depend on the assets
      .then(() => watchWebpack(urc).webpackFirstRun)
      .then(() =>
        Promise.all([
          writeHtml(urc),
          writeCss(urc),
          autoCopy.copy({
            sourceDir: urc.publicDirectory,
            destDir: urc.outputDirectory
          })
        ])
      )
      .then(() => startServer(urc))
      .then(() => {
        watchHtml(urc);
        watchCss(urc);
        watchPublicDir(urc);
      })
  );
}

function watchWebpack(urc) {
  const webpackConfig = createWebpackConfig(urc);
  const watcher = webpack(webpackConfig);
  let emitter = new EventEmitter();
  let lastHash;

  const onCompilation = (compilationError, stats) => {
    // Don't do anything if the compilation is just repetition.
    // There's often a series of many compilations with the same output.
    if (stats.hash === lastHash) return;
    lastHash = stats.hash;

    // needed to resolve webpackFirstRun promise
    if (emitter) {
      emitter.emit('ready', stats);
    }

    if (compilationError) {
      logger.error(compilationError);
      return;
    }

    const renderedErrors = renderWebpackErrors(stats);
    if (renderedErrors) {
      logger.error(new Error(renderedErrors));
      return;
    }

    logger.log('Compiled JS.');

    if (urc.stats) {
      writeWebpackStats(urc.stats, stats);
      return;
    }
  };

  watcher.watch({ ignored: [/node_modules/] }, onCompilation);

  const webpackFirstRun = new Promise(resolve => {
    emitter.once('ready', stats => {
      resolve(stats);
      emitter = undefined;
    });
  });

  return {
    webpackFirstRun,
    watcher: watcher
  };
}

function watchHtml(urc) {
  const watcherHtml = chokidar.watch(urc.htmlSource, {
    ignoreInitial: true
  });

  watcherHtml.on('all', () => {
    writeHtml(urc).catch(logger.error);
  });
  watcherHtml.on('error', logger.error);

  return watcherHtml;
}

function watchCss(urc) {
  const watchStyleSheets = chokidar.watch(urc.stylesheets, {
    ignoreInitial: true
  });

  watchStyleSheets.on('all', () => {
    writeCss(urc).catch(logger.error);
  });

  watchStyleSheets.on('error', logger.error);

  return watchStyleSheets;
}

function watchPublicDir(urc) {
  const watcher = mirrorDir.watchDir({
    sourceDir: urc.publicDirectory,
    destDir: urc.outputDirectory
  });

  watcher.on('copy', filename => {
    logger.log(`Copying ${filename}`);
    return mirrorDir.copyFile({
      filename,
      sourceDir: urc.publicDirectory,
      destDir: urc.outputDirectory
    });
  });

  watcher.on('delete', filename => {
    logger.log(`Deleting ${filename}`);
    return mirrorDir.delFile({
      filename,
      destDir: urc.outputDirectory
    });
  });
  watcher.on('error', logger.error);

  return watcher;
}

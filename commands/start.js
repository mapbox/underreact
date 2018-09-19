'use strict';

const del = require('del');
const chalk = require('chalk');
const chokidar = require('chokidar');
const webpack = require('webpack');
const path = require('path');

const startServer = require('../lib/start-server');
const Assets = require('../lib/assets');
const { WEBPACK_ASSETS_BASENAME, CSS_BASENAME } = require('../lib/constants');
const { htmlCompiler } = require('../lib/html-compiler');
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
  const writeHtml = htmlCompiler(urc);
  const webpackAssets = path.join(urc.outputDirectory, WEBPACK_ASSETS_BASENAME);
  let isWebpackFirstCompile = true;
  let lastCssOutput;

  del.sync(urc.outputDirectory, { force: true });

  const onWrite = cssOutput => {
    if (isWebpackFirstCompile) {
      isWebpackFirstCompile = false;
      // Note: We can run `watchCss` independent  of webpack compile, but that would
      // unnecessarily complicate code and wouldn't provide any appreciable
      // performance gain.
      watchCss(urc, output => onWrite(output));
      startServer(urc);
      return;
    }

    if (cssOutput) {
      lastCssOutput = cssOutput;
    }

    // If cssOutput is undefined, it can mean either of the two things:
    // 1. The callback is coming from `watchWebpack`.
    // 2. The callback is coming from `watchCss`, but the user did not
    //    provide any stylesheets in their Underreact configuration.
    // In either of the above case it is safe to use `lastCssOutput`.
    writeHtml(
      new Assets({
        urc,
        webpackAssets,
        cssOutput: lastCssOutput
      })
    );
  };

  watchPublicDir(urc);
  watchWebpack(urc, () => onWrite());
}

function watchWebpack(urc, callback) {
  const webpackAssets = path.join(urc.outputDirectory, WEBPACK_ASSETS_BASENAME);
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

    callback(webpackAssets);

    logger.log('Compiled JS.');

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
    const compilation = writeCss(urc);

    // Optimization: we do not need to await the compilation result
    // in development mode, since the output path of css is always static.
    if (!urc.production) {
      callback(
        path.join(urc.outputDirectory, urc.publicAssetsPath, CSS_BASENAME)
      );
    }

    compilation
      .then(path => {
        // This clears any previously generated css files.
        if (previousPath && previousPath !== path) {
          return del([previousPath, previousPath + '.map']).then(() => path);
        }
        return path;
      })
      .then(path => {
        previousPath = path;
        logger.log(`Compiled CSS`);
        // Since it would already by called in development mode
        if (urc.production) {
          callback(path);
        }
      })
      .catch(logger.error);
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

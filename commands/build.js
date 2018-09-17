'use strict';

const path = require('path');
const del = require('del');
const chalk = require('chalk');

const Assets = require('../lib/assets');
const logger = require('../lib/logger');
const autoCopy = require('../lib/utils/auto-copy');
const { WEBPACK_ASSETS_BASENAME } = require('../lib/constants');
const { writeHtml } = require('../lib/html-compiler');
const { writeCss } = require('../lib/css-compiler');
const {
  createWebpackConfig,
  webpackPromise,
  writeWebpackStats
} = require('../lib/webpack-helpers');

function build(urc) {
  logger.log(`Building your site in ${urc.mode} mode...`);
  const webpackConfig = createWebpackConfig(urc);
  // force is needed to get test fixtures passing
  return (
    del(urc.outputDirectory, { force: true })
      .then(() => {
        const webpack = webpackPromise(webpackConfig).then(stats => {
          if (urc.stats) {
            logger.log('Writing Webpack statistics ..');
            return writeWebpackStats(urc.stats, stats);
          }
        });
        const css = writeCss(urc).compilation;
        const copy = autoCopy.copy({
          sourceDir: urc.publicDirectory,
          destDir: urc.outputDirectory
        });

        return Promise.all([css, webpack, copy]);
      })

      .then(([cssOutput]) =>
        writeHtml(urc)(
          new Assets({
            urc,
            cssOutput: cssOutput,
            webpackAssets: path.join(
              urc.outputDirectory,
              WEBPACK_ASSETS_BASENAME
            )
          })
        )
      )
      // Clean up files you won't need to deploy.
      .then(() =>
        del(path.join(urc.outputDirectory, WEBPACK_ASSETS_BASENAME), {
          force: true
        })
      )
      .then(() => {
        logger.log(chalk.green.bold('Finished building your site.'));
        return true;
      })
      .catch(logger.error)
  );
}

module.exports = build;

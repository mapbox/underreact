'use strict';

const path = require('path');
const del = require('del');
const chalk = require('chalk');

const logger = require('../lib/logger');
const autoCopy = require('../lib/utils/auto-copy');
const { writeHtml } = require('../lib/html-compiler');
const { writeCss } = require('../lib/css-compiler');
const {
  createWebpackConfig,
  webpackPromise,
  writeWebpackStats
} = require('../lib/webpack-helpers');

function build(urc) {
  logger.log(`Building your site in ${urc.mode} mode ...`);

  const webpackConfig = createWebpackConfig(urc);
  // force is needed to get test fixtures passing
  return (
    del(urc.outputDirectory, { force: true })
      .then(() => webpackPromise(webpackConfig))
      .then(stats => {
        if (urc.stats) {
          return writeWebpackStats(urc.stats, stats);
        }
      })
      .then(() => writeCss(urc))
      .then(cssFilename => writeHtml(urc, cssFilename))
      .then(() =>
        autoCopy.copy({
          sourceDir: urc.publicDirectory,
          destDir: urc.outputDirectory
        })
      )
      // Clean up files you won't need to deploy.
      .then(() =>
        del(path.join(urc.outputDirectory, 'assets.json'), { force: true })
      )
      .then(() => {
        logger.log(chalk.green.bold('Finished building your site.'));
        return true;
      })
      .catch(logger.error)
  );
}

module.exports = build;

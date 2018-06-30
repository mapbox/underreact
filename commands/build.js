'use strict';

const path = require('path');
const del = require('del');
const chalk = require('chalk');
const createWebpackConfig = require('../lib/create-webpack-config');
const logger = require('../lib/chunk-light-logger');
const publicFiles = require('../lib/public-files');
const htmlCreator = require('../lib/html-creator');
const cssCreator = require('../lib/css-creator');
const writeWebpackStats = require('../lib/write-webpack-stats');
const webpackPromise = require('../lib/webpack-promise');

function build(cl) {
  logger.log('Building your site ...');

  del.sync(cl.outputDirectory);

  const webpackConfig = createWebpackConfig(cl);

  return webpackPromise(webpackConfig)
    .then(stats => {
      if (cl.stats) {
        writeWebpackStats(cl.stats, stats);
      }
    })
    .then(() => cssCreator.write(cl))
    .then(cssFilename => htmlCreator.write(cl, cssFilename))
    .then(() => publicFiles.copy(cl))
    .then(() => {
      // Clean up files you won't need to deploy.
      del.sync(path.join(cl.outputDirectory, 'assets.json'));
    })
    .then(() => {
      logger.log(chalk.green.bold('Finished building your site.'));
    });
}

module.exports = build;

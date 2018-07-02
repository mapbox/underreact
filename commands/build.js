'use strict';

const path = require('path');
const del = require('del');
const chalk = require('chalk');
const createWebpackConfig = require('../lib/create-webpack-config');
const logger = require('../lib/logger');
const publicFilesCopier = require('../lib/public-files-copier');
const htmlCompiler = require('../lib/html-compiler');
const cssCompiler = require('../lib/css-compiler');
const writeWebpackStats = require('../lib/write-webpack-stats');
const webpackPromise = require('../lib/webpack-promise');

function build(urc) {
  logger.log('Building your site ...');

  del.sync(urc.outputDirectory);

  const webpackConfig = createWebpackConfig(urc);

  return webpackPromise(webpackConfig)
    .then(stats => {
      if (urc.stats) {
        writeWebpackStats(urc.stats, stats);
      }
    })
    .then(() => cssCompiler.write(urc))
    .then(cssFilename => htmlCompiler.write(urc, cssFilename))
    .then(() => publicFilesCopier.copy(urc))
    .then(() => {
      // Clean up files you won't need to deploy.
      del.sync(path.join(urc.outputDirectory, 'assets.json'));
    })
    .then(() => {
      logger.log(chalk.green.bold('Finished building your site.'));
    })
    .catch(logger.error);
}

module.exports = build;

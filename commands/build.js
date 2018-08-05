'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = process.env.BABEL_ENV || 'production';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const path = require('path');
const del = require('del');
const chalk = require('chalk');

const createWebpackConfig = require('../lib/create-webpack-config');
const logger = require('../lib/logger');
const autoCopy = require('../lib/utils/auto-copy');
const { writeHtml } = require('../lib/html-compiler');
const { writeCss } = require('../lib/css-compiler');
const writeWebpackStats = require('../lib/write-webpack-stats');
const webpackPromise = require('../lib/webpack-promise');

function build(urc) {
  logger.log('Building your site ...');

  const webpackConfig = createWebpackConfig(urc);

  // force is needed to get test fixtures passing
  return (
    del(urc.outputDirectory, { force: true })
      .then(() => webpackPromise(webpackConfig))
      .then(stats => {
        if (urc.stats) {
          writeWebpackStats(urc.stats, stats);
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

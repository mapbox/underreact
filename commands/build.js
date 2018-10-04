'use strict';

const path = require('path');
const del = require('del');
const chalk = require('chalk');

const logger = require('../lib/logger');
const autoCopy = require('../lib/utils/auto-copy');
const { WEBPACK_ASSETS_BASENAME } = require('../lib/constants');
const {
  webpackRunPromise,
  writeWebpackStats
} = require('../lib/webpack-compiler');
const webpackConfig = require('../lib/webpack-config');

function build(urc) {
  logger.log(`Building your site in ${urc.mode} mode...`);

  try {
    require.resolve(urc.jsEntry);
  } catch (error) {
    throw new Error(`Could not find the entry Javascript file ${urc.jsEntry}.`);
  }

  // force is needed to get test fixtures passing
  return (
    del(urc.outputDirectory, { force: true })
      .then(() => {
        const webpack = webpackRunPromise(webpackConfig(urc)).then(stats => {
          if (urc.stats) {
            logger.log('Writing Webpack statistics ..');
            return writeWebpackStats(urc.stats, stats);
          }
        });
        const copy = autoCopy.copy({
          sourceDir: urc.publicDirectory,
          destDir: urc.outputDirectory
        });

        return Promise.all([copy, webpack]);
      })
      // Clean up files you won't need to deploy.
      .then(() =>
        del(path.join(urc.outputDirectory, WEBPACK_ASSETS_BASENAME), {
          force: true
        })
      )
      .then(() => {
        logger.log(chalk.green.bold('Finished building your site.'));
      })
  );
}

module.exports = build;

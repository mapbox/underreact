'use strict';

const webpack = require('webpack');
const path = require('path');
const del = require('del');
const chalk = require('chalk');
const createWebpackConfig = require('../lib/create-webpack-config');
const validateConfig = require('../lib/validate-config');
const renderWebpackErrors = require('../lib/render-webpack-errors');
const logger = require('../lib/chunk-light-logger');
const publicFiles = require('../lib/public-files');
const htmlCreator = require('../lib/html-creator');
const writeWebpackStats = require('../lib/write-webpack-stats');

function build(rawConfig, configDir) {
  logger.log('Building your site ...');

  const cl = validateConfig(rawConfig, configDir);

  del.sync(cl.outputDirectory);

  const webpackConfig = createWebpackConfig(cl);
  const runWebpack = () => {
    return new Promise((resolve, reject) => {
      const compiler = webpack(webpackConfig);
      compiler.run((error, stats) => {
        if (error) {
          reject(error);
          return;
        }

        const renderedErrors = renderWebpackErrors(stats);
        if (renderedErrors) {
          reject(new Error(renderedErrors));
          return;
        }

        if (cl.stats) {
          writeWebpackStats(cl.stats, stats);
        }

        resolve(stats);
      });
    });
  };

  return runWebpack()
    .then(() => htmlCreator.write(cl))
    .then(() => publicFiles.copy(cl))
    .then(() => {
      del.sync(path.join(cl.outputDirectory, '?(m-)assets.json'));
    })
    .then(() => {
      logger.log(chalk.green.bold('Finished building your site.'));
    });
}

module.exports = build;

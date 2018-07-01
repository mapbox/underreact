'use strict';

const path = require('path');
const resolvePkg = require('resolve-pkg');
const webpackPromise = require('../lib/webpack-promise');
const logger = require('../lib/chunk-light-logger');

function vendor(output, packageNames) {
  const entry = packageNames.reduce((memo, packageName) => {
    memo[packageName] = resolvePkg(packageName);
    return memo;
  }, {});

  const webpackConfig = {
    entry,
    output: {
      filename: '[name].js',
      library: '[name]',
      libraryTarget: 'commonjs2',
      path: path.resolve(process.cwd(), output)
    },
    optimization: {
      minimize: false
    }
  };

  return webpackPromise(webpackConfig).catch(logger.error);
}

module.exports = vendor;

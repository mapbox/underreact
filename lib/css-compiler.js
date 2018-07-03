'use strict';

const path = require('path');
const autoprefixer = require('autoprefixer');
const chokidar = require('chokidar');
const postcssConcatenator = require('./packageable/postcss-concatenator');
const logger = require('./logger');
const { CSS_BASENAME } = require('./constants');

function writeCss(urc) {
  if (urc.stylesheets.length === 0) {
    return Promise.resolve();
  }

  logger.log('Writing CSS');
  return postcssConcatenator({
    plugins: [
      autoprefixer({ browsers: urc.browserslist }),
      ...urc.postcssPlugins
    ],
    stylesheets: urc.stylesheets,
    output: path.join(urc.outputDirectory, urc.publicAssetsPath, CSS_BASENAME),
    hash: urc.production
  });
}

function watchCss(urc) {
  if (urc.stylesheets.length === 0) {
    return;
  }

  const rewriteCss = () => {
    writeCss(urc).catch(logger.error);
  };

  const watcher = chokidar.watch(urc.stylesheets, {
    ignoreInitial: true
  });
  watcher.on('change', rewriteCss);
  watcher.on('unlink', rewriteCss);
  watcher.on('add', rewriteCss);
  watcher.on('error', logger.error);
}

module.exports = {
  write: writeCss,
  watch: watchCss
};

'use strict';

const path = require('path');
const autoprefixer = require('autoprefixer');
const postcssUrl = require('postcss-url');
const postcssCsso = require('postcss-csso');
const chokidar = require('chokidar');
const postcssConcatenator = require('./postcss-concatenator');
const logger = require('./logger');
const { CSS_BASENAME } = require('./constants');

function writeCss(urc) {
  if (urc.stylesheets.length === 0) {
    return Promise.resolve();
  }

  logger.log('Writing CSS');

  const plugins = [
    // Copy all url-referenced assets to the same place as the CSS.
    postcssUrl({
      url: 'copy',
      assetsPath: './',
      useHash: true,
      hashOptions: {
        append: true
      }
    }),
    autoprefixer({ browsers: urc.browserslist }),
    ...urc.postcssPlugins,
    urc.production && postcssCsso()
  ].filter(Boolean);

  return postcssConcatenator({
    plugins,
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

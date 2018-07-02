'use strict';

const path = require('path');
const autoprefixer = require('autoprefixer');
const postcssUrl = require('postcss-url');
const postcssCsso = require('postcss-csso');
const chokidar = require('chokidar');
const postcssConcatenator = require('./postcss-concatenator');
const logger = require('./logger');
const { CSS_BASENAME } = require('./constants');

function writeCss(cl) {
  if (cl.stylesheets.length === 0) {
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
    autoprefixer({ browsers: cl.browserslist }),
    ...cl.postcssPlugins,
    cl.production && postcssCsso()
  ].filter(Boolean);

  return postcssConcatenator({
    plugins,
    stylesheets: cl.stylesheets,
    output: path.join(cl.outputDirectory, cl.publicAssetsPath, CSS_BASENAME),
    hash: cl.production
  });
}

function watchCss(cl) {
  if (cl.stylesheets.length === 0) {
    return;
  }

  const rewriteCss = () => {
    writeCss(cl).catch(logger.error);
  };

  const watcher = chokidar.watch(cl.stylesheets);
  watcher.on('change', rewriteCss);
  watcher.on('unlink', rewriteCss);
  watcher.on('add', rewriteCss);
  watcher.on('error', logger.error);
}

module.exports = {
  write: writeCss,
  watch: watchCss
};

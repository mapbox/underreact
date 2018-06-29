'use strict';

const path = require('path');
const autoprefixer = require('autoprefixer');
const postcssUrl = require('postcss-url');
const postcssCsso = require('postcss-csso');
const chokidar = require('chokidar');
const postcssConcatenator = require('./postcss-concatenator');
const logger = require('./chunk-light-logger');

function writeCss(cl) {
  if (cl.stylesheets.length === 0) {
    return Promise.resolve();
  }

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
    ...cl.postcssPlugins
  ];

  if (cl.production) {
    plugins.push(postcssCsso());
  }

  return postcssConcatenator({
    plugins,
    stylesheets: cl.stylesheets,
    output: path.join(
      cl.outputDirectory,
      cl.publicAssetsPath,
      'chunk-light-styles.css'
    ),
    hash: cl.production
  });
}

function watchCss(cl) {
  if (cl.stylesheets.length === 0) {
    return;
  }

  const watcher = chokidar.watch(cl.stylesheets);
  watcher.on('change', () => {
    writeCss(cl).catch(error => {
      logger.log(error.stack);
    });
  });
}

module.exports = {
  write: writeCss,
  watch: watchCss
};

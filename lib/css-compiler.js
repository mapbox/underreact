'use strict';

const path = require('path');
const autoprefixer = require('autoprefixer');

const postcssConcatenator = require('../packages/postcss-concatenator');
const { CSS_BASENAME } = require('./constants');

module.exports = {
  writeCss
};

function writeCss(urc) {
  if (urc.stylesheets.length === 0) {
    return Promise.resolve();
  }

  return postcssConcatenator({
    plugins: [
      autoprefixer({ browsers: urc.browserslist }), // TOFIX browserslist
      ...urc.postcssPlugins
    ],
    stylesheets: urc.stylesheets,
    output: path.join(urc.outputDirectory, urc.publicAssetsPath, CSS_BASENAME),
    hash: urc.production
  });
}

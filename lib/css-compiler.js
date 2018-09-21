'use strict';
const autoprefixer = require('autoprefixer');
const path = require('path');

const { concatToFile } = require('../packages/postcss-concatenator');
const { CSS_BASENAME } = require('./constants');

module.exports = {
  writeCss
};

// Returns a promise which resolves to the output path of css
function writeCss(urc) {
  const mainStylesheet =
    urc.stylesheets.length > 0
      ? path.join(urc.outputDirectory, urc.publicAssetsPath, CSS_BASENAME)
      : undefined;

  if (!mainStylesheet) {
    return { output: Promise.resolve(), compilation: Promise.resolve() };
  }

  return concatToFile({
    plugins: [
      autoprefixer({ browsers: urc.getBrowserslist() }),
      ...urc.postcssPlugins
    ],
    stylesheets: urc.stylesheets,
    output: mainStylesheet,
    hash: urc.production,
    sourceMap: urc.production ? 'file' : 'inline'
  });
}

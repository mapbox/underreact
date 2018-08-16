'use strict';

const path = require('path');
const autoprefixer = require('autoprefixer');

const { concatToFile } = require('../packages/postcss-concatenator');
const { CSS_BASENAME } = require('./constants');

module.exports = {
  writeCss
};

function writeCss(urc) {
  if (urc.stylesheets.length === 0) {
    return Promise.resolve();
  }

  const output = path.join(
    urc.outputDirectory,
    urc.publicAssetsPath,
    CSS_BASENAME
  );
  return concatToFile({
    plugins: [
      autoprefixer({ browsers: urc.getBrowserslist() }),
      ...urc.postcssPlugins
    ],
    stylesheets: urc.stylesheets,
    output,
    hash: urc.production,
    sourceMap: urc.production ? 'file' : 'inline'
  }).then(() => output);
}

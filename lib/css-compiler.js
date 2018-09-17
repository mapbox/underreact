'use strict';
const autoprefixer = require('autoprefixer');
const path = require('path');

const { concatToFile } = require('../packages/postcss-concatenator');
const { CSS_BASENAME } = require('./constants');

module.exports = {
  writeCss
};

/**
 * @returns {Object} result
 *    {Promise<string>} result.output - A promise which resolves to path of the output css file.
 *    {Promise<string>} result.compilation - A promise which resolves when css is written to disk.
 */
function writeCss(urc) {
  const mainStylesheet =
    urc.stylesheets.length > 0
      ? path.join(urc.outputDirectory, urc.publicAssetsPath, CSS_BASENAME)
      : undefined;

  if (!mainStylesheet) {
    return { output: Promise.resolve(), compilation: Promise.resolve() };
  }

  const compilation = concatToFile({
    plugins: [
      autoprefixer({ browsers: urc.getBrowserslist() }),
      ...urc.postcssPlugins
    ],
    stylesheets: urc.stylesheets,
    output: mainStylesheet,
    hash: urc.production,
    sourceMap: urc.production ? 'file' : 'inline'
  });

  // in case of production, css is hashed and
  // this hashed path can only be known once compilation is complete
  if (urc.production) {
    return {
      output: compilation, // compilation promise resolves to the hashed output path of css
      compilation
    };
  }

  // In case of development, we already know the final path of the output
  // and don't need to block any process.
  return {
    output: Promise.resolve(mainStylesheet),
    compilation
  };
}

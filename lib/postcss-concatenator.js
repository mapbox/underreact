'use strict';

const fs = require('fs');
const pify = require('pify');
const Concat = require('concat-with-sourcemaps');
const postcss = require('postcss');
const revHash = require('rev-hash');
const path = require('path');

// This could be extracted out into an independent library,

/**
 * @param {Object} config
 * @param {Array<string>} config.stylesheets
 * @param {string} config.output
 * @param {Array<Function>} [config.plugins]
 * @param {boolean} [config.hash=false]
 * @returns {Promise<void>}
 */
function postcssConcatenator({
  stylesheets,
  output,
  plugins = [],
  hash = false
}) {
  const processSingleStylesheet = filename => {
    return pify(fs.readFile)(filename, 'utf8')
      .then(content => {
        return postcss(plugins)
          .process(content, {
            from: filename,
            to: output,
            map: {
              inline: false,
              sourcesContent: true,
              annotation: false
            }
          })
          .catch(rethrowPostcssError);
      })
      .then(result => {
        return {
          filename,
          css: result.css,
          map: result.map.toString()
        };
      });
  };

  const processAllStylesheets = () => {
    // Ensure the stylesheets are concatenated in the order specified.
    // Each item will be an object with filename, css, and map properties.
    // After all are accumulated, we'll concatenate them together in that order.
    const stylesheetData = [];
    const promises = stylesheets.map((filename, index) => {
      return processSingleStylesheet(filename).then(item => {
        stylesheetData[index] = item;
      });
    });
    return Promise.all(promises).then(() => stylesheetData);
  };

  // Runs after stylesheetContents has been populated. Concatenates the CSS
  // in that order, with source maps. Outputs new CSS and and a new source map.
  const concatStylesheetContents = stylesheetData => {
    const concatenator = new Concat(true, output, '\n');
    stylesheetData.forEach(item => {
      concatenator.add(item.filename, item.css, item.map);
    });
    return {
      css: concatenator.content,
      map: concatenator.sourceMap
    };
  };

  const writeFiles = ({ css, map }) => {
    let outputBasename = path.basename(output);
    if (hash) {
      const fileHash = revHash(css);
      outputBasename = outputBasename.replace(/\.css$/, `-${fileHash}.css`);
    }
    const outputWithHash = path.join(path.dirname(output), outputBasename);
    const cssWithSourcemapAnnotation = `${css}/*# sourceMappingURL=${outputBasename}.map */`;
    const sourceMapFilename = path.join(
      path.dirname(output),
      `${outputBasename}.map`
    );
    return Promise.all([
      pify(fs.writeFile)(outputWithHash, cssWithSourcemapAnnotation),
      pify(fs.writeFile)(sourceMapFilename, map)
    ]).then(() => outputWithHash);
  };

  return processAllStylesheets()
    .then(concatStylesheetContents)
    .then(writeFiles);
}

function rethrowPostcssError(error) {
  error.message = `PostCSS error: ${error.message}`;
  if (error.name === 'CssSyntaxError') {
    error.message = error.message + '\n' + error.showSourceCode();
  }
  throw error;
}

module.exports = postcssConcatenator;

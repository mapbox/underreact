'use strict';
const path = require('path');
const sourceMappingURL = require('source-map-url');

module.exports = function generateHtmlTemplate({
  urc,
  webpackCompilation,
  publicPath
}) {
  return Promise.resolve(
    // TOFIX: We need to make sure the urc.htmlSource returns a valid html
    urc.htmlSource
  ).then(html =>
    html
      .replace(
        '<head>',
        `<head>${getConditionalPolyfill({
          webpackCompilation,
          urc,
          publicPath
        })}`
      )
      .replace(
        '</head>',
        `${getInlinedRuntime({
          webpackCompilation,
          publicPath
        })}</head>`
      )
  );
};

// Returns a script which conditionally loads the `polyfill.js` file
// if and only if the browser fails the `urc.modernBrowserTest`.
function getConditionalPolyfill({ webpackCompilation, urc, publicPath }) {
  if (!urc.polyfill) {
    return '';
  }
  const polyfillSrc = path.join(
    publicPath,
    getAssetFilename(webpackCompilation.chunks, 'polyfill')
  );
  return `<script>
    var modernBrowser = (
      ${urc.modernBrowserTest}
    );
    if ( !modernBrowser ) {
      var scriptElement = document.createElement('script');
      scriptElement.async = false;
      scriptElement.src = '${polyfillSrc}';
      document.head.appendChild(scriptElement);
    }</script>`;
}

function getInlinedRuntime({ webpackCompilation }) {
  const runtimeFilename = getAssetFilename(
    webpackCompilation.chunks,
    'runtime'
  );
  return `<script>${sourceMappingURL.removeFrom(
    webpackCompilation.assets[runtimeFilename].source()
  )}</script>`;
}

function getAssetFilename(chunks, chunkName) {
  for (const chunk of chunks) {
    if (chunk.name === chunkName) {
      return chunk.files[0];
    }
  }
}

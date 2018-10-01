'use strict';
const path = require('path');
const sourceMappingURL = require('source-map-url');

module.exports = { inlineRuntime, addConditionalPolyfill, generateTemplate };

function generateTemplate({ urc, webpackCompilation, publicPath }) {
  return Promise.resolve(
    urc.htmlSource({
      polyfillScript: () => '',
      renderJsBundles: () => '',
      renderCssLinks: () => ''
    })
  ).then(html =>
    html
      .replace(
        '<head>',
        `<head>${addConditionalPolyfill({
          webpackCompilation,
          urc,
          publicPath
        })}`
      )
      .replace(
        '<body>',
        `<body>${inlineRuntime({
          webpackCompilation,
          publicPath
        })}`
      )
  );
}

function inlineRuntime({ webpackCompilation }) {
  const runtimeFilename = getAssetFilename(
    webpackCompilation.chunks,
    'runtime'
  );
  return `<script>${sourceMappingURL.removeFrom(
    webpackCompilation.assets[runtimeFilename].source()
  )}</script>`;
}

// Inlines a conditional loading script to be put at the top of head.
function addConditionalPolyfill({ webpackCompilation, urc, publicPath }) {
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

function getAssetFilename(chunks, chunkName) {
  for (const chunk of chunks) {
    if (chunk.name === chunkName) {
      return chunk.files[0];
    }
  }
}

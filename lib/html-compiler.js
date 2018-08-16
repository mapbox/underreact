'use strict';

const fs = require('fs');
const path = require('path');
const UglifyJs = require('uglify-js');
const urlJoin = require('url-join');
const promisify = require('util.promisify');

const { CSS_BASENAME } = require('./constants');

module.exports = { renderHtml, writeHtml };

function renderHtml(urc, cssFilename) {
  const assets = urc.getAssets();
  // Inline the runtime JS because it's super small.
  const uglifiedRuntime = uglifyRuntime(urc, assets);

  const bundledScripts = [
    `<script>${uglifiedRuntime}</script>`,
    `<script src="${assets.main.js}"></script>`
  ];

  // handles edge case when user doesn't import any module
  if (assets.vendor && assets.vendor.js) {
    bundledScripts.push(`<script src="${assets.vendor.js}"></script>`);
  }

  const renderJsBundles = () => {
    return bundledScripts.join('\n');
  };

  const cssAssets = [].concat(assets.main.css).filter(x => !!x);

  if (cssFilename) {
    cssAssets.push(
      urlJoin(
        ...path.relative(urc.outputDirectory, cssFilename).split(path.sep)
      )
    );
  } else if (urc.stylesheets.length !== 0 && !urc.production) {
    cssAssets.push(
      urlJoin(urc.siteBasePath, urc.publicAssetsPath, CSS_BASENAME)
    );
  }
  const cssLinks = cssAssets.map(assetPath => {
    return `<link rel="stylesheet" href="${assetPath}">`;
  });

  const renderCssLinks = () => {
    return cssLinks.join('\n');
  };

  const polyfillScript = () =>
    urc.polyfill
      ? `<script>
      var modernBrowser = (
        ${urc.modernBrowserTest}
      );
      if ( !modernBrowser ) {
        var scriptElement = document.createElement('script');
        scriptElement.async = false;
        scriptElement.src = '${assets.polyfill.js}';
        document.head.appendChild(scriptElement);
      }
    </script>`
      : '';

  return Promise.resolve(
    htmlFn({
      polyfillScript,
      renderJsBundles,
      renderCssLinks
    })
  );
}

function uglifyRuntime(urc) {
  const runtime = urc.getRuntimeJs();
  const uglifyResult = UglifyJs.minify(runtime);
  if (uglifyResult.error) throw uglifyResult.error;
  return uglifyResult.code;
}

function writeHtml(urc, cssFilename) {
  return renderHtml(urc, cssFilename).then(html =>
    promisify(fs.writeFile)(path.join(urc.outputDirectory, 'index.html'), html)
  );
}

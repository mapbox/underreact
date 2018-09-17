'use strict';

const fs = require('fs');
const path = require('path');
const UglifyJs = require('uglify-js');
const promisify = require('util.promisify');

const writeFile = promisify(fs.writeFile);

module.exports = { writeHtml, polyfill, jsBundles, cssLinks };

function writeHtml(urc) {
  let prevHtml;
  return assets =>
    Promise.resolve(
      urc.htmlSource({
        polyfillScript: polyfill(urc, assets),
        renderJsBundles: jsBundles(assets),
        renderCssLinks: cssLinks(assets)
      })
    ).then(html => {
      if (prevHtml && html === prevHtml) {
        return;
      }
      return writeFile(path.join(urc.outputDirectory, 'index.html'), html).then(
        () => {
          prevHtml = html;
        }
      );
    });
}

function jsBundles(assets) {
  // Inline the runtime JS because it's super small.
  const uglifiedRuntime = uglifyRuntime(assets);
  return () => {
    const bundledScripts = [
      `<script>${uglifiedRuntime}</script>`,
      `<script src="${assets.webpack.main.js}"></script>`
    ];
    // handles edge case when user doesn't import any module
    if (assets.webpack.vendor && assets.webpack.vendor.js) {
      bundledScripts.push(
        `<script src="${assets.webpack.vendor.js}"></script>`
      );
    }

    return bundledScripts.join('\n');
  };
}

function cssLinks(assets) {
  return () =>
    assets.css
      .map(assetPath => `<link rel="stylesheet" href="${assetPath}">`)
      .join('\n');
}

function polyfill(urc, assets) {
  return () =>
    assets.webpack.polyfill
      ? `<script>
      var modernBrowser = (
        ${urc.modernBrowserTest}
      );
      if ( !modernBrowser ) {
        var scriptElement = document.createElement('script');
        scriptElement.async = false;
        scriptElement.src = '${assets.webpack.polyfill.js}';
        document.head.appendChild(scriptElement);
      }
    </script>`
      : '';
}

function uglifyRuntime(assets) {
  const path = assets.relativeUrlToAbsolutePath(assets.webpack.runtime.js);
  const uglifyResult = UglifyJs.minify(fs.readFileSync(path, 'utf8'));

  if (uglifyResult.error) throw uglifyResult.error;

  return uglifyResult.code;
}

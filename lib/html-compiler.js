'use strict';

const fs = require('fs');
const path = require('path');
const UglifyJs = require('uglify-js');
const promisify = require('util.promisify');

const writeFile = promisify(fs.writeFile);

module.exports = { htmlCompiler, polyfill, jsBundles, cssLinks };

function htmlCompiler(urc) {
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
    // Handles the edge edge case when there are no vendor modules.
    // This could happen if the user doesn't use any node modules.
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
  return () => {
    if (!assets.webpack.polyfill) {
      return '';
    }
    return `<script>
      var modernBrowser = (
        ${urc.modernBrowserTest}
      );
      if ( !modernBrowser ) {
        var scriptElement = document.createElement('script');
        scriptElement.async = false;
        scriptElement.src = '${assets.webpack.polyfill.js}';
        document.head.appendChild(scriptElement);
      }
    </script>`;
  };
}

function uglifyRuntime(assets) {
  const path = assets.relativeUrlToAbsolutePath(assets.webpack.runtime.js);
  const uglifyResult = UglifyJs.minify(fs.readFileSync(path, 'utf8'));

  if (uglifyResult.error) throw uglifyResult.error;

  return uglifyResult.code;
}

'use strict';

const fs = require('fs');
const path = require('path');
const UglifyJs = require('uglify-js');
const urlJoin = require('url-join');
const pify = require('pify');

const { CSS_BASENAME } = require('./constants');

function renderHtml(urc, cssFilename) {
  const assets = urc.getAssets();
  // Inline the runtime JS because it's super small.
  const uglifiedRuntime = uglifyRuntime(urc, assets);

  const bundledScripts = [
    `<script>${uglifiedRuntime}</script>`,
    `<script src="${assets.vendor.js}"></script>`,
    `<script src="${assets.main.js}"></script>`
  ];

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

  const htmlFn = urc.getHtmlSourceFn();

  return Promise.resolve(
    htmlFn({
      renderJsBundles,
      renderCssLinks,
      siteBasePath: urc.siteBasePath,
      publicAssetsPath: urc.publicAssetsPath,
      production: urc.production
    })
  );
}

function uglifyRuntime(urc, assets) {
  const absoluteRuntimePath = path.join(
    urc.outputDirectory,
    assets.runtime.js.replace(new RegExp(`^${urc.siteBasePath}`), '')
  );
  // TOFIX: remove the fs dependency
  // somehow maybe have a promise which resolve into runtime value
  const runtime = fs.readFileSync(absoluteRuntimePath, 'utf8');
  const uglifyResult = UglifyJs.minify(runtime);
  if (uglifyResult.error) throw uglifyResult.error;
  return uglifyResult.code;
}

function writeHtml(urc, cssFilename) {
  // TOFIX renderHtml takes cssFilename param?
  return renderHtml(urc, cssFilename).then(html =>
    pify(fs.writeFile)(path.join(urc.outputDirectory, 'index.html'), html)
  );
}

module.exports = { renderHtml, writeHtml };

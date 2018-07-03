'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const pify = require('pify');
const UglifyJs = require('uglify-js');
const urlJoin = require('url-join');
const logger = require('./logger');
const { CSS_BASENAME, WEBPACK_ASSETS_BASENAME } = require('./constants');

function renderHtml(urc, cssFilename) {
  const assets = require(path.join(
    urc.outputDirectory,
    WEBPACK_ASSETS_BASENAME
  ));

  // Inline the runtime JS because it's super small.
  const absoluteRuntimePath = path.join(
    urc.outputDirectory,
    assets.runtime.js.replace(new RegExp(`^${urc.siteBasePath}`), '')
  );
  const runtime = fs.readFileSync(absoluteRuntimePath, 'utf8');
  const uglifyResult = UglifyJs.minify(runtime);
  if (uglifyResult.error) throw uglifyResult.error;
  const uglifiedRuntime = uglifyResult.code;

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

  const htmlSource = fs.existsSync(urc.htmlSource)
    ? urc.htmlSource
    : path.join(__dirname, './default-html.js');

  delete require.cache[require.resolve(htmlSource)];
  const htmlFn = require(htmlSource);
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

function writeHtml(urc, cssFilename) {
  logger.log('Writing index.html');
  return renderHtml(urc, cssFilename).then(html => {
    pify(fs.writeFile)(path.join(urc.outputDirectory, 'index.html'), html);
  });
}

function watchHtml(urc) {
  const rewriteHtml = () => {
    writeHtml(urc).catch(logger.error);
  };

  const watcher = chokidar.watch(urc.htmlSource, {
    ignoreInitial: true
  });
  watcher.on('add', rewriteHtml);
  watcher.on('change', rewriteHtml);
  watcher.on('unlink', rewriteHtml);
  watcher.on('error', logger.error);
}

module.exports = {
  write: writeHtml,
  watch: watchHtml
};

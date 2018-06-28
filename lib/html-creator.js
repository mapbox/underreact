'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const UglifyJs = require('uglify-js');
const logger = require('./chunk-light-logger');

function renderHtml(cl) {
  const assets = require(path.join(cl.outputDirectory, 'assets.json'));

  // Inline the runtime JS because it's super small.
  const absoluteRuntimePath = path.join(
    cl.outputDirectory,
    assets.runtime.js.replace(new RegExp(`^${cl.siteBasePath}`), '')
  );
  const runtime = fs.readFileSync(absoluteRuntimePath, 'utf8');
  const uglifyResult = UglifyJs.minify(runtime);
  if (uglifyResult.error) throw uglifyResult.error;
  const uglifiedRuntime = uglifyResult.code;

  const bundledScripts = `
    <script>${uglifiedRuntime}</script>
    <script src="${assets.vendor.js}"></script>
    <script src="${assets.app.js}"></script>
  `;

  let html;
  try {
    delete require.cache[require.resolve(cl.htmlSource)];
    const htmlFn = require(cl.htmlSource);
    html = htmlFn({
      siteBasePath: cl.siteBasePath,
      publicAssetsPath: cl.publicAssetsPath,
      production: cl.production
    });
  } catch (error) {
    throw new Error(`Failed to render HTML with ${cl.htmlSoruce}`);
  }

  html = html.trim().replace('</body>', `${bundledScripts}\n</body>`);

  return html;
}

function writeHtml(cl) {
  logger.log('Writing index.html');
  const html = renderHtml(cl);
  fs.writeFileSync(path.join(cl.outputDirectory, 'index.html'), html);
}

function watchHtml(cl) {
  const watcher = chokidar.watch(cl.htmlSource);
  watcher.on('change', () => {
    writeHtml(cl);
  });
  return watchHtml;
}

module.exports = {
  render: renderHtml,
  write: writeHtml,
  watch: watchHtml
};

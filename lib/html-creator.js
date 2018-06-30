'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const UglifyJs = require('uglify-js');
const joinUrlParts = require('./join-url-parts');
const logger = require('./chunk-light-logger');

function renderHtml(cl, cssFilename) {
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

  const cssAssets = [].concat(assets.app.css).filter(x => !!x);
  if (cssFilename) {
    cssAssets.push(
      joinUrlParts(
        ...path.relative(cl.outputDirectory, cssFilename).split(path.sep)
      )
    );
  } else if (cl.stylesheets.length !== 0 && !cl.production) {
    cssAssets.push(
      joinUrlParts(
        cl.siteBasePath,
        cl.publicAssetsPath,
        'chunk-light-styles.css'
      )
    );
  }
  const cssLinks = cssAssets.reduce((memo, assetPath) => {
    return (memo += `\n<link rel="stylesheet" href="${assetPath}">`);
  }, '');

  let html;
  try {
    if (path.extname(cl.htmlSource) === '.html') {
      html = fs.readFileSync(cl.htmlSource, 'utf8');
    } else {
      delete require.cache[require.resolve(cl.htmlSource)];
      const htmlFn = require(cl.htmlSource);
      html = htmlFn({
        siteBasePath: cl.siteBasePath,
        publicAssetsPath: cl.publicAssetsPath,
        production: cl.production
      });
    }
  } catch (error) {
    throw new Error(
      `Failed to read HTML from ${path.relative(process.cwd(), cl.htmlSource)}`
    );
  }

  if (!/<\/head\s*>/.test(html)) {
    throw new Error('HTML must include a <head>');
  }
  if (!/<\/body\s*>/.test(html)) {
    throw new Error('HTML must include a <body>');
  }

  html = html
    .trim()
    .replace('</head>', `${cssLinks}\n</head>`)
    .replace('</body>', `${bundledScripts}\n</body>`);

  return html;
}

function writeHtml(cl, cssFilename) {
  logger.log('Writing index.html');
  const html = renderHtml(cl, cssFilename);
  fs.writeFileSync(path.join(cl.outputDirectory, 'index.html'), html);
}

function watchHtml(cl) {
  const watcher = chokidar.watch(cl.htmlSource);
  watcher.on('change', () => {
    try {
      writeHtml(cl);
    } catch (error) {
      logger.log(error.stack);
    }
  });
}

module.exports = {
  render: renderHtml,
  write: writeHtml,
  watch: watchHtml
};

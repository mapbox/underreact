'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const pify = require('pify');
const chalk = require('chalk');
const UglifyJs = require('uglify-js');
const joinUrlParts = require('./join-url-parts');
const logger = require('./logger');
const { CSS_BASENAME } = require('./constants');

function renderHtml(urc, cssFilename) {
  const assets = require(path.join(urc.outputDirectory, 'assets.json'));

  // Inline the runtime JS because it's super small.
  const absoluteRuntimePath = path.join(
    urc.outputDirectory,
    assets.runtime.js.replace(new RegExp(`^${urc.siteBasePath}`), '')
  );
  const runtime = fs.readFileSync(absoluteRuntimePath, 'utf8');
  const uglifyResult = UglifyJs.minify(runtime);
  if (uglifyResult.error) throw uglifyResult.error;
  const uglifiedRuntime = uglifyResult.code;

  const bundledScripts = `
    <script>${uglifiedRuntime}</script>
    <script src="${assets.vendor.js}"></script>
    <script src="${assets.main.js}"></script>
  `;

  const cssAssets = [].concat(assets.main.css).filter(x => !!x);
  if (cssFilename) {
    cssAssets.push(
      joinUrlParts(
        ...path.relative(urc.outputDirectory, cssFilename).split(path.sep)
      )
    );
  } else if (urc.stylesheets.length !== 0 && !urc.production) {
    cssAssets.push(
      joinUrlParts(urc.siteBasePath, urc.publicAssetsPath, CSS_BASENAME)
    );
  }
  const cssLinks = cssAssets.reduce((memo, assetPath) => {
    return (memo += `\n<link rel="stylesheet" href="${assetPath}">`);
  }, '');

  let readHtml;
  if (!fs.existsSync(urc.htmlSource)) {
    const relPath = path.relative(process.cwd(), urc.htmlSource);
    const placeholderWarning = chalk.yellow(
      "using Underreact's placeholder HTML"
    );
    const changeWarning = chalk.bold(
      `You'll want to change this before deploying your site.`
    );
    logger.log(
      `${relPath} does not exist: ${placeholderWarning}. ${changeWarning}`
    );
    readHtml = pify(fs.readFile)(
      path.join(__dirname, './default-html.html'),
      'utf8'
    );
  } else if (path.extname(urc.htmlSource) === '.html') {
    readHtml = pify(fs.readFile)(urc.htmlSource, 'utf8');
  } else {
    delete require.cache[require.resolve(urc.htmlSource)];
    const htmlFn = require(urc.htmlSource);
    readHtml = Promise.resolve(
      htmlFn({
        siteBasePath: urc.siteBasePath,
        publicAssetsPath: urc.publicAssetsPath,
        production: urc.production
      })
    );
  }

  const transformHtml = html => {
    if (!/<\/head\s*>/.test(html)) {
      throw new Error('HTML must include a <head>');
    }
    if (!/<\/body\s*>/.test(html)) {
      throw new Error('HTML must include a <body>');
    }
    return html
      .trim()
      .replace('</head>', `${cssLinks}\n</head>`)
      .replace('</body>', `${bundledScripts}\n</body>`);
  };

  return readHtml.then(transformHtml);
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

  if (!fs.existsSync(urc.htmlSource)) {
    writeHtml(urc).catch(logger.error);
  }

  const watcher = chokidar.watch(urc.htmlSource);
  watcher.on('add', rewriteHtml);
  watcher.on('change', rewriteHtml);
  watcher.on('unlink', rewriteHtml);
  watcher.on('error', logger.error);
}

module.exports = {
  render: renderHtml,
  write: writeHtml,
  watch: watchHtml
};

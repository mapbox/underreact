'use strict';

const fs = require('fs');
const p = require('util.promisify');
const got = require('got');
const postcss = require('postcss');
const isAbsoluteUrl = require('is-absolute-url');
const postcssUrl = require('postcss-url');

const SOURCE_MAP_INLINE = 'inline';
const SOURCE_MAP_FILE = 'file';

const defaultUrlCache = new Map();

function concatToRoot({ stylesheets, urlCache }) {
  if (stylesheets.length === 0) {
    return Promise.reject(new Error('No stylesheets provided'));
  }

  if (urlCache === undefined) {
    urlCache = defaultUrlCache;
  }

  const roots = [];
  const promises = stylesheets.map((source, index) => {
    const parsePromise = isAbsoluteUrl(source)
      ? parseStylesheetFromUrl(source, urlCache)
      : parseStylesheetFromFs(source);
    return parsePromise.then(root => {
      roots[index] = root;
    });
  });
  return Promise.all(promises).then(() => concatRoots(roots));
}

function concatToFile({
  stylesheets,
  output,
  sourceMap = SOURCE_MAP_INLINE,
  plugins = [],
  urlCache
}) {
  if (stylesheets.length === 0) {
    return Promise.reject(new Error('No stylesheets provided'));
  }

  const allPlugins = [
    // Copy all url-referenced assets to the same place as the CSS.
    postcssUrl({
      url: 'copy',
      assetsPath: './',
      useHash: true,
      hashOptions: {
        append: true
      }
    }),
    ...plugins
  ].filter(Boolean);

  const writeOutput = root => {
    return postcss(allPlugins)
      .process(root, {
        from: undefined,
        to: output,
        map: {
          inline: sourceMap === SOURCE_MAP_INLINE
        }
      })
      .then(result => {
        const promises = [p(fs.writeFile)(output, result.css)];
        if (sourceMap === SOURCE_MAP_FILE) {
          promises.push(p(fs.writeFile)(`${output}.map`, result.map));
        }
        return Promise.all(promises);
      })
      .then(() => undefined);
  };

  return concatToRoot({ stylesheets, urlCache }).then(writeOutput);
}

function parseStylesheet(css, from) {
  try {
    return postcss.parse(css, { from });
  } catch (error) {
    rethrowPostcssError(error);
  }
}

function parseStylesheetFromUrl(url, urlCache) {
  const cached = urlCache && urlCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  return got(url).then(response => {
    const css = response.body;
    const root = parseStylesheet(css, url);
    urlCache && urlCache.set(url, root);
    return root;
  });
}

function parseStylesheetFromFs(filename) {
  return p(fs.readFile)(filename, 'utf8').then(css =>
    parseStylesheet(css, filename)
  );
}

function concatRoots(roots) {
  return roots.reduce((memoRoot, root) => {
    return memoRoot.append(root);
  });
}

function rethrowPostcssError(error) {
  error.message = `PostCSS error: ${error.message}`;
  if (error.name === 'CssSyntaxError') {
    error.message += '\n' + error.showSourceCode();
  }
  throw error;
}

module.exports = { concatToRoot, concatToFile };

'use strict';

const path = require('path');

function validateConfig(rawConfig, configDir) {
  const defaults = {
    babelPresets: [],
    babelPlugins: [],
    webpackLoaders: [],
    webpackPlugins: [],
    webpackConfigTransform: x => x,
    siteBasePath: '',
    port: 8080,
    publicAssetsPath: 'chunk-light-assets',
    devBrowserslist: [
      'last 2 Firefox versions',
      'last 2 Chrome versions',
      'last 2 Safari versions',
      'last 2 iOS versions'
    ],
    stylesheets: [],
    postcssPlugins: [],
    environmentVariables: [],
    devServerHistoryFallback: false
    // The CLI sets `production`.
    // The CLI sets `stats`.
  };

  const defaultPolyfills = {
    objectAssign: false,
    promise: false,
    fetch: false
  };

  const cl = Object.assign({}, defaults, rawConfig, {
    polyfills: Object.assign({}, defaultPolyfills, rawConfig.polyfills)
  });

  cl.rootDirectory = configDir;

  // Add defaults that depend on the rootDirectory.
  setDefault(
    cl,
    'outputDirectory',
    path.join(cl.rootDirectory, '_chunk-light-site')
  );
  setDefault(cl, 'publicDirectory', path.join(cl.rootDirectory, 'public'));
  setDefault(cl, 'jsSource', path.join(cl.rootDirectory, 'src/index.js'));
  setDefault(cl, 'htmlSource', path.join(cl.rootDirectory, 'src/html.js'));

  // Normalize URL parts.
  if (cl.siteBasePath && cl.siteBasePath !== '/') {
    cl.siteBasePath = cl.siteBasePath.replace(/\/$/, '');
    if (!cl.siteBasePath.startsWith('/')) {
      cl.siteBasePath = '/' + cl.siteBasePath;
    }
  }
  if (!cl.publicAssetsPath.startsWith('/')) {
    cl.publicAssetsPath = '/' + cl.publicAssetsPath;
  }

  return cl;
}

function setDefault(cl, property, value) {
  if (cl[property] === undefined) {
    cl[property] = value;
  }
}

module.exports = validateConfig;

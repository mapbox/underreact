'use strict';

const path = require('path');

function validateConfig(rawConfig, configDir) {
  const defaults = {
    babelPresets: [],
    babelPlugins: [],
    babelInclude: [],
    babelExclude: /[/\\\\]node_modules[/\\\\]/,
    webpackLoaders: [],
    webpackPlugins: [],
    webpackConfigTransform: x => x,
    siteBasePath: '/',
    port: 8080,
    publicAssetsPath: 'chunk-light-assets',
    browserslist: [
      // Browsers supporting classes, arrow functions, default parameters.
      'Edge >= 14',
      'Firefox >= 45',
      'Chrome >= 49',
      'Safari >= 10',
      'iOS >= 10.2',
      'Opera >= 36'
    ],
    stylesheets: [],
    postcssPlugins: [],
    environmentVariables: [],
    devServerHistoryFallback: false
    // The CLI sets `production`.
    // The CLI sets `stats`.
  };
  const cl = Object.assign(defaults, rawConfig);

  cl.rootDirectory = configDir;

  // Add defaults that depend on the rootDirectory
  setDefault(
    cl,
    'outputDirectory',
    path.join(cl.rootDirectory, '_chunk-light-site')
  );
  setDefault(cl, 'publicDirectory', path.join(cl.rootDirectory, 'public'));
  setDefault(cl, 'jsSource', path.join(cl.rootDirectory, 'src/index.js'));
  setDefault(cl, 'htmlSource', path.join(cl.rootDirectory, 'src/html.js'));

  // Normalize siteBasePath so it neither starts nor ends with slashes.
  cl.siteBasePath = cl.siteBasePath.replace(/(^\/|\/$)/g, '');

  return cl;
}

function setDefault(cl, property, value) {
  if (cl[property] === undefined) {
    cl[property] = value;
  }
}

module.exports = validateConfig;

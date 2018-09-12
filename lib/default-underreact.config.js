'use strict';
const path = require('path');

module.exports = (cliOpts = {}) => {
  const rootDirectory = path.dirname(cliOpts.configPath);
  const underreactRoot = path.resolve(__dirname, '..');

  const urc = {
    polyfills: {
      objectAssign: false,
      promise: false,
      fetch: false
    },
    siteBasePath: '',
    stylesheets: [],
    vendorModules: [],
    postcssPlugins: [],
    devServerHistoryFallback: false,
    publicAssetsPath: 'underreact-assets',
    webpackLoaders: [],
    webpackPlugins: [],
    webpackConfigTransform: x => x,
    port: cliOpts.port || 8080,
    clientEnvPrefix: '',

    // Add defaults that depend on the rootDirectory.
    rootDirectory,
    outputDirectory: path.join(rootDirectory, '_underreact-site'),
    publicDirectory: path.join(rootDirectory, 'public'),
    jsEntry: path.join(rootDirectory, 'src', 'entry.js'),
    htmlSource: require(path.join(underreactRoot, 'lib', 'default-html.js')),

    // internal
    production: cliOpts.mode === 'production',
    mode: cliOpts.mode,
    stats: cliOpts.stats,
    underreactRoot
  };

  return urc;
};

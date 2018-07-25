'use strict';
const path = require('path');

module.exports = ({ production, stats, port, configDir }) => {
  const rootDirectory = configDir;
  const urc = {
    polyfills: {
      objectAssign: false,
      promise: false,
      fetch: false
    },
    siteBasePath: '',
    stylesheets: [],
    vendorModules: [],
    environmentVariables: [],
    postcssPlugins: [],
    devServerHistoryFallback: false,
    publicAssetsPath: 'underreact-assets',
    babelPresets: [],
    babelPlugins: [],
    webpackLoaders: [],
    webpackPlugins: [],
    webpackConfigTransform: x => x,
    port: port || 8080,
    // internal
    production,
    stats,
    // Add defaults that depend on the rootDirectory.
    rootDirectory,
    outputDirectory: path.join(rootDirectory, '_underreact-site'),
    publicDirectory: path.join(rootDirectory, 'public'),
    jsEntry: path.join(rootDirectory, 'src/entry.js'),
    htmlSource: path.join(rootDirectory, 'src/html.js')
  };

  return urc;
};

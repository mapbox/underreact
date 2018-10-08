'use strict';
const path = require('path');

module.exports = (cliOpts = {}) => {
  const rootDirectory = path.dirname(cliOpts.configPath);
  const underreactRoot = path.resolve(__dirname, '..');

  return {
    browserslist: undefined,
    clientEnvPrefix: '',
    compileNodeModules: false,
    devServerHistoryFallback: false,
    hot: true,
    htmlSource: require(path.join(underreactRoot, 'lib', 'default-html.js')),
    jsEntry: path.join(rootDirectory, 'src', 'entry.js'),
    liveReload: true,
    modernBrowserTest: `'fetch' in window && 'assign' in Object`,
    outputDirectory: path.join(rootDirectory, '_underreact-site'),
    polyfill: path.resolve(underreactRoot, 'polyfill', 'index.js'),
    port: cliOpts.port || 8080,
    postcssPlugins: [],
    publicAssetsPath: 'underreact-assets',
    publicDirectory: path.join(rootDirectory, 'public'),
    siteBasePath: '',
    stats: cliOpts.stats || false,
    stylesheets: [],
    vendorModules: [],
    webpackConfigTransform: x => x,
    webpackLoaders: [],
    webpackPlugins: []
  };
};

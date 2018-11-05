'use strict';

const path = require('path');
const browserslist = require('browserslist');

const defaultBrowserslistQuery = [
  '>0.2%',
  'not dead',
  'not ie < 11',
  'not op_mini all'
];

module.exports = (cliOpts = {}) => {
  const rootDirectory = path.dirname(cliOpts.configPath);
  const underreactRoot = path.resolve(__dirname, '..');

  return {
    // Avoid overriding browserslist query, if the user is setting it
    // outside of underreact.config.js,
    browserslist: browserslist.findConfig(rootDirectory)
      ? undefined
      : defaultBrowserslistQuery,
    clientEnvPrefix: '',
    compileNodeModules: true,
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
    vendorModules: [],
    webpackConfigTransform: x => x,
    webpackLoaders: [],
    webpackPlugins: []
  };
};

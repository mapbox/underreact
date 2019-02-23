'use strict';

const path = require('path');
const browserslist = require('browserslist');

const defaultBrowserslistQuery = [
  '>0.2%',
  'not dead',
  'not ie < 11',
  'not op_mini all',
  'not Opera > 56'
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
    compileNodeModules: true,
    devServerHistoryFallback: false,
    environmentVariables: {},
    hot: true,
    htmlSource: require(path.join(underreactRoot, 'lib', 'default-html.js')),
    jsEntry: path.join(rootDirectory, 'src', 'index.js'),
    liveReload: true,
    modernBrowserTest: `'fetch' in window && 'assign' in Object`,
    outputDirectory: path.join(rootDirectory, '_site'),
    polyfill: path.resolve(underreactRoot, 'polyfill', 'index.js'),
    port: cliOpts.port || 8080,
    postcssPlugins: [],
    publicAssetsPath: 'underreact-assets',
    publicDirectory: path.join(rootDirectory, 'public'),
    // The absolute path `/` plays well with SPA using HTML5 push
    // and also with regular apps hosted at root.
    siteBasePath: '/',
    stats: cliOpts.stats || false,
    vendorModules: [],
    webpackConfigTransform: x => x,
    webpackLoaders: [],
    webpackPlugins: []
  };
};

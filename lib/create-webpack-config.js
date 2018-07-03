'use strict';

const path = require('path');
const webpack = require('webpack');
const findupSync = require('findup-sync');
const AssetsPlugin = require('assets-webpack-plugin');
const resolvePkg = require('resolve-pkg');
const urlJoin = require('url-join');
const createBabelConfig = require('./packageable/create-babel-config');
const safeWebpackUglifier = require('./packageable/safe-webpack-uglifier');
const { WEBPACK_ASSETS_BASENAME } = require('./constants');

function createWebpackConfig(urc) {
  const jsSourceDir = path.dirname(urc.jsSource);

  const babelConfig = createBabelConfig({
    customPresets: urc.babelPresets,
    customPlugins: urc.babelPlugins,
    mode: urc.production ? 'production' : 'development'
  });

  const webpackPlugins = [
    new AssetsPlugin({
      path: path.resolve(urc.outputDirectory),
      filename: WEBPACK_ASSETS_BASENAME,
      processOutput: x => JSON.stringify(x, null, 2)
    }),
    new webpack.EnvironmentPlugin(urc.environmentVariables),
    ...urc.webpackPlugins
  ];

  const jsLoader = {
    test: /\.jsx?/,
    exclude: [/[/\\\\]node_modules[/\\\\]/],
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: babelConfig.presets,
          plugins: babelConfig.plugins,
          cacheDirectory: true,
          babelrc: false,
          compact: false
        }
      }
    ]
  };

  const sourceNodeModules = findupSync('node_modules', {
    cwd: jsSourceDir
  });

  const mainEntry = [
    urc.polyfills.objectAssign && require.resolve('./polyfills/object-assign'),
    urc.polyfills.promise && require.resolve('./polyfills/promise'),
    urc.polyfills.fetch && require.resolve('./polyfills/fetch'),
    urc.jsSource
  ].filter(Boolean);

  const config = {
    mode: urc.production ? 'production' : 'development',
    entry: {
      main: mainEntry,
      vendor: [
        resolvePkg('react', { cwd: jsSourceDir }),
        resolvePkg('react-dom', { cwd: jsSourceDir }),
        ...urc.vendorModules
      ]
    },
    output: {
      path: path.join(urc.outputDirectory, urc.publicAssetsPath),
      pathinfo: !urc.production,
      publicPath: urlJoin(urc.siteBasePath, urc.publicAssetsPath),
      filename: urc.production ? `[name]-[chunkhash:10].js` : `[name].js`,
      chunkFilename: urc.production
        ? `[name]-[chunkhash:10].chunk.js`
        : `[name].chunk.js`
    },
    module: {
      rules: [jsLoader, ...urc.webpackLoaders]
    },
    plugins: webpackPlugins,
    // Loader names need to be strings, and to allow them to be looked
    // up within this module's nested dependencies, not just the user's
    // node_modules, we need this.
    resolveLoader: {
      modules: [sourceNodeModules, 'node_modules']
    },
    devtool: urc.production ? 'source-map' : 'cheap-module-source-map',
    optimization: {
      minimizer: [safeWebpackUglifier()],
      splitChunks: {
        cacheGroups: {
          // We're creating a vendor bundle with explicitly included
          // dependencies only (instead of all node_modules) so it's not in
          // danger of bloating to dangerous levels with the default setting.
          // Also if may save you from busting the vendor bundle's cache as
          // frequently as otherwise.
          vendor: {
            chunks: 'initial',
            name: 'vendor',
            test: 'vendor',
            enforce: true
          }
        }
      },
      runtimeChunk: 'single'
    },
    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty'
    },
    bail: urc.production,
    performance: false
  };

  return urc.webpackConfigTransform(config);
}

module.exports = createWebpackConfig;

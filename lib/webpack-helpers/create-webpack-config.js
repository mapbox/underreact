'use strict';

const path = require('path');
const webpack = require('webpack');
const findupSync = require('findup-sync');
const AssetsPlugin = require('assets-webpack-plugin');
const resolvePkg = require('resolve-pkg');
const urlJoin = require('url-join');
const fs = require('fs');

const safeWebpackUglifier = require('../utils/safe-webpack-uglifier');
const { WEBPACK_ASSETS_BASENAME } = require('../constants');

module.exports = createWebpackConfig;

function createWebpackConfig(urc) {
  const jsEntryDir = path.dirname(urc.jsEntry);
  const babelConfig = createBabelLoader(urc);

  const webpackPlugins = [
    new AssetsPlugin({
      path: path.resolve(urc.outputDirectory),
      filename: WEBPACK_ASSETS_BASENAME,
      processOutput: x => JSON.stringify(x, null, 2)
    }),
    new webpack.EnvironmentPlugin(urc.getClientEnvVars()),
    ...urc.webpackPlugins
  ];

  const jsLoader = {
    test: /\.jsx?$/,
    exclude: [/[/\\\\]node_modules[/\\\\]/],
    use: [babelConfig]
  };

  const sourceNodeModules = findupSync('node_modules', {
    cwd: jsEntryDir
  });

  const mainEntry = [
    urc.polyfills.objectAssign && require.resolve('../polyfills/object-assign'),
    urc.polyfills.promise && require.resolve('../polyfills/promise'),
    urc.polyfills.fetch && require.resolve('../polyfills/fetch'),
    urc.jsEntry
  ].filter(Boolean);

  const entry = {
    main: mainEntry,
    vendor: [
      resolvePkg('react', { cwd: jsEntryDir }),
      resolvePkg('react-dom', { cwd: jsEntryDir }),
      ...urc.vendorModules
    ].filter(Boolean)
  };

  // webpack complains if vendor is []
  if (entry.vendor.length === 0) {
    delete entry.vendor;
  }

  const config = {
    mode: urc.production ? 'production' : 'development',
    entry,
    output: {
      path: path.join(urc.outputDirectory, urc.publicAssetsPath),
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

function createBabelLoader(urc) {
  const loader = {
    loader: require.resolve('babel-loader'),
    options: {
      presets: [require.resolve('../../packages/babel-preset-mapbox')],
      cacheDirectory: true,
      babelrc: false,
      compact: false
    }
  };
  const exists = fs.existsSync(path.join(urc.rootDirectory, '.babelrc'));

  if (exists) {
    delete loader.options.presets;
    loader.options.babelrc = true;
  }

  return loader;
}

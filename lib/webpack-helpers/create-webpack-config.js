'use strict';
const path = require('path');
const findupSync = require('findup-sync');
const resolvePkg = require('resolve-pkg');

const compact = require('../utils/compact-array');
const safeWebpackUglifier = require('./safe-webpack-uglifier');
const webpackPlugins = require('./webpack-plugins');
const webpackLoaders = require('./webpack-loaders');

const webpackEntry = urc => {
  const jsEntryDir = path.dirname(urc.jsEntry);
  const entry = {
    main: compact([
      urc.liveReload && require.resolve('webpack-dev-server/client') + '?/', // TOFIX wonder if we need to add localhost or not?
      urc.hot && require.resolve('webpack/hot/dev-server'),
      urc.jsEntry
    ]),
    polyfill: urc.polyfill,
    vendor: compact([
      resolvePkg('react', { cwd: jsEntryDir }),
      resolvePkg('react-dom', { cwd: jsEntryDir }),
      ...urc.vendorModules
    ])
  };

  // webpack complains if vendor is []
  if (entry.vendor.length === 0) {
    delete entry.vendor;
  }

  if (urc.polyfill === false) {
    delete entry.polyfill;
  }
  return entry;
};

module.exports = function createWebpackConfig(urc) {
  const publicAssetsPath = urc.publicAssetsPath.replace(/^\//, '');
  const sourceNodeModules = findupSync('node_modules', {
    cwd: path.dirname(urc.jsEntry)
  });

  const config = {
    bail: urc.production,
    devtool: urc.production ? 'source-map' : 'cheap-module-source-map',
    entry: webpackEntry(urc),
    mode: urc.production ? 'production' : 'development',
    module: {
      rules: [
        {
          oneOf: webpackLoaders(urc)
        }
      ]
    },
    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty'
    },
    optimization: {
      minimizer: [safeWebpackUglifier()],
      splitChunks: {
        cacheGroups: {
          // We're creating a vendor bundle with explicitly included
          // dependencies only (instead of all node_modules) so it's not in
          // danger of bloating to dangerous levels with the default setting.
          // Also it may save you from busting the vendor bundle's cache as
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
    output: {
      path: path.join(urc.outputDirectory),
      publicPath: path.join(urc.siteBasePath, '/'), // TOFIX clean up this patching (/) of siteBasePath and also publicAssetsApth
      filename: urc.production
        ? `${publicAssetsPath}/js/[name]-[chunkhash:10].js`
        : `${publicAssetsPath}/js/[name].js`,
      chunkFilename: urc.production
        ? `${publicAssetsPath}/js/[name]-[chunkhash:10].chunk.js`
        : `${publicAssetsPath}/js/[name].chunk.js`
    },
    performance: false,
    plugins: webpackPlugins(urc),
    resolve: {
      alias: {
        // This is added to make Underreact symlinking work with npm <=3,
        '@babel/runtime': path.dirname(
          require.resolve('@babel/runtime/package.json')
        )
      }
    },
    // Loader names need to be strings, and to allow them to be looked
    // up within this module's nested dependencies, not just the user's
    // node_modules, we need this.
    resolveLoader: {
      modules: [sourceNodeModules, 'node_modules']
    }
  };
  return urc.webpackConfigTransform(config);
};

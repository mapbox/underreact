'use strict';
const urlJoin = require('url-join');
const path = require('path');
const findupSync = require('findup-sync');
const resolvePkg = require('resolve-pkg');

const compact = require('../utils/compact-array');
const safeWebpackUglifier = require('./safe-webpack-uglifier');
const pluginsList = require('./plugins-list');
const loadersList = require('./loaders-list');

const webpackEntry = urc => {
  const entry = {
    main: compact([
      // The `?/` is needed for webpack to communicate with webpack-dev-server/client
      urc.liveReload && require.resolve('webpack-dev-server/client') + '?/',
      urc.hot && require.resolve('webpack/hot/dev-server'),
      urc.jsEntry
    ]),
    polyfill: urc.polyfill,
    vendor: compact([
      resolvePkg('react', { cwd: urc.appDir }),
      resolvePkg('react-dom', { cwd: urc.appDir }),
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
  const sourceNodeModules = findupSync('node_modules', {
    cwd: urc.appDir
  });

  const config = {
    context: urc.rootDirectory,
    bail: urc.isProductionMode,
    devtool: urc.isProductionMode ? 'source-map' : 'cheap-module-source-map',
    entry: webpackEntry(urc),
    mode: urc.isProductionMode ? 'production' : 'development',
    module: loadersList(urc),
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
      path: urc.outputDirectory,
      publicPath: urlJoin(urc.siteBasePath, '/'),
      filename: urc.isProductionMode
        ? urlJoin(urc.publicAssetsPath, '/js/[name]-[chunkhash:10].js')
        : urlJoin(urc.publicAssetsPath, '/js/[name].js'),
      chunkFilename: urc.isProductionMode
        ? urlJoin(urc.publicAssetsPath, '/js/[name]-[chunkhash:10].chunk.js')
        : urlJoin(urc.publicAssetsPath, '/js/[name].chunk.js')
    },
    performance: false,
    plugins: pluginsList(urc),
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
      modules: compact([sourceNodeModules, 'node_modules'])
    }
  };
  return urc.webpackConfigTransform(config);
};

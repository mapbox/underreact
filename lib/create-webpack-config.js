'use strict';

const path = require('path');
const webpack = require('webpack');
const findupSync = require('findup-sync');
const AssetsPlugin = require('assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const createBabelConfig = require('./create-babel-config');
const joinUrlParts = require('./join-url-parts');

function createWebpackConfig(cl) {
  const jsSourceDir = path.dirname(cl.jsSource);

  const babelConfig = createBabelConfig({
    customPresets: cl.babelPresets,
    customPlugins: cl.babelPlugins,
    env: cl.production ? 'production' : 'development',
    devBrowserslist: cl.devBrowserslist
  });

  const webpackPlugins = [
    new AssetsPlugin({
      path: path.resolve(cl.outputDirectory),
      filename: `assets.json`,
      processOutput: x => JSON.stringify(x, null, 2)
    }),
    new webpack.EnvironmentPlugin(cl.environmentVariables),
    ...cl.webpackPlugins
  ];

  const jsLoader = {
    test: /\.jsx?/,
    exclude: [/[/\\\\]node_modules[/\\\\]/],
    use: [
      {
        loader: 'thread-loader',
        options: cl.production
          ? undefined
          : {
              // Keep workers alive for more effective watch mode.
              poolTimeout: Infinity
            }
      },
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

  const uglifier = new UglifyJsPlugin({
    uglifyOptions: {
      parse: {
        ecma: 8
      },
      compress: {
        ecma: 5,
        warnings: false,
        comparisons: false
      },
      mangle: {
        safari10: true
      },
      output: {
        ecma: 5,
        comments: false,
        ascii_only: true
      }
    },
    parallel: true,
    cache: true
  });

  const entry = [
    cl.polyfills.objectAssign && require.resolve('./polyfills/object-assign'),
    cl.polyfills.promise && require.resolve('./polyfills/promise'),
    cl.polyfills.fetch && require.resolve('./polyfills/fetch'),
    cl.jsSource
  ].filter(Boolean);

  const config = {
    mode: cl.production ? 'production' : 'development',
    entry,
    output: {
      path: path.join(cl.outputDirectory, cl.publicAssetsPath),
      pathinfo: !cl.production,
      publicPath: joinUrlParts(cl.siteBasePath, cl.publicAssetsPath, ''),
      filename: cl.production ? `[name]-[chunkhash:10].js` : `[name].js`,
      chunkFilename: cl.production
        ? `[name]-[chunkhash:10].chunk.js`
        : `[name].chunk.js`
    },
    module: {
      rules: [jsLoader, ...cl.webpackLoaders]
    },
    plugins: webpackPlugins,
    // Loader names need to be strings, and to allow them to be looked
    // up within this module's nested dependencies, not just the user's
    // node_modules, we need this.
    resolveLoader: {
      modules: [sourceNodeModules, 'node_modules']
    },
    devtool: cl.production ? 'source-map' : 'cheap-module-source-map',
    optimization: {
      // This non-default Uglify madness is lifted from create-react-app:
      // https://github.com/facebook/create-react-app/blob/581c453610f08ef67ed467029ec289cfebe52063/packages/react-scripts/config/webpack.config.prod.js#L118-L155
      minimizer: [uglifier],
      splitChunks: {
        chunks: 'all',
        name: 'vendor'
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
    bail: cl.production,
    performance: false
  };

  return cl.webpackConfigTransform(config);
}

module.exports = createWebpackConfig;

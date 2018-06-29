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

  const babelConfig = createBabelConfig(cl);

  const babelLoaderConfig = {
    loader: 'babel-loader',
    options: {
      presets: babelConfig.presets,
      plugins: babelConfig.plugins,
      cacheDirectory: true,
      babelrc: false,
      compact: false
    }
  };

  // Create a `resource` to determine what gets compiled by Babel.
  // See https://webpack.js.org/configuration/module/#condition.
  const babelOrConditions = [];
  cl.babelInclude.forEach(condition => {
    if (typeof condition === 'string' && !path.isAbsolute(condition)) {
      babelOrConditions.push({
        include: new RegExp(`${condition}(?!/node_modules).*`)
      });
    } else {
      // Any condition other than a node_module name should be a
      // direct Webpack condition.
      babelOrConditions.push({ include: condition });
    }
  });
  const babelResource = {
    or: [
      { test: /\.jsx?$/, exclude: cl.babelExclude },
      { and: [{ test: /\.jsx?$/ }, { or: babelOrConditions }] }
    ]
  };

  const babelRule = {
    resource: babelResource,
    use: [babelLoaderConfig]
  };

  const loaderConfig = [babelRule].concat(cl.webpackLoaders);

  const plugins = [
    new AssetsPlugin({
      path: path.resolve(cl.outputDirectory),
      filename: `assets.json`,
      processOutput: x => JSON.stringify(x, null, 2)
    }),
    new webpack.EnvironmentPlugin(cl.environmentVariables),
    ...cl.webpackPlugins
  ];

  const sourceNodeModules = findupSync('node_modules', {
    cwd: jsSourceDir
  });

  const config = {
    entry: {
      app: cl.jsSource
    },
    output: {
      path: path.join(cl.outputDirectory, cl.publicAssetsPath),
      pathinfo: !cl.production,
      publicPath: joinUrlParts(cl.siteBasePath, cl.publicAssetsPath, ''),
      filename: cl.production ? `[name]-[chunkhash].js` : `[name].js`,
      chunkFilename: cl.production
        ? `[name]-[chunkhash].chunk.js`
        : `[name].chunk.js`
    },
    module: {
      rules: loaderConfig
    },
    plugins,
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
      minimizer: [
        new UglifyJsPlugin({
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
        })
      ],
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
    mode: cl.production ? 'production' : 'development',
    bail: cl.production
  };

  return cl.webpackConfigTransform(config);
}

module.exports = createWebpackConfig;

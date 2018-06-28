'use strict';

const path = require('path');
const findupSync = require('findup-sync');
const AssetsPlugin = require('assets-webpack-plugin');
const resolveFrom = require('resolve-from');
const createBabelConfig = require('./create-babel-config');
const joinUrlParts = require('./join-url-parts');

function createWebpackConfig(cl) {
  const vendorModules = [
    resolveModuleDirectoryFrom(cl.jsSource, 'react'),
    resolveModuleDirectoryFrom(cl.jsSource, 'react-dom')
  ].concat(cl.vendorModules);

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
    })
  ];

  const sourceNodeModules = findupSync('node_modules', {
    cwd: path.dirname(cl.jsSource)
  });

  return {
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
    mode: cl.production ? 'production' : 'development',
    // Loader names need to be strings, and to allow them to be looked
    // up within this module's nested dependencies, not just the user's
    // node_modules, we need this.
    resolveLoader: {
      modules: [sourceNodeModules, 'node_modules']
    },
    devtool: 'source-map',
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: new RegExp(`(${vendorModules.join('|')})`),
            name: 'vendor',
            chunks: 'all'
          }
        }
      },
      runtimeChunk: {
        name: 'runtime'
      }
    }
  };
}

function resolveModuleDirectoryFrom(src, name) {
  return resolveFrom(src, name).replace(
    /node_modules\/([^/]+).*$/,
    'node_modules/$1'
  );
}

module.exports = createWebpackConfig;

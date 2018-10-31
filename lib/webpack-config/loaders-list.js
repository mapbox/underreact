'use strict';

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');

const compact = require('../utils/compact-array');
const babelLoader = require('./babel-loader-config');

module.exports = function webpackLoadersList(urc) {
  const jsLoaders = [babelLoader.getConfigForApp(urc)];

  if (urc.compileNodeModules) {
    jsLoaders.push(babelLoader.getConfigForNodeModules(urc));
  }

  const fileLoader = {
    loader: require.resolve('file-loader'),
    exclude: [/\.(js|jsx)$/, /\.template$/, /\.json$/, /\.ejs$/],
    options: {
      name: path.join(urc.publicAssetsPath, '/media/[name].[hash:8].[ext]')
    }
  };

  const cssLoader = {
    test: /\.css$/,
    use: [
      urc.isProductionMode
        ? MiniCssExtractPlugin.loader
        : require.resolve('style-loader'),
      { loader: require.resolve('css-loader'), options: { importLoaders: 1 } },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          ident: 'postcss',
          plugins: [autoprefixer(), ...urc.postcssPlugins]
        }
      }
    ]
  };
  return {
    rules: [
      {
        oneOf: compact([
          ...jsLoaders,
          cssLoader,
          ...urc.webpackLoaders,
          fileLoader
        ])
      },
      ...urc.inclusiveWebpackLoaders
    ]
  };
};

'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');
const urlJoin = require('url-join');

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
      name: urlJoin(urc.publicAssetsPath, '/media/[name].[hash:8].[ext]')
    }
  };

  const cssLoader = {
    test: /\.css$/,
    use: [
      urc.isProductionMode
        ? MiniCssExtractPlugin.loader
        : require.resolve('style-loader'),
      {
        loader: require.resolve('css-loader'),
        options: { importLoaders: 1, sourceMap: true }
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          ident: 'postcss',
          plugins: [autoprefixer(), ...urc.postcssPlugins]
        }
      }
    ]
  };

  const svgLoader = {
    test: /\.svg$/,
    // Applies react transformation only to svgs imported
    // from Javascript files
    issuer: /\.(js|jsx)$/,
    use: {
      loader: '@mapbox/svg-react-transformer-loader',
      options: {
        template: 'fancy'
      }
    }
  };

  return {
    rules: [
      {
        oneOf: compact([
          ...urc.webpackLoaders,
          ...jsLoaders,
          cssLoader,
          svgLoader,
          fileLoader
        ])
      }
    ]
  };
};

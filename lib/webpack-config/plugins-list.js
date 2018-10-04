'use strict';

const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { WEBPACK_ASSETS_BASENAME } = require('../constants');
const compact = require('../utils/compact-array');
const ExcludeChunksPlugin = require('../webpack-plugins/exclude-chunks-plugin');
const ModuleNotFoundPlugin = require('../webpack-plugins/module-not-found-plugin');
const generateHtmlTemplate = require('./generate-html-template');

module.exports = function webpackPluginsList(urc) {
  const publicAssetsPath = urc.publicAssetsPath.replace(/^\//, '');
  return compact([
    new ModuleNotFoundPlugin(urc.rootDirectory),
    new AssetsPlugin({
      path: path.resolve(urc.outputDirectory),
      filename: WEBPACK_ASSETS_BASENAME,
      processOutput: x => JSON.stringify(x, null, 2)
    }),
    new webpack.EnvironmentPlugin(urc.getClientEnvVars()),
    new MiniCssExtractPlugin({
      filename: `${publicAssetsPath}/css/[name]-[contenthash:8].css`,
      chunkFilename: `${publicAssetsPath}/css/[name]-[contenthash:8].css`
    }),

    new HtmlWebpackPlugin({
      inject: true,
      excludeChunks: ['polyfill', 'runtime'],
      minify: !urc.production
        ? {}
        : {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true
          },
      templateContent: ({ compilation, htmlWebpackPlugin }) =>
        generateHtmlTemplate({
          urc,
          webpackCompilation: compilation,
          publicPath: htmlWebpackPlugin.files.publicPath
        })
    }),
    urc.hot && new webpack.HotModuleReplacementPlugin(),
    ...urc.webpackPlugins,
    // This should be the last plugin, since it removes certain
    // chunks from webpack compilation.
    // We are removing `runtime` chunk since it has already been
    // inlined inside `HtmlWebpackPlugin`, hence writing it to
    // disk would be wasteful.
    new ExcludeChunksPlugin({
      excludeChunks: ['runtime']
    })
  ]);
};

'use strict';

const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const urlJoin = require('url-join');

const { WEBPACK_ASSETS_BASENAME } = require('../constants');
const compact = require('../utils/compact-array');
const ExcludeChunksPlugin = require('../webpack-plugins/exclude-chunks-plugin');
const generateHtmlTemplate = require('./generate-html-template');

module.exports = function webpackPluginsList(urc) {
  return compact([
    new AssetsPlugin({
      path: path.resolve(urc.outputDirectory),
      filename: WEBPACK_ASSETS_BASENAME,
      processOutput: x => JSON.stringify(x, null, 2)
    }),
    new webpack.EnvironmentPlugin(urc.readClientEnvVars()),
    new MiniCssExtractPlugin({
      filename: urlJoin(
        urc.publicAssetsPath,
        `/css/[name]-[contenthash:8].css`
      ),
      chunkFilename: urlJoin(
        urc.publicAssetsPath,
        `/css/[name]-[contenthash:8].chunk.css`
      )
    }),
    new HtmlWebpackPlugin({
      inject: true,
      // This prevents HtmlWebpackPlugin's default behaviour
      // to inject script tags in the html. `polyfill` and `runtime` chunks
      // are dealt in `generateHtmlTemplate`.
      excludeChunks: ['polyfill', 'runtime'],
      minify: urc.isDevelopmentMode
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

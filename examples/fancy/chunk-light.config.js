'use strict';

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

module.exports = ({ webpack, production }) => {
  return {
    siteBasePath: 'fancy',
    publicAssetsPath: 'cacheable-things',
    stylesheets: [
      path.join(__dirname, './src/bg.css'),
    ],
    htmlSource: path.join(__dirname, './src/index.html'),
    babelPlugins: [
      require.resolve('babel-plugin-lodash')
    ],
    babelInclude: ['p-finally'],
    webpackLoaders: [
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader',
        ]
      }
    ],
    webpackPlugins: [
      new MiniCssExtractPlugin({
        filename: "[name]-[chunkhash].css",
        chunkFilename: "[id]-[chunkhash].css"
      }),
      new webpack.DefinePlugin({
        DEFINE_WORKED: '"Yes"'
      })
    ],
    environmentVariables: [
      'ENV_VAR'
    ],
    browserslist: [
      "last 2 chrome version",
      "ie 11"
    ]
  };
};

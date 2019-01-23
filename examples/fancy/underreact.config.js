'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const htmlSource = ({basePath}) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fancy examples</title>
      <link href="https://api.mapbox.com/mapbox-assembly/v0.21.2/assembly.min.css" rel="stylesheet">
      <link href="${basePath}/blink.css" rel="stylesheet">
      <script async defer src="https://api.mapbox.com/mapbox-assembly/v0.21.2/assembly.js"></script>
    </head>
    <body>
      <div id="app"></div>
    </body>
    </html>
  `;


module.exports = ({ webpack }) => {
  return {
    jsEntry: path.join(__dirname, 'src', 'entry.js'),
    hot: true,
    polyfill: false,
    siteBasePath: 'fancy',
    publicAssetsPath: 'cacheable-things',
    htmlSource,
    environmentVariables: {
      CLIENT_TOKEN: 'a123'
    },
    webpackLoaders: [
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
      }
    ],
    webpackPlugins: [
      new webpack.DefinePlugin({
        DEFINE_WORKED: '"Yes"'
      })
    ],
    webpackConfigTransform: config => {
      config.devtool = false;
      return config;
    },
    browserslist: {
      development: ['> 1%', 'ie 10'],
      production: ['last 1 chrome version', 'last 1 firefox version']
    }
  };
};

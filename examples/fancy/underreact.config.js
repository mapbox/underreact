'use strict';

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

const htmlSource = ({ renderCssLinks, renderJsBundles }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fancy examples</title>
      <link href="https://api.mapbox.com/mapbox-assembly/v0.21.2/assembly.min.css" rel="stylesheet">
      <script async defer src="https://api.mapbox.com/mapbox-assembly/v0.21.2/assembly.js"></script>
      ${renderCssLinks()}
    </head>
    <body>
      <div id="app"></div>
      ${renderJsBundles()}
    </body>
    </html>
  `;
};

module.exports = ({ webpack }) => {
  return {
    polyfills: {
      promise: true,
      fetch: true
    },
    siteBasePath: 'fancy',
    publicAssetsPath: 'cacheable-things',
    stylesheets: [
      path.join(__dirname, './src/bg.css'),
    ],
    htmlSource,
    clientEnvPrefix: 'UNDERREACT_APP_',
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
    webpackConfigTransform: config => {
      config.devtool = false;
      return config;
    },
    "browserslist": {
      "production": [
        "> 1%",
        "ie 10"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version"
      ]
    }
  };
};

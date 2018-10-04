'use strict';

const fs = require('fs');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');

const compact = require('../utils/compact-array');

module.exports = function webpackLoadersList(urc) {
  const babelConfig = createBabelLoader(urc);
  const publicAssetsPath = urc.publicAssetsPath.replace(/^\//, '');

  const jsLoader = {
    test: /\.jsx?$/,
    exclude: [/[/\\\\]node_modules[/\\\\]/],
    use: [babelConfig]
  };
  const fileLoader = {
    loader: require.resolve('file-loader'),
    exclude: [/\.(js|jsx)$/, /\.template$/, /\.json$/, /\.ejs$/],
    options: {
      name: `${publicAssetsPath}/media/[name].[hash:8].[ext]`
    }
  };
  const cssLoader = {
    test: /\.css$/,
    use: [
      urc.production
        ? MiniCssExtractPlugin.loader
        : require.resolve('style-loader'),
      { loader: require.resolve('css-loader'), options: { importLoaders: 1 } },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          ident: 'postcss',
          plugins: [
            autoprefixer({
              // TOFIX if a user is supplying browserslist via urc,
              // do we set an env var for everyone to read ?
              browsers: urc.browserslist && urc.browserslist[urc.mode]
            }),
            ...urc.postcssPlugins
          ]
        }
      }
    ]
  };

  return compact([jsLoader, cssLoader, ...urc.webpackLoaders, fileLoader]);
};

function createBabelLoader(urc) {
  const babelrcPath = path.join(urc.rootDirectory, '.babelrc');
  const exists = fs.existsSync(babelrcPath);
  const loader = {
    loader: require.resolve('babel-loader'),
    options: {
      presets: [require('../../packages/babel-preset-mapbox')],
      babelrc: false,
      compact: false,
      cacheDirectory: true,
      cacheCompression: urc.production,
      // `babel-preset-mapbox` depends on the `process.env.BROWSERSLIST` and
      // any change in its value would fail to change the default `cacheIdentifier` of `babel-loader`
      // hence leading to stale babel output. To mitigate this we need to create a more accurate `cacheIdentifier`
      // which is (`defaultCacheIdentifier` + `urc.browserslist`) ref: https://github.com/babel/babel-loader/blob/7.x/src/index.js#L129
      cacheIdentifier: JSON.stringify({
        'babel-loader': require('babel-loader/package.json').version,
        'babel-core': require('babel-core/package.json').version,
        babelrc: exists ? fs.readFileSync(babelrcPath, 'utf8') : '',
        env: process.env.BABEL_ENV || process.env.NODE_ENV || 'development',
        browserslist: urc.browserslist
      })
    }
  };

  if (exists) {
    delete loader.options.presets;
    loader.options.babelrc = true;
  }

  return loader;
}

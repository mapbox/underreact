'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const findupSync = require('findup-sync');
const AssetsPlugin = require('assets-webpack-plugin');
const resolvePkg = require('resolve-pkg');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');

const safeWebpackUglifier = require('../utils/safe-webpack-uglifier');
const { WEBPACK_ASSETS_BASENAME } = require('../constants');
const { generateTemplate } = require('./helpers');

module.exports = createWebpackConfig;

const compact = array => array.filter(Boolean);

const getWebpackPlugins = urc => {
  const publicAssetsPath = urc.publicAssetsPath.replace(/^\//, '');

  return compact([
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
        generateTemplate({
          urc,
          webpackCompilation: compilation,
          publicPath: htmlWebpackPlugin.files.publicPath
        })
    }),
    ...urc.webpackPlugins
  ]);
};

function createWebpackConfig(urc) {
  const jsEntryDir = path.dirname(urc.jsEntry);
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

  const sourceNodeModules = findupSync('node_modules', {
    cwd: jsEntryDir
  });

  const entry = {
    main: urc.jsEntry,
    polyfill: urc.polyfill,
    vendor: compact([
      resolvePkg('react', { cwd: jsEntryDir }),
      resolvePkg('react-dom', { cwd: jsEntryDir }),
      ...urc.vendorModules
    ])
  };

  // webpack complains if vendor is []
  if (entry.vendor.length === 0) {
    delete entry.vendor;
  }

  if (urc.polyfill === false) {
    delete entry.polyfill;
  }
  const config = {
    mode: urc.production ? 'production' : 'development',
    entry,
    output: {
      // TOFIX webpack is outputting runtime.js , we dont need it
      path: path.join(urc.outputDirectory),
      publicPath: path.join(urc.siteBasePath, '/'), // TOFIX clean up this patching (/) of siteBasePath and also publicAssetsApth
      filename: urc.production
        ? `${publicAssetsPath}/js/[name]-[chunkhash:10].js`
        : `${publicAssetsPath}/js/[name].js`,
      chunkFilename: urc.production
        ? `${publicAssetsPath}/js/[name]-[chunkhash:10].chunk.js`
        : `${publicAssetsPath}/js/[name].chunk.js`
    },
    resolve: {
      alias: {
        // This is added to make Underreact symlinking work with npm <=3,
        '@babel/runtime': path.dirname(
          require.resolve('@babel/runtime/package.json')
        )
      }
    },
    module: {
      // makes missing exports an error instead of warning
      strictExportPresence: false,
      rules: [
        {
          oneOf: compact([
            jsLoader,
            cssLoader,
            ...urc.webpackLoaders,
            fileLoader
          ])
        }
      ]
    },
    plugins: getWebpackPlugins(urc),
    // Loader names need to be strings, and to allow them to be looked
    // up within this module's nested dependencies, not just the user's
    // node_modules, we need this.
    resolveLoader: {
      modules: [sourceNodeModules, 'node_modules']
    },
    devtool: urc.production ? 'source-map' : 'cheap-module-source-map',
    optimization: {
      minimizer: [safeWebpackUglifier()],
      splitChunks: {
        cacheGroups: {
          // We're creating a vendor bundle with explicitly included
          // dependencies only (instead of all node_modules) so it's not in
          // danger of bloating to dangerous levels with the default setting.
          // Also if may save you from busting the vendor bundle's cache as
          // frequently as otherwise.
          vendor: {
            chunks: 'initial',
            name: 'vendor',
            test: 'vendor',
            enforce: true
          }
        }
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
    bail: urc.production,
    performance: false
  };
  return urc.webpackConfigTransform(config);
}

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

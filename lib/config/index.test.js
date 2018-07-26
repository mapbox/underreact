'use strict';

const path = require('path');

const getDefaultConfig = require('../default-underreact.config');
const createConfig = require('./');

test('normalizes empty configuration', () => {
  const defaultConfig = getDefaultConfig({
    production: undefined,
    stats: undefined,
    port: undefined,
    configDir: path.join(process.cwd(), 'underreact.config.js')
  });
  expect(createConfig({}, defaultConfig)).toMatchSnapshot();
});

test('normalizes fancy configuration', () => {
  const defaultConfig = getDefaultConfig({
    production: undefined,
    stats: undefined,
    port: undefined,
    configDir: path.join(process.cwd(), 'underreact.config.js')
  });
  expect(
    createConfig(
      {
        polyfills: {
          promise: true,
          fetch: true
        },
        siteBasePath: 'fancy',
        publicAssetsPath: 'cacheable-things',
        stylesheets: [path.join(__dirname, './src/bg.css')],
        htmlSource: path.join(__dirname, './src/index.html'),
        babelPlugins: ['/babel-plugin-lodash'],
        webpackLoaders: [
          {
            test: /\.less$/,
            use: ['css-loader', 'less-loader']
          }
        ],
        webpackPlugins: [function foo() {}],
        environmentVariables: ['ENV_VAR'],
        webpackConfigTransform: config => {
          config.devtool = false;
          return config;
        }
      },
      defaultConfig
    )
  ).toMatchSnapshot();
});

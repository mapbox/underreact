'use strict';

const normalizeConfig = require('./normalize-config');
const path = require('path');
const getDefaultConfig = require('./default-underreact.config');

test('normalizes empty configuration', () => {
  const defaultConfig = getDefaultConfig({
    production: undefined,
    stats: undefined,
    port: undefined,
    configDir: path.join(process.cwd(), 'underreact.config.js')
  });
  expect(normalizeConfig({}, defaultConfig)).toMatchSnapshot();
});

test('normalizes fancy configuration', () => {
  const defaultConfig = getDefaultConfig({
    production: undefined,
    stats: undefined,
    port: undefined,
    configDir: path.join(process.cwd(), 'underreact.config.js')
  });
  expect(
    normalizeConfig(
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

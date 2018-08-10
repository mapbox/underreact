'use strict';

const path = require('path');

const getDefaultConfig = require('../default-underreact.config');
const { CLIENT_ENV_PREFIX } = require('../constants');
const Urc = require('./urc');

const cliOpts = {
  mode: 'development',
  stats: undefined,
  port: undefined,
  configPath: path.join('/', 'fake-volume', 'underreact.config.js')
};

test('normalizes empty configuration', () => {
  const defaultConfig = getDefaultConfig(cliOpts);

  expect(new Urc({}, defaultConfig)).toMatchSnapshot();
});

test('normalizes fancy configuration', () => {
  const defaultConfig = getDefaultConfig(cliOpts);
  expect(
    new Urc(
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
        webpackConfigTransform: config => {
          config.devtool = false;
          return config;
        }
      },
      defaultConfig
    )
  ).toMatchSnapshot();
});

test('sets getClientEnvVars correctly', () => {
  const defaultConfig = getDefaultConfig(cliOpts);
  process.env.SECRET_TOKEN = 'secret';
  process.env[CLIENT_ENV_PREFIX + 'VISIBLE_TOKEN'] = 'visible';

  const clientEnv = new Urc({}, defaultConfig).getClientEnvVars();

  expect(clientEnv).not.toMatchObject({
    SECRET_TOKEN: 'secret'
  });
  expect(clientEnv).toMatchObject({
    [CLIENT_ENV_PREFIX + 'VISIBLE_TOKEN']: 'visible'
  });

  delete process.env.SECRET_TOKEN;
  delete process.env[CLIENT_ENV_PREFIX + 'VISIBLE_TOKEN'];
});

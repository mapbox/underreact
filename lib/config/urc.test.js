'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');

const setEnv = require('../utils/set-env');
const getDefaultConfig = require('../default-underreact.config');
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

test("getClientEnvVars doesn't leak internal vars", () => {
  // this var is internal and doesn't exist in the dotenv file
  process.env.INTERNAL_SECRET = 'hidden';

  const tempDir = tempy.directory();
  fs.writeFileSync(path.join(tempDir, '.env'), `VISIBLE_TOKEN=visible`);

  // we need to set this up here as urc.getClientEnvVars doesn't
  // mutate process.env, it only outputs what is already there in process.env
  setEnv(tempDir);

  const cliOpts = {
    mode: 'development',
    stats: undefined,
    port: undefined,
    configPath: path.join(tempDir, 'underreact.config.js')
  };

  const defaultConfig = getDefaultConfig(cliOpts);

  const clientEnv = new Urc({}, defaultConfig).getClientEnvVars();

  expect(clientEnv).toMatchSnapshot();

  expect(clientEnv).not.toHaveProperty('INTERNAL_SECRET');

  expect(clientEnv).toMatchObject({
    ['VISIBLE_TOKEN']: 'visible'
  });

  delete process.env.INTERNAL_SECRET;
  delete process.env['VISIBLE_TOKEN'];
});

test('getClientEnvVars only includes vars which start with urc.clientEnvPrefix ', () => {
  const tempDir = tempy.directory();
  fs.writeFileSync(
    path.join(tempDir, '.env'),
    `TOKEN=hidden
    MY_APP_TOKEN=visible`
  );
  setEnv(tempDir);

  const cliOpts = {
    mode: 'development',
    stats: undefined,
    port: undefined,
    configPath: path.join(tempDir, 'underreact.config.js')
  };

  const defaultConfig = getDefaultConfig(cliOpts);

  const clientEnv = new Urc(
    {
      clientEnvPrefix: 'MY_APP_'
    },
    defaultConfig
  ).getClientEnvVars();

  expect(clientEnv).toMatchSnapshot();

  expect(clientEnv).not.toHaveProperty('TOKEN');

  expect(clientEnv).toMatchObject({
    ['MY_APP_TOKEN']: 'visible'
  });

  delete process.env.TOKEN;
  delete process.env['MY_APP_TOKEN'];
});

test('getClientEnvVars reads from .env.test in test env', () => {
  const tempDir = tempy.directory();
  fs.writeFileSync(path.join(tempDir, '.env'), `MY_APP_TOKEN=first`);
  fs.writeFileSync(path.join(tempDir, '.env.test'), `MY_APP_TOKEN=second`);
  setEnv(tempDir);

  const cliOpts = {
    mode: 'development',
    stats: undefined,
    port: undefined,
    configPath: path.join(tempDir, 'underreact.config.js')
  };

  const defaultConfig = getDefaultConfig(cliOpts);

  const clientEnv = new Urc({}, defaultConfig).getClientEnvVars();

  expect(clientEnv).toMatchObject({
    MY_APP_TOKEN: 'second'
  });

  delete process.env['MY_APP_TOKEN'];
});

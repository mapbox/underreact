'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');

const setEnv = require('../utils/set-env');
const getDefaultConfig = require('../default-underreact.config');
const Urc = require('./urc');

test('Urc is correctly initialized when command=build and mode=development', () => {
  const cliOpts = {
    command: 'build',
    mode: 'development',
    configPath: path.join('/', 'fake-volume', 'underreact.config.js')
  };

  const defaultConfig = getDefaultConfig(cliOpts);
  expect(new Urc({}, defaultConfig, cliOpts)).toMatchSnapshot();
});

test('Urc is correctly initialized when command=build and mode=production', () => {
  const cliOpts = {
    command: 'build',
    mode: 'production',
    configPath: path.join('/', 'fake-volume', 'underreact.config.js')
  };
  const defaultConfig = getDefaultConfig(cliOpts);

  expect(new Urc({}, defaultConfig, cliOpts)).toMatchSnapshot();
});

test('Urc is correctly initialized when command=start and mode=development', () => {
  const cliOpts = {
    command: 'start',
    mode: 'development',
    configPath: path.join('/', 'fake-volume', 'underreact.config.js')
  };

  const defaultConfig = getDefaultConfig(cliOpts);
  expect(new Urc({}, defaultConfig, cliOpts)).toMatchSnapshot();
});

test('Urc is correctly initialized when command=start and mode=production', () => {
  const cliOpts = {
    command: 'start',
    mode: 'production',
    configPath: path.join('/', 'fake-volume', 'underreact.config.js')
  };
  const defaultConfig = getDefaultConfig(cliOpts);

  expect(new Urc({}, defaultConfig, cliOpts)).toMatchSnapshot();
});

test("Doesn't hot reload when command is build ", () => {
  const cliOpts = {
    command: 'build',
    mode: 'development',
    configPath: path.join('/', 'fake-volume', 'underreact.config.js')
  };
  const defaultConfig = getDefaultConfig(cliOpts);

  expect(new Urc({ hot: true }, defaultConfig, cliOpts).hot).toBe(false);
});

test('Live reload is off when mode is production ', () => {
  const cliOpts = {
    command: 'build',
    mode: 'production',
    configPath: path.join('/', 'fake-volume', 'underreact.config.js')
  };
  const defaultConfig = getDefaultConfig(cliOpts);

  expect(new Urc({}, defaultConfig, cliOpts).liveReload).toBe(false);
});

test('normalizes fancy configuration', () => {
  const cliOpts = {
    command: 'build',
    mode: 'development',
    configPath: path.join('/', 'fake-volume', 'underreact.config.js')
  };
  const defaultConfig = getDefaultConfig(cliOpts);
  expect(
    new Urc(
      {
        siteBasePath: 'fancy',
        publicAssetsPath: 'cacheable-things',
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
      defaultConfig,
      cliOpts
    )
  ).toMatchSnapshot();
});

test('setting urc.polyfill to false removes polyfill entry', () => {
  const cliOpts = {
    command: 'build',
    mode: 'development',
    configPath: path.join('/', 'fake-volume', 'underreact.config.js')
  };
  const defaultConfig = getDefaultConfig(cliOpts);
  expect(
    new Urc(
      {
        polyfill: false
      },
      defaultConfig,
      cliOpts
    ).polyfill
  ).toBe(false);
});

test('not setting polyfill fallbacks to default path', () => {
  const cliOpts = {
    command: 'build',
    mode: 'development',
    configPath: path.join('/', 'fake-volume', 'underreact.config.js')
  };
  const defaultConfig = getDefaultConfig(cliOpts);
  expect(new Urc({}, defaultConfig, cliOpts).polyfill).toMatchSnapshot();
});

test("readClientEnvVars doesn't leak internal vars", () => {
  // this var is internal and doesn't exist in the dotenv file
  process.env.INTERNAL_SECRET = 'hidden';

  const tempDir = tempy.directory();
  fs.writeFileSync(path.join(tempDir, '.env'), `VISIBLE_TOKEN=visible`);

  // we need to set this up here as urc.readClientEnvVars doesn't
  // mutate process.env, it only outputs what is already there in process.env
  setEnv(tempDir);

  const cliOpts = {
    mode: 'development',
    stats: undefined,
    port: undefined,
    configPath: path.join(tempDir, 'underreact.config.js')
  };

  const defaultConfig = getDefaultConfig(cliOpts);

  const clientEnv = new Urc({}, defaultConfig, cliOpts).readClientEnvVars();

  expect(clientEnv).toMatchSnapshot();

  expect(clientEnv).not.toHaveProperty('INTERNAL_SECRET');

  expect(clientEnv).toMatchObject({
    ['VISIBLE_TOKEN']: 'visible'
  });

  delete process.env.INTERNAL_SECRET;
  delete process.env['VISIBLE_TOKEN'];
});

test('readClientEnvVars only includes vars which start with urc.clientEnvPrefix ', () => {
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
    defaultConfig,
    cliOpts
  ).readClientEnvVars();

  expect(clientEnv).toMatchSnapshot();

  expect(clientEnv).not.toHaveProperty('TOKEN');

  expect(clientEnv).toMatchObject({
    ['MY_APP_TOKEN']: 'visible'
  });

  delete process.env.TOKEN;
  delete process.env['MY_APP_TOKEN'];
});

test('readClientEnvVars reads from .env.test in test env', () => {
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

  const clientEnv = new Urc({}, defaultConfig, cliOpts).readClientEnvVars();

  expect(clientEnv).toMatchObject({
    MY_APP_TOKEN: 'second'
  });

  delete process.env['MY_APP_TOKEN'];
});

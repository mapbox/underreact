'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');

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

test('reads environment variables', () => {
  const tempDir = tempy.directory();
  const cliOpts = {
    mode: 'development',
    stats: undefined,
    port: undefined,
    configPath: path.join(tempDir, 'underreact.config.js')
  };

  const defaultConfig = getDefaultConfig(cliOpts);

  const clientEnv = new Urc(
    {
      environmentVariables: {
        MY_ENV_1: 1,
        MY_ENV_2: 2
      }
    },
    defaultConfig,
    cliOpts
  ).readClientEnvVars();

  expect(clientEnv).toMatchSnapshot();
});

test('throws an error if setting DEPLOY_ENV', () => {
  const tempDir = tempy.directory();
  const cliOpts = {
    mode: 'development',
    stats: undefined,
    port: undefined,
    configPath: path.join(tempDir, 'underreact.config.js')
  };

  const defaultConfig = getDefaultConfig(cliOpts);

  const urc = new Urc(
    {
      environmentVariables: {
        DEPLOY_ENV: 1,
        MY_ENV_2: 2
      }
    },
    defaultConfig,
    cliOpts
  );

  expect(() => urc.readClientEnvVars()).toThrowErrorMatchingInlineSnapshot(
    `"DEPLOY_ENV can not be set in your Underreact configuration. Please set it directly in your shell."`
  );
});

test("doesn't set default browserslist if user is using external config", () => {
  const tempDir = tempy.directory();
  fs.writeFileSync(path.join(tempDir, '.browserslistrc'), `chrome 67`);

  const cliOpts = {
    mode: 'development',
    stats: undefined,
    port: undefined,
    configPath: path.join(tempDir, 'underreact.config.js')
  };

  const defaultConfig = getDefaultConfig(cliOpts);

  const urc = new Urc({}, defaultConfig, cliOpts);

  expect(urc.browserslist).toBeUndefined();
});

'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');

jest.mock('../config/get-user-config');

const getUserConfig = require('../config/get-user-config');
const config = require('../config');
const createWebpackConfig = require('./create-webpack-config');

const getCliOpts = ({
  command = 'build',
  mode = 'development',
  configPath = path.join(process.cwd(), 'underreact.config.js')
} = {}) => ({
  command,
  mode,
  configPath
});

test('Basic Test', () => {
  getUserConfig.mockResolvedValueOnce({
    siteBasePath: 'fancy',
    publicAssetsPath: 'cacheable-things',
    htmlSource: () => {
      return `<html></html>`;
    },
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
  });

  const urcPromise = config(getCliOpts());

  return expect(
    urcPromise.then(urc => createWebpackConfig(urc))
  ).resolves.toMatchSnapshot();
});

test('Uses babelrc if it exists at project root', () => {
  getUserConfig.mockResolvedValueOnce({});
  const tempDir = tempy.directory();
  const urcPromise = config(
    getCliOpts({
      configPath: path.join(tempDir, 'underreact.config.js')
    })
  );

  fs.writeFileSync(path.join(tempDir, '.babelrc'), `{}`);

  return urcPromise.then(urc => {
    expect(
      createWebpackConfig(urc).module.rules[0].oneOf.find(
        obj => obj.test.toString() === `/\\.jsx?$/`
      ).use
    ).toMatchObject([
      {
        loader: require.resolve('babel-loader'),
        options: {
          cacheDirectory: true,
          babelrc: true,
          compact: false
        }
      }
    ]);
  });
});

test('Uses babel preset if babelrc doesnt exists at project root', () => {
  getUserConfig.mockResolvedValueOnce({});
  const tempDir = tempy.directory();
  const urcPromise = config(
    getCliOpts({
      configPath: path.join(tempDir, 'underreact.config.js')
    })
  );
  return urcPromise.then(urc => {
    expect(
      createWebpackConfig(urc).module.rules[0].oneOf.find(
        obj => obj.test.toString() === `/\\.jsx?$/`
      ).use
    ).toMatchObject([
      {
        loader: require.resolve('babel-loader'),
        options: {
          presets: [require('../../packages/babel-preset-mapbox')],
          cacheDirectory: true,
          babelrc: false,
          compact: false
        }
      }
    ]);
  });
});

test('babel-loader creates a good cacheIdentifier which includes urc.browserslist', () => {
  const browserslist = 'last 2 versions';
  getUserConfig.mockResolvedValueOnce({ browserslist: [browserslist] });

  const urcPromise = config(
    getCliOpts({
      configPath: '/fake/underreact.config.js'
    })
  );

  return urcPromise.then(urc => {
    expect(
      createWebpackConfig(urc).module.rules[0].oneOf.find(
        obj => obj.test.toString() === `/\\.jsx?$/`
      ).use
    ).toMatchObject([
      {
        loader: require.resolve('babel-loader'),
        options: {
          cacheDirectory: true,
          babelrc: false,
          compact: false,
          cacheIdentifier: expect.stringMatching(browserslist)
        }
      }
    ]);
  });
});

test('config transform works', () => {
  getUserConfig.mockResolvedValueOnce({
    webpackConfigTransform: obj =>
      Object.assign({ injectedObj: 'injectedObj' }, obj)
  });

  const urcPromise = config(
    getCliOpts({
      configPath: path.join(process.cwd(), 'underreact.config.js')
    })
  );
  return urcPromise.then(urc => {
    expect(createWebpackConfig(urc)).toMatchObject({
      injectedObj: 'injectedObj'
    });
  });
});

test("Doesn't set polyfill entry when urc.polyfill is false", () => {
  getUserConfig.mockResolvedValueOnce({
    polyfill: false
  });

  const urcPromise = config(
    getCliOpts({
      configPath: path.join(process.cwd(), 'underreact.config.js')
    })
  );
  return urcPromise.then(urc => {
    expect(createWebpackConfig(urc).entry.polyfill).toBe(undefined);
  });
});

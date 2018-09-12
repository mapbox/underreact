'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');

const getDefaultConfig = require('../default-underreact.config');
const Urc = require('../config/urc');
const createConfig = require('./create-webpack-config');

test('Basic Test', () => {
  const defaultConfig = getDefaultConfig({
    mode: 'development',
    configPath: path.join(process.cwd(), 'underreact.config.js')
  });

  const urc = new Urc(
    {
      polyfills: {
        promise: true,
        fetch: true
      },
      siteBasePath: 'fancy',
      publicAssetsPath: 'cacheable-things',
      stylesheets: [path.join(__dirname, './src/bg.css')],
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
    },
    defaultConfig
  );
  expect(createConfig(urc)).toMatchSnapshot();
});

test('Uses babelrc if it exists at project root', () => {
  const tempDir = tempy.directory();
  const defaultConfig = getDefaultConfig({
    mode: 'development',
    configPath: path.join(tempDir, 'underreact.config.js')
  });
  const urc = new Urc({}, defaultConfig);

  fs.writeFileSync(path.join(tempDir, '.babelrc'), `{}`);
  expect(
    createConfig(urc).module.rules.find(
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

test('Uses babel preset if babelrc doesnt exists at project root', () => {
  const tempDir = tempy.directory();
  const defaultConfig = getDefaultConfig({
    mode: 'development',
    configPath: path.join(tempDir, 'underreact.config.js')
  });
  const urc = new Urc({}, defaultConfig);

  expect(
    createConfig(urc).module.rules.find(
      obj => obj.test.toString() === `/\\.jsx?$/`
    ).use
  ).toMatchObject([
    {
      loader: require.resolve('babel-loader'),
      options: {
        presets: [require.resolve('../../packages/babel-preset-mapbox')],
        cacheDirectory: true,
        babelrc: false,
        compact: false
      }
    }
  ]);
});

test('babel-loader creates a good cacheIdentifier which includes urc.browserslist', () => {
  const defaultConfig = getDefaultConfig({
    mode: 'development',
    configPath: '/fake/underreact.config.js'
  });

  const browserslist = 'last 2 versions';
  const urc = new Urc({ browserslist: [browserslist] }, defaultConfig);

  expect(
    createConfig(urc).module.rules.find(
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

test('config transform works', () => {
  const defaultConfig = getDefaultConfig({
    mode: 'development',
    configPath: path.join(process.cwd(), 'underreact.config.js')
  });
  const urc = new Urc(
    {
      webpackConfigTransform: obj =>
        Object.assign({ injectedObj: 'injectedObj' }, obj)
    },
    defaultConfig
  );
  expect(createConfig(urc)).toMatchObject({
    injectedObj: 'injectedObj'
  });
});

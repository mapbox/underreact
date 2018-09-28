'use strict';
const babel = require('@babel/core');

const { babelPresetMapbox: preset } = require('./index.js');

const transform = (code, options) => {
  return babel.transformSync(code, {
    presets: [[require('./index.js'), options]],
    // This is needed by 'babel/plugin-react'
    filename: 'test'
  }).code;
};

afterEach(() => {
  delete process.env.BABEL_ENV;
  delete process.env.BROWSERSLIST;
});

test('Right order of configuration in production', () => {
  process.env.BABEL_ENV = 'production';
  expect(preset()).toMatchSnapshot();
});

test('Right order of configuration in development', () => {
  process.env.BABEL_ENV = 'development';
  expect(preset()).toMatchSnapshot();
});

test('Right order of configuration in test', () => {
  process.env.BABEL_ENV = 'test';
  expect(preset()).toMatchSnapshot();
});

test('Passes opts correctly', () => {
  const config = preset(null, {
    '@babel/preset-react': {
      abc: 'def',
      useBuiltIns: false
    },
    'non-existent': {
      a: 'a'
    },
    'babel-plugin-transform-dynamic-import': { xyz: '123' }
  });

  expect(config.presets).toContainEqual([
    '@babel/preset-react',
    {
      abc: 'def',
      development: true,
      useBuiltIns: false
    }
  ]);

  expect(config.plugins).toContainEqual([
    'babel-plugin-transform-dynamic-import',
    {
      xyz: '123'
    }
  ]);
});

test('Does not mess with a plugin which is not to be loaded', () => {
  process.env.BABEL_ENV = 'development';
  const config = preset(null, {
    'babel-plugin-transform-dynamic-import': { xyz: '123' }
  });

  expect(
    config.plugins.find(p => p[0] === 'babel-plugin-transform-dynamic-import')
  ).toBeUndefined();
});

test('BROWSERSLIST env var works in non test env ', () => {
  process.env.BABEL_ENV = 'development';
  process.env.BROWSERSLIST = ['>0.25%', 'not ie 11', 'not op_mini all'].join(
    ','
  );
  const config = preset(null);
  expect(config.presets).toMatchSnapshot();
});

test('Throws error when both BROWSERSLIST and babel/preset-env are provided ', () => {
  process.env.BROWSERSLIST = 'something';
  expect(() =>
    preset(null, {
      '@babel/preset-env': {}
    })
  ).toThrowError();
});

test('BROWSERSLIST works when importing babel polyfill ', () => {
  process.env.BABEL_ENV = 'development';
  process.env.BROWSERSLIST = ['chrome 57'].join(',');
  expect(
    transform(`
        import '@babel/polyfill'
    `)
  ).toMatchSnapshot();
});

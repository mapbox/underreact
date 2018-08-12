'use strict';

const babel = require('babel-core');

const preset = require('./index.js');

const transform = (code, options) =>
  babel.transform(code, {
    presets: [[require.resolve('./index.js'), options]],
    // This is needed 'babel-plugin-transform-react-jsx-source' throws an error without a filename
    filename: 'test'
  }).code;

test('Right order of configuration in production', () => {
  process.env.BABEL_ENV = 'production';
  expect(preset()).toMatchSnapshot();
  delete process.env.BABEL_ENV;
});

test('Right order of configuration in development', () => {
  process.env.BABEL_ENV = 'development';
  expect(preset()).toMatchSnapshot();
  delete process.env.BABEL_ENV;
});

test('Right order of configuration in test', () => {
  process.env.BABEL_ENV = 'test';
  expect(preset()).toMatchSnapshot();
  delete process.env.BABEL_ENV;
});

test('Passes opts correctly', () => {
  const config = preset(null, {
    'babel-preset-react': {
      abc: 'def'
    },
    'non-existent': {
      a: 'a'
    },
    'transform-class-properties': { xyz: '123' }
  });
  expect(config.presets).toContainEqual([
    'babel-preset-react',
    {
      abc: 'def'
    }
  ]);
  expect(config.plugins).toContainEqual([
    'babel-plugin-transform-class-properties',
    {
      xyz: '123'
    }
  ]);
  expect(config).toMatchSnapshot();
});

test('browserslist property works in non test env ', () => {
  process.env.BABEL_ENV = 'development';
  const config = preset(null, {
    browserslist: ['>0.25%', 'not ie 11', 'not op_mini all']
  });
  expect(config.presets).toMatchSnapshot();
  delete process.env.BABEL_ENV;
});

test('Throws error when both browserslist and env are provided ', () => {
  expect(() =>
    preset(null, {
      browserslist: ['>0.25%', 'not ie 11', 'not op_mini all'],
      'babel-preset-env': {}
    })
  ).toThrowError();
});

test('Browserslist doesnt get injected in test env ', () => {
  const config = preset(null, {
    browserslist: ['>0.25%', 'not ie 11', 'not op_mini all']
  });
  expect(config.presets).toMatchSnapshot();
});

test('Works with React', () => {
  expect(
    transform(`
        import React from 'react';
        const F = () => <Zoo/>;
    `)
  ).toMatchSnapshot();
});

test('Throws error when incorrect options are provided', () => {
  expect(() => transform(``, 45)).toThrowErrorMatchingSnapshot();
});

test('Applies options correctly to internal plugins and presets', () => {
  expect(
    transform(`const F = () => <Zoo/>;`, {
      'transform-react-jsx': {
        pragma: 'dom'
      }
    })
  ).toMatchSnapshot();
});

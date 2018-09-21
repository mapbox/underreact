'use strict';

const dynamicRequireMock = jest.fn();
jest.mock('../utils/dynamic-require', () => {
  return dynamicRequireMock;
});

const Assets = require('../assets');

test('Loads webpack assets correctly', () => {
  const webpackAssets = {};
  dynamicRequireMock.mockReturnValueOnce(webpackAssets);
  const assets = new Assets({
    urc: {},
    cssOutput: 'fake-css/output.css',
    webpackAssets: 'fake-webpack-assets/file.json'
  });

  expect(assets.webpack).toBe(webpackAssets);
  expect(dynamicRequireMock).toBeCalledWith({
    absolutePath: 'fake-webpack-assets/file.json',
    deleteCache: true
  });
});

test('Returns main stylesheet path correctly', () => {
  const assets = new Assets({
    urc: {
      outputDirectory: '/my/fake/output/',
      siteBasePath: 'bar'
    },
    cssOutput: '/my/fake/output/style.css'
  });

  expect(assets.mainStylesheet).toBe('bar/style.css');
});

test('Returns all css path correctly', () => {
  const webpackAssets = {
    main: {
      css: ['bar/foo-1.css', undefined, 'bar/foo-2.css']
    }
  };
  dynamicRequireMock.mockReturnValueOnce(webpackAssets);
  const assets = new Assets({
    urc: {
      outputDirectory: '/my/fake/output/',
      siteBasePath: 'bar'
    },
    cssOutput: '/my/fake/output/deep/style.css',
    webpackAssets: 'fake-webpack-assets/file.json'
  });

  expect(assets.css).toEqual([
    'bar/deep/style.css',
    'bar/foo-1.css',
    'bar/foo-2.css'
  ]);
});

describe('absolutePathToRelativeUrl', () => {
  test('handles when there is no absolute path', () => {
    const assets = new Assets({
      urc: {
        outputDirectory: '/my/fake/output/',
        siteBasePath: 'bar'
      },
      cssOutput: '/my/fake/output/style.css'
    });
    expect(assets.absolutePathToRelativeUrl()).toBeUndefined();
  });
  test('handles an array', () => {
    const assets = new Assets({
      urc: {
        outputDirectory: '/my/fake/',
        siteBasePath: 'bar'
      },
      cssOutput: '/my/fake/output/style.css'
    });
    expect(
      assets.absolutePathToRelativeUrl([
        '/my/fake/path/1.js',
        '/my/fake/2.js',
        '/my/fake/path/very/long/3.js'
      ])
    ).toMatchInlineSnapshot(`
Array [
  "bar/path/1.js",
  "bar/2.js",
  "bar/path/very/long/3.js",
]
`);
  });

  test('handles a single path', () => {
    const assets = new Assets({
      urc: {
        outputDirectory: '/my/fake/output/',
        siteBasePath: 'bar'
      },
      cssOutput: '/my/fake/output/style.css'
    });

    expect(assets.absolutePathToRelativeUrl('/my/fake/output/style.css')).toBe(
      'bar/style.css'
    );
  });
});

describe('relativeUrlToAbsolutePath', () => {
  test('handles when there is no relative path', () => {
    const assets = new Assets({
      urc: {
        outputDirectory: '/my/fake/output/',
        siteBasePath: 'bar'
      },
      cssOutput: '/my/fake/output/style.css'
    });
    expect(assets.relativeUrlToAbsolutePath()).toBeUndefined();
  });
  test('handles an array', () => {
    const assets = new Assets({
      urc: {
        outputDirectory: '/my/fake/',
        siteBasePath: 'bar'
      },
      cssOutput: '/my/fake/output/style.css'
    });
    expect(
      assets.relativeUrlToAbsolutePath([
        'bar/path/1.js',
        'bar/2.js',
        'bar/path/very/long/3.js'
      ])
    ).toMatchInlineSnapshot(`
Array [
  "/my/fake/path/1.js",
  "/my/fake/2.js",
  "/my/fake/path/very/long/3.js",
]
`);
  });

  test('handles a single path', () => {
    const assets = new Assets({
      urc: {
        outputDirectory: '/my/fake/output/',
        siteBasePath: 'bar'
      },
      cssOutput: '/my/fake/output/style.css'
    });

    expect(assets.relativeUrlToAbsolutePath('bar/style.css')).toBe(
      '/my/fake/output/style.css'
    );
  });
});

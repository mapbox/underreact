'use strict';

const concatToFileMock = jest.fn();
const autoprefixerMock = jest.fn();

jest.mock('../../packages/postcss-concatenator', () => ({
  concatToFile: concatToFileMock
}));

jest.mock('autoprefixer', () => {
  return autoprefixerMock;
});

const { writeCss } = require('../css-compiler');

test('output depends on compilation in production', () => {
  const urc = {
    stylesheets: ['/foo/mystylesheet'],
    production: true,
    publicAssetsPath: 'fake-assets',
    outputDirectory: 'fake-output',
    postcssPlugins: ['fake-plugin'],
    getBrowserslist: () => 'fake-browserslist'
  };
  concatToFileMock.mockResolvedValueOnce('mock-value');
  const { output, compilation } = writeCss(urc);

  expect(output).toBe(compilation);
  return expect(output).resolves.toEqual('mock-value');
});

test('output is resolved independent of compilation in development', () => {
  const urc = {
    stylesheets: ['/foo/mystylesheet'],
    production: false,
    publicAssetsPath: 'fake-assets',
    outputDirectory: 'fake-output',
    postcssPlugins: ['fake-plugin'],
    getBrowserslist: () => 'fake-browserslist'
  };

  concatToFileMock.mockResolvedValueOnce('mock-value');

  const { output, compilation } = writeCss(urc);

  expect(output).not.toBe(compilation);
  return expect(output).resolves.toEqual(
    'fake-output/fake-assets/underreact-styles.css'
  );
});

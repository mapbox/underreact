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

test('css compiler works correctly', () => {
  const urc = {
    stylesheets: ['/foo/mystylesheet'],
    production: false,
    publicAssetsPath: 'fake-assets',
    outputDirectory: 'fake-output',
    postcssPlugins: ['fake-plugin'],
    getBrowserslist: () => 'fake-browserslist'
  };

  concatToFileMock.mockResolvedValueOnce(
    'fake-output/fake-assets/underreact-styles.css'
  );

  const compilation = writeCss(urc);
  return expect(compilation).resolves.toEqual(
    'fake-output/fake-assets/underreact-styles.css'
  );
});

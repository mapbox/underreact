'use strict';
const tempy = require('tempy');
const path = require('path');
const fs = require('fs');

jest.mock('uglify-js', () => ({
  minify: jest.fn()
}));

const minifyMock = require('uglify-js').minify;

const { htmlCompiler, jsBundles, polyfill } = require('../html-compiler');

test('jsBundles outputs correct script tags', () => {
  const tempDir = tempy.directory();
  fs.writeFileSync(path.join(tempDir, 'vendor-123.js'), 'VENDOR');

  const assets = {
    relativeUrlToAbsolutePath: () => path.join(tempDir, 'vendor-123.js'),
    webpack: {
      main: {
        js: '/fakepath/main-123.js'
      },
      vendor: {
        js: '/fakepath/vendor-123.js'
      },
      runtime: {
        js: '/fakepath/runtime-123.js'
      }
    }
  };
  minifyMock.mockReturnValueOnce({ code: 'uglified' });
  expect(jsBundles(assets)()).toMatchSnapshot();

  expect(minifyMock).toBeCalledWith('VENDOR');
});

test('polyfill works correctly when polyfill is switched on', () => {
  const urc = {
    modernBrowserTest: 'true'
  };
  const assets = {
    webpack: {
      polyfill: {
        js: '/fakepath/polyfill-123.js'
      }
    }
  };
  expect(polyfill(urc, assets)()).toMatchSnapshot();
});
test('polyfill works correctly when polyfill is switched off', () => {
  const urc = {
    modernBrowserTest: 'true'
  };
  const assets = {
    webpack: {}
  };
  expect(polyfill(urc, assets)()).toBe('');
});

describe('htmlCompiler', () => {
  let urc;
  let tempDir;
  let assets;
  beforeEach(() => {
    tempDir = tempy.directory();
    fs.writeFileSync(path.join(tempDir, 'vendor-123.js'), 'VENDOR');
    assets = {
      relativeUrlToAbsolutePath: () => path.join(tempDir, 'vendor-123.js'),
      webpack: {
        main: {
          js: '/fakepath/main-123.js'
        },
        vendor: {
          js: '/fakepath/vendor-123.js'
        },
        polyfill: {
          js: '/fakepath/polyfill-123.js'
        },
        runtime: {
          js: '/fakepath/runtime-123.js'
        }
      },
      css: ['/fakepath/style-1.css', '/fakepath/style-2.css']
    };
    urc = {
      modernBrowserTest: 'true',
      outputDirectory: tempDir,
      htmlSource: jest.fn()
    };
    minifyMock.mockReturnValueOnce({ code: 'uglified' });
  });
  test('renderCssLinks renders correct html', () => {
    return htmlCompiler(urc)(assets).then(() => {
      expect(urc.htmlSource).toHaveBeenCalledTimes(1);
      const { renderCssLinks } = urc.htmlSource.mock.calls[0][0];
      expect(renderCssLinks()).toMatchSnapshot();
    });
  });
  test('renderJsBundles renders correct html', () => {
    return htmlCompiler(urc)(assets).then(() => {
      expect(urc.htmlSource).toHaveBeenCalledTimes(1);
      const { renderJsBundles } = urc.htmlSource.mock.calls[0][0];
      expect(renderJsBundles()).toMatchSnapshot();
    });
  });
  test('polyfillScript renders correct html', () => {
    return htmlCompiler(urc)(assets).then(() => {
      expect(urc.htmlSource).toHaveBeenCalledTimes(1);
      const { polyfillScript } = urc.htmlSource.mock.calls[0][0];
      expect(polyfillScript()).toMatchSnapshot();
    });
  });
});

'use strict';

const v = require('@mapbox/fusspot');
const path = require('path');

module.exports = validateConfig;

function validateConfig(rawConfig = {}) {
  try {
    v.assert(
      v.strictShape({
        browserslist: v.oneOfType(v.plainObject, v.arrayOf(v.string)),
        compileNodeModules: v.oneOfType(v.boolean, v.arrayOf(v.string)),
        devServerHistoryFallback: v.boolean,
        host: v.string,
        hot: v.boolean,
        htmlSource: v.oneOfType(validatePromise, v.string, v.func),
        jsEntry: validateAbsolutePaths,
        liveReload: v.boolean,
        environmentVariables: v.plainObject,
        modernBrowserTest: v.string,
        outputDirectory: validateAbsolutePaths,
        polyfill: v.boolean,
        port: v.number,
        postcssPlugins: v.arrayOf(v.func),
        publicAssetsPath: v.string,
        publicDirectory: v.string,
        siteBasePath: validateBasePath,
        stats: v.string,
        vendorModules: v.arrayOf(v.string),
        webpackConfigTransform: v.func,
        webpackLoaders: v.arrayOf(v.plainObject),
        webpackPlugins: v.arrayOf(v.any)
      })
    )(rawConfig);
  } catch (error) {
    error.message = `Invalid Underreact configuration. ${error.message}`;
    throw error;
  }
}

// Custom fusspot validator.
function validateAbsolutePaths(value) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) {
    return 'absolute path';
  }
}

function validateBasePath(value) {
  if (typeof value !== 'string' || value === '') {
    return 'non-empty string';
  }
}

function validatePromise(value) {
  if (Promise.resolve(value) !== value) {
    return 'promise';
  }
}

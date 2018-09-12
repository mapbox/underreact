'use strict';

const v = require('@mapbox/fusspot');
const path = require('path');

module.exports = validateConfig;

function validateConfig(rawConfig = {}) {
  try {
    v.assert(
      v.strictShape({
        browserslist: v.oneOfType(v.plainObject, v.arrayOf(v.string)),
        clientEnvPrefix: v.string,
        devServerHistoryFallback: v.boolean,
        htmlSource: v.func,
        jsEntry: validateAbsolutePaths,
        outputDirectory: validateAbsolutePaths,
        polyfills: v.strictShape({
          objectAssign: v.boolean,
          promise: v.boolean,
          fetch: v.boolean
        }),
        port: v.number,
        postcssPlugins: v.arrayOf(v.func),
        publicAssetsPath: v.string,
        publicDirectory: v.string,
        siteBasePath: v.string,
        stats: v.string,
        stylesheets: v.arrayOf(validateAbsolutePaths),
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

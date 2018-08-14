'use strict';

const v = require('@mapbox/fusspot');
const path = require('path');

module.exports = validateConfig;

function validateConfig(rawConfig = {}) {
  try {
    v.assert(
      v.strictShape({
        siteBasePath: v.string,
        stylesheets: v.arrayOf(v.string),
        vendorModules: v.arrayOf(v.string),
        postcssPlugins: v.arrayOf(v.func),
        port: v.number,
        publicAssetsPath: v.string,
        devServerHistoryFallback: v.boolean,
        babelPlugins: v.arrayOf(validateAbsolutePaths),
        babelPresets: v.arrayOf(validateAbsolutePaths),
        webpackLoaders: v.arrayOf(v.plainObject),
        webpackPlugins: v.arrayOf(v.any),
        webpackConfigTransform: v.func,
        outputDirectory: v.string,
        publicDirectory: v.string,
        jsEntry: v.string,
        htmlSource: v.string,
        polyfills: v.strictShape({
          objectAssign: v.boolean,
          promise: v.boolean,
          fetch: v.boolean
        }),
        stats: v.string,
        clientEnvPrefix: v.string,
        browserslist: v.oneOf(v.arrayOf(v.string), v.plainObject)
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

'use strict';

const path = require('path');
const v = require('@mapbox/fusspot');
const _ = require('lodash');
const { WEBPACK_ASSETS_BASENAME } = require('./constants');
const fs = require('fs');

module.exports = createUrc;

class Urc {
  constructor(rawConfig = {}, defaultConfig) {
    validateConfig(rawConfig);
    const urc = _.merge({}, defaultConfig, rawConfig);
    // Normalize URL parts.
    if (urc.siteBasePath && urc.siteBasePath !== '/') {
      urc.siteBasePath = urc.siteBasePath.replace(/\/$/, '');
      if (!urc.siteBasePath.startsWith('/')) {
        urc.siteBasePath = '/' + urc.siteBasePath;
      }
    }
    if (!urc.publicAssetsPath.startsWith('/')) {
      urc.publicAssetsPath = '/' + urc.publicAssetsPath;
    }
    Object.assign(this, urc);
  }

  getAssets() {
    delete require.cache[
      require.resolve(path.join(this.outputDirectory, WEBPACK_ASSETS_BASENAME))
    ];

    return require(path.join(this.outputDirectory, WEBPACK_ASSETS_BASENAME));
  }

  getHtmlSourceFn() {
    // TODO: should throw an error if user provided
    // a file which doesn't exist. Can be a custom validator
    const htmlSource = fs.existsSync(this.htmlSource)
      ? this.htmlSource
      : path.join(__dirname, './default-html.js');

    delete require.cache[require.resolve(htmlSource)];
    const htmlFn = require(htmlSource);
    return htmlFn;
  }
}

function createUrc(rawConfig = {}, defaultConfig) {
  return new Urc(rawConfig, defaultConfig);
}

function validateConfig(rawConfig = {}) {
  try {
    v.assert(
      v.strictShape({
        siteBasePath: v.string,
        stylesheets: v.arrayOf(v.string),
        vendorModules: v.arrayOf(v.string),
        environmentVariables: v.arrayOf(v.string),
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
        production: v.boolean,
        stats: v.string
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

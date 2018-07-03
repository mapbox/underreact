'use strict';

const path = require('path');
const v = require('@mapbox/fusspot');

function normalizeConfig(rawConfig = {}, configDir) {
  const defaults = {
    siteBasePath: '',
    stylesheets: [],
    vendorModules: [],
    environmentVariables: [],
    postcssPlugins: [],
    devServerHistoryFallback: false,
    port: 8080,
    publicAssetsPath: 'underreact-assets',
    browserslist: ['defaults'],
    babelPresets: [],
    babelPlugins: [],
    webpackLoaders: [],
    webpackPlugins: [],
    webpackConfigTransform: x => x
    // `outputDirectory` defaulted below.
    // `publicDirectory` defaulted below.
    // `jsEntry` defaulted below.
    // `htmlSource` defaulted below.
    // `polyfills` defaulted below.
    // `production` set by the CLI.
    // `stats` set by the CLI.
  };

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
        browserslist: v.oneOf(v.string, v.arrayOf(v.string)),
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

  const defaultPolyfills = {
    objectAssign: false,
    promise: false,
    fetch: false
  };

  const urc = Object.assign({}, defaults, rawConfig, {
    polyfills: Object.assign({}, defaultPolyfills, rawConfig.polyfills)
  });

  urc.rootDirectory = configDir;

  // Add defaults that depend on the rootDirectory.
  setDefault(
    urc,
    'outputDirectory',
    path.join(urc.rootDirectory, '_underreact-site')
  );
  setDefault(urc, 'publicDirectory', path.join(urc.rootDirectory, 'public'));
  setDefault(urc, 'jsEntry', path.join(urc.rootDirectory, 'src/entry.js'));
  setDefault(urc, 'htmlSource', path.join(urc.rootDirectory, 'src/html.js'));

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

  return urc;
}

// Custom fusspot validator.
function validateAbsolutePaths(value) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) {
    return 'absolute path';
  }
}

function setDefault(urc, property, value) {
  if (urc[property] === undefined) {
    urc[property] = value;
  }
}

module.exports = normalizeConfig;

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
    port: 8080,
    publicAssetsPath: 'underreact-assets',
    devServerHistoryFallback: false,
    devBrowserslist: [
      'last 2 Firefox versions',
      'last 2 Chrome versions',
      'last 2 Safari versions',
      'last 2 iOS versions'
    ],
    babelPresets: [],
    babelPlugins: [],
    webpackLoaders: [],
    webpackPlugins: [],
    webpackConfigTransform: x => x
    // `outputDirectory` defaulted below.
    // `publicDirectory` defaulted below.
    // `jsSource` defaulted below.
    // `htmlSource` defaulted below.
    // `polyfills` defaulted below.
    // `production` set by the CLI.
    // `stats` set by the CLI.
  };

  v.assert(v.string)(rawConfig.siteBasePath);
  v.assert(v.arrayOf(v.string))(rawConfig.stylesheets);
  v.assert(v.arrayOf(v.string))(rawConfig.vendorModules);
  v.assert(v.arrayOf(v.string))(rawConfig.environmentVariables);
  // TODO: validate postcssPlugins as array of functions.
  v.assert(v.number)(rawConfig.port);
  v.assert(v.string)(rawConfig.publicAssetsPath);
  v.assert(v.boolean)(rawConfig.devServerHistoryFallback);
  v.assert(v.oneOf(v.string, v.arrayOf(v.string)))(rawConfig.devBrowserslist);
  // TODO: validate that babelPlugins/Presets are absolute paths.
  v.assert(v.arrayOf(v.string))(rawConfig.babelPlugins);
  v.assert(v.arrayOf(v.string))(rawConfig.babelPresets);
  v.assert(v.arrayOf(v.plainObject))(rawConfig.webpackLoaders);
  v.assert(v.arrayOf(v.plainObject))(rawConfig.webpackPlugins);
  // TODO: validate webpackConfigTransform as a function
  v.assert(v.string)(rawConfig.outputDirectory);
  v.assert(v.string)(rawConfig.publicDirectory);
  v.assert(v.string)(rawConfig.jsSource);
  v.assert(v.string)(rawConfig.htmlSource);
  v.assert(
    v.shape({
      objectAssign: v.boolean,
      promise: v.boolean,
      fetch: v.boolean
    })
  )(rawConfig.polyfills);
  v.assert(v.boolean)(rawConfig.production);
  v.assert(v.string)(rawConfig.stats);

  const defaultPolyfills = {
    objectAssign: false,
    promise: false,
    fetch: false
  };

  const cl = Object.assign({}, defaults, rawConfig, {
    polyfills: Object.assign({}, defaultPolyfills, rawConfig.polyfills)
  });

  cl.rootDirectory = configDir;

  // Add defaults that depend on the rootDirectory.
  setDefault(
    cl,
    'outputDirectory',
    path.join(cl.rootDirectory, '_underreact-site')
  );
  setDefault(cl, 'publicDirectory', path.join(cl.rootDirectory, 'public'));
  setDefault(cl, 'jsSource', path.join(cl.rootDirectory, 'src/index.js'));
  setDefault(cl, 'htmlSource', path.join(cl.rootDirectory, 'src/html.js'));

  // Normalize URL parts.
  if (cl.siteBasePath && cl.siteBasePath !== '/') {
    cl.siteBasePath = cl.siteBasePath.replace(/\/$/, '');
    if (!cl.siteBasePath.startsWith('/')) {
      cl.siteBasePath = '/' + cl.siteBasePath;
    }
  }
  if (!cl.publicAssetsPath.startsWith('/')) {
    cl.publicAssetsPath = '/' + cl.publicAssetsPath;
  }

  return cl;
}

function setDefault(cl, property, value) {
  if (cl[property] === undefined) {
    cl[property] = value;
  }
}

module.exports = normalizeConfig;

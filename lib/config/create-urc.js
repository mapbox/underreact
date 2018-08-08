'use strict';

const path = require('path');
const _ = require('lodash');
const { WEBPACK_ASSETS_BASENAME, CLIENT_ENV_PREFIX } = require('../constants');
const validateConfig = require('./validate-config');
const dynamicRequire = require('../utils/dynamic-require');

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
    return dynamicRequire({
      absPath: path.join(this.outputDirectory, WEBPACK_ASSETS_BASENAME),
      deleteCache: true
    });
  }

  getHtmlSourceFn() {
    return dynamicRequire({
      absPath: this.htmlSource,
      deleteCache: true
    });
  }

  getClientEnvVars() {
    // Inspired from https://github.com/facebook/create-react-app/blob/next/packages/react-scripts/config/env.js#L71
    // Grabs NODE_ENV and environment variables that startWith CLIENT_ENV_PREFIX and prepare them to be
    // injected into the application via EnvironmentPlugin in Webpack configuration.
    const result = Object.keys(process.env)
      .filter(key => key.startsWith(CLIENT_ENV_PREFIX))
      .reduce(
        (env, key) => {
          env[key] = process.env[key];
          return env;
        },
        {
          // Useful for determining whether we’re running in production mode.
          // Most importantly, it switches React into the correct mode.
          NODE_ENV: process.env.NODE_ENV || this.mode,
          // Useful for resolving the correct path to static assets in `public`.
          // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
          PUBLIC_URL: this.siteBasePath
        }
      );

    return result;
  }
}

function createUrc(rawConfig = {}, defaultConfig) {
  return new Urc(rawConfig, defaultConfig);
}

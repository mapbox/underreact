'use strict';

const path = require('path');
const _ = require('lodash');
const fs = require('fs');
const dotenv = require('dotenv');

const dynamicRequire = require('../utils/dynamic-require');
const getDotenvFiles = require('../utils/get-dotenv-files');
const { WEBPACK_ASSETS_BASENAME } = require('../constants');
const validateConfig = require('./validate-config');

module.exports = class Urc {
  constructor(userConfig = {}, defaultConfig) {
    validateConfig(userConfig);
    const urc = _.merge({}, defaultConfig, userConfig);
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

  /**
   * By the time this function would be called, process.env would have
   * all the env vars provided by the user's dotenv file along
   * with some internal non related env vars. Since the internal env vars
   * are of no importance to the javascript bundle, we reread the dotenv files
   * to selectively bundle only the env vars which only exist in the dotenv files
   * with the exception being `NODE_ENV`, `DEPLOY_ENV` & `PUBLIC_URL`.
   */
  getClientEnvVars() {
    // Contains all the valid dotenv file paths which exist at root
    // in the right order
    const dotenvFiles = getDotenvFiles(this.rootDirectory);

    const dotenvObj = dotenvFiles
      .map(file => dotenv.parse(fs.readFileSync(file, 'utf-8')))
      .reduce((prev, cur) => Object.assign(prev, cur), {});

    // If the user is sharing the dotenv file with some other process
    // they can enable selective filtering of env vars with the help of
    // of a prefix urc.clientEnvPrefix (default is '').
    const whiteListedKeys = Object.keys(dotenvObj).filter(key =>
      key.startsWith(this.clientEnvPrefix)
    );

    const result = whiteListedKeys.reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      },
      {
        // Useful for determining whether we’re running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: process.env.NODE_ENV || this.mode,
        // Useful for providing a way to namespace different deployment targets
        DEPLOY_ENV: process.env.DEPLOY_ENV || process.env.NODE_ENV || this.mode,
        // Useful for resolving the correct path to static assets in `public`.
        // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
        PUBLIC_URL: this.siteBasePath
      }
    );

    return result;
  }
};
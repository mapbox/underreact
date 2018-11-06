'use strict';

const fs = require('fs');
const dotenv = require('dotenv');
const browserslist = require('browserslist');
const path = require('path');
const urlJoin = require('url-join');

const getDotenvFiles = require('../utils/get-dotenv-files');
const validateConfig = require('./validate-config');

module.exports = class Urc {
  constructor(userConfig = {}, defaultConfig, cliOpts) {
    validateConfig(userConfig);

    // setup up options independent of userConfig
    this.isProductionMode = cliOpts.mode === 'production';
    this.isDevelopmentMode = cliOpts.mode === 'development';
    this.mode = cliOpts.mode;
    this.command = cliOpts.command;
    // The dir containing the package.json of users app
    this.rootDirectory = cliOpts.configPath
      ? path.dirname(cliOpts.configPath)
      : process.cwd();

    Object.assign(this, defaultConfig, userConfig);

    this.normalize();

    if (this.browserslist) {
      this.setBrowserslistEnv();
    }
    // The directory containing all of the apps source code
    // it is generally named `src` or `lib`.
    this.appDir = path.dirname(this.jsEntry);
  }

  normalize() {
    const urc = this;
    // Normalize the merged configuration
    urc.siteBasePath = urlJoin('/', urc.siteBasePath);

    // Webpack doesn't play well with paths starting with `/`
    urc.publicAssetsPath = urc.publicAssetsPath.replace(/^\//, '');

    // Hot reloading doesn't play well with uglified/minified
    // code.
    if (urc.isProductionMode || urc.command === 'build') {
      urc.hot = false;
    }
    // This is done to prevent webpack from injecting
    // live reloading code to the build output code.
    if (urc.command === 'build') {
      urc.liveReload = false;
    }
  }
  /**
   * By the time this function would be called, process.env would have
   * all the env vars provided by the user's dotenv file along
   * with some internal non related env vars. Since the internal env vars
   * are of no importance to the javascript bundle, we reread the dotenv files
   * to selectively bundle only the env vars which only exist in the dotenv files
   * with the exception being `NODE_ENV`, `DEPLOY_ENV` & `PUBLIC_URL`.
   */
  readClientEnvVars() {
    // Contains all the valid dotenv file paths which exist at root
    // in the right order
    const dotenvFiles = getDotenvFiles(this.rootDirectory);

    const dotenvObj = dotenvFiles
      .map(file => dotenv.parse(fs.readFileSync(file, 'utf-8')))
      .reduce((prev, cur) => Object.assign(prev, cur), {});

    // Do not allow user to set these keys in .env files
    const barredKey = Object.keys(dotenvObj).find(
      key => key === 'DEPLOY_ENV' || key === 'NODE_ENV'
    );

    if (barredKey === 'DEPLOY_ENV') {
      throw new Error(
        `DEPLOY_ENV can not be set in your ".env" files. Please set it directly in your shell.`
      );
    }

    if (barredKey === 'NODE_ENV') {
      throw new Error(
        `NODE_ENV can not be set in your ".env" files. Please instead use Underreact's mode option.`
      );
    }

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
        DEPLOY_ENV: process.env.DEPLOY_ENV || process.env.NODE_ENV || this.mode
      }
    );

    return result;
  }

  parseBrowserslist() {
    if (!this.browserslist) {
      return;
    }

    let query;
    if (Array.isArray(this.browserslist)) {
      query = this.browserslist;
    }
    // handle the case when passed an object to target `production`||`development` differently.
    else if (Array.isArray(this.browserslist[process.env.NODE_ENV])) {
      query = this.browserslist[process.env.NODE_ENV];
    }

    if (query) {
      return browserslist(query, {
        env: process.env.NODE_ENV ? 'production' : 'development'
      });
    }
  }

  // If the user is using `urc.browserslist` we manually set the
  // process.env.BROWSERSLIST  so that the browserslist ecosystem
  // (we use babel-env, autoprefixer) can read it correctly.
  setBrowserslistEnv() {
    const list = this.parseBrowserslist();
    if (Array.isArray(list) && list.length > 0) {
      process.env.BROWSERSLIST = list.join(',');
    }
  }
};

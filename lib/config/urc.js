'use strict';

const browserslist = require('browserslist');
const path = require('path');
const urlJoin = require('url-join');

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

  readClientEnvVars() {
    if (this.environmentVariables.hasOwnProperty('DEPLOY_ENV')) {
      throw new Error(
        'DEPLOY_ENV can not be set in your Underreact configuration. Please set it directly in your shell.'
      );
    }
    if (this.environmentVariables.hasOwnProperty('NODE_ENV')) {
      throw new Error(
        'NODE_ENV can not be set in your ".env" files. Please instead use Underreact\'s mode option.'
      );
    }

    return Object.assign({}, this.environmentVariables, {
      // Useful for determining whether we’re running in production mode.
      // Most importantly, it switches React into the correct mode.
      NODE_ENV: process.env.NODE_ENV || this.mode,
      // Useful for providing a way to namespace different deployment targets
      DEPLOY_ENV: process.env.DEPLOY_ENV || this.mode
    });
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

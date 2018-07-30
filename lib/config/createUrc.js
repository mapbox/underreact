'use strict';

const path = require('path');
const _ = require('lodash');
const { WEBPACK_ASSETS_BASENAME } = require('../constants');
const validateConfig = require('./validate-config');
const { dynamicRequireSync } = require('../utils/dynamicRequire');

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
    return dynamicRequireSync({
      path: path.join(this.outputDirectory, WEBPACK_ASSETS_BASENAME),
      deleteCache: true
    });
  }

  getHtmlSourceFn() {
    return dynamicRequireSync({
      path: this.htmlSource,
      backupPath: path.join(__dirname, '..', './default-html.js'),
      deleteCache: true
    });
  }
}

function createUrc(rawConfig = {}, defaultConfig) {
  return new Urc(rawConfig, defaultConfig);
}

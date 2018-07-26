'use strict';

const path = require('path');
const _ = require('lodash');
const { WEBPACK_ASSETS_BASENAME } = require('../constants');
const fs = require('fs');
const validateConfig = require('./validate-config');

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

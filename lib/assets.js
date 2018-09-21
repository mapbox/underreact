'use strict';
const urlJoin = require('url-join');
const path = require('path');

const dynamicRequire = require('./utils/dynamic-require');

// Contains all assets that could be needed by index.html
// Note: all asset paths are relative to host
class Assets {
  constructor({ urc, cssOutput, webpackAssets }) {
    this.urc = urc;
    this._cssOutput = cssOutput;
    this._webpackAssets = webpackAssets;
  }

  get webpack() {
    return dynamicRequire({
      absolutePath: this._webpackAssets,
      deleteCache: true
    });
  }

  get css() {
    const webpackAssets = this.webpack;
    const mainStylesheet = this.mainStylesheet;
    return [mainStylesheet].concat(webpackAssets.main.css).filter(Boolean);
  }

  get mainStylesheet() {
    const absolutePath = this._cssOutput;

    return this.absolutePathToRelativeUrl(absolutePath);
  }

  // converts an absolute filesystem path to a browser friendly relative url
  absolutePathToRelativeUrl(absolutePath) {
    if (!absolutePath) {
      return;
    }

    if (Array.isArray(absolutePath)) {
      return absolutePath.map(path => this.absolutePathToRelativeUrl(path));
    }

    const relativePath = path.relative(this.urc.outputDirectory, absolutePath);
    return urlJoin(this.urc.siteBasePath, ...relativePath.split(path.sep));
  }

  // converts an relative url  to an absolute filesystem path
  relativeUrlToAbsolutePath(relativeUrl) {
    if (!relativeUrl) {
      return;
    }

    if (Array.isArray(relativeUrl)) {
      return relativeUrl.map(url => this.relativeUrlToAbsolutePath(url));
    }

    return path.join(
      this.urc.outputDirectory,
      relativeUrl.replace(new RegExp(`^${this.urc.siteBasePath}`), '')
    );
  }
}

module.exports = Assets;

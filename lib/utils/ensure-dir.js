'use strict';

const mkdirp = require('mkdirp');
const p = require('util.promisify');

module.exports = function ensureDir(directory) {
  return p(mkdirp)(directory);
};

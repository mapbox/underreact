'use strict';

const mkdirp = require('mkdirp');
const promisify = require('util.promisify');

module.exports = function ensureDir(directory) {
  return promisify(mkdirp)(directory);
};

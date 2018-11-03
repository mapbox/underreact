'use strict';

const tempy = require('tempy');
const makeDir = require('make-dir');
const path = require('path');
const fs = require('fs');
const promisify = require('util.promisify');
const dedent = require('dedent');

const writeFile = promisify(fs.writeFile);

// Creates a directory structure of the shape of the input nested obj
// - if a key's value is string, a corresponding file is created with the same content
// - if a key's value is object, a directory is created and process is repeated
//   recursively.
// returns the root path of the directory
module.exports = function generateTree(tree, rootPath = tempy.directory()) {
  const recurse = (obj, basePath) => {
    if (typeof obj === 'string') {
      return makeDir(path.dirname(basePath)).then(() =>
        writeFile(basePath, dedent(obj), 'utf-8')
      );
    }
    return Promise.all(
      Object.keys(obj).map(key => recurse(obj[key], path.join(basePath, key)))
    );
  };

  return recurse(tree, rootPath).then(() => rootPath);
};

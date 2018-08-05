'use strict';
const fs = require('fs');
const p = require('util.promisify');

module.exports = { dynamicRequire, dynamicRequireSync };

function dynamicRequire({ path, backupPath, deleteCache = false }) {
  // Check if file is readable
  return checkPathExists(path).then(pathExists => {
    if (!pathExists && !backupPath) {
      throw new Error(`File at ${path} not found`);
    }
    if (!pathExists) {
      path = backupPath;
    }
    if (deleteCache) {
      delete require.cache[require.resolve(path)];
    }

    return require(path);
  });
}

function dynamicRequireSync({ path, backupPath, deleteCache = false }) {
  const pathExists = fs.existsSync(path);
  if (!pathExists && !backupPath) {
    throw new Error(`File at ${path} not found`);
  }
  if (!pathExists) {
    path = backupPath;
  }
  if (deleteCache) {
    delete require.cache[require.resolve(path)];
  }

  return require(path);
}

function checkPathExists(file) {
  return p(fs.stat)(file)
    .then(() => true)
    .catch(err => {
      if (err.code === 'ENOENT') {
        return false;
      }
      throw err;
    });
}

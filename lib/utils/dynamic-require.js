'use strict';
const fse = require('fs-extra');

module.exports = { dynamicRequire, dynamicRequireSync };

function dynamicRequire({ path, backupPath, deleteCache = false }) {
  return fse.pathExists(path).then(pathExists => {
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
  const pathExists = fse.pathExistsSync(path);
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

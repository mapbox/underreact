'use strict';

module.exports = dynamicRequire;

function dynamicRequire({ absPath, absBackupPath, deleteCache = false }) {
  if (deleteCache) {
    delete require.cache[absPath];
  }
  try {
    return require(absPath);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && absBackupPath) {
      return dynamicRequire({ absPath: absBackupPath, deleteCache });
    }
    throw error;
  }
}

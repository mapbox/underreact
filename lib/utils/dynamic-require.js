'use strict';

module.exports = dynamicRequire;

/**
 * Provides an abstraction over regular `require`, supposed to be used
 * in cases where the module may or may not exist. It requires
 * absolute path to avoid ambiguity as require() resolves module
 * wrt to current file's path.
 * @param {Object} opts
 * @param {string} [opts.absPath] - The absolute path of module to load
 * @param {string} [opts.absBackupPath] - The path to fallback to in case the module is not found at `absPath`.
 * @param {*} [opts.backupValue] - The value to fall back to. (It has a lower priority than `absBackupPath`.)
 * @param {boolean} [opts.deleteCache=false] - The object to return in case a module is not found at `absPath`.
 */
function dynamicRequire({
  absPath,
  absBackupPath,
  backupValue,
  deleteCache = false
}) {
  try {
    if (deleteCache) {
      delete require.cache[absPath];
    }
    return require(absPath);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && absBackupPath) {
      return dynamicRequire({
        absPath: absBackupPath,
        backupValue,
        deleteCache
      });
    }
    if (error.code === 'MODULE_NOT_FOUND' && backupValue) {
      return backupValue;
    }

    throw error;
  }
}

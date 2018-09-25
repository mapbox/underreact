'use strict';

module.exports = dynamicRequire;

/**
 * Provides an abstraction over regular `require`, supposed to be used
 * in cases where the module may or may not exist. It requires
 * absolute path to avoid ambiguity as require() resolves module
 * wrt to current file's path.
 * @param {Object} opts
 * @param {string} [opts.absolutePath] - The absolute path of module to load
 * @param {string} [opts.absoluteBackupPath] - The path to fallback to in case the module is not found at `absolutePath`.
 * @param {*} [opts.backupValue] - The value to fall back to. (It has a lower priority than `absoluteBackupPath`.)
 * @param {boolean} [opts.deleteCache=false] - The object to return in case a module is not found at `absolutePath`.
 */
function dynamicRequire({
  absolutePath,
  absoluteBackupPath,
  backupValue,
  deleteCache = false
}) {
  try {
    if (deleteCache) {
      delete require.cache[absolutePath];
    }
    // Note: We only wanna catch error if file at absolutePath is not requireable
    // hence we can't initially use `require` here because it can throw
    // an error with code `MODULE_NOT_FOUND` for any of the nested requires inside
    // the file at `absolutePath`.
    require.resolve(absolutePath);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && absoluteBackupPath) {
      return dynamicRequire({
        absolutePath: absoluteBackupPath,
        backupValue,
        deleteCache
      });
    }
    if (error.code === 'MODULE_NOT_FOUND' && backupValue) {
      return backupValue;
    }
    throw error;
  }
  return require(absolutePath);
}

'use strict';

const webpack = require('webpack');

const dynamicRequire = require('../utils/dynamic-require');

/**
 * @typedef {Object} CliOpts
 * @property {'start'|'build'|'serve-static'} command
 * @property {string} configPath - The absolute path to user configuration
 * @property {'production'|'development'} mode
 * @property {boolean} stats - Generate webpack stats flag
 * @property {number} port - Port of the webserver serving the build
 */

module.exports = getUserConfig;

/**
 * Reads the user configuration and merges it with
 * the internal configration.
 * @param {CliOpts} cliOpts - The cli parameters
 * @returns {Urc}
 */
function getUserConfig(cliOpts) {
  const configModule = dynamicRequire({
    absPath: cliOpts.configPath,
    backupValue: {},
    deleteCache: true
  });

  if (typeof configModule !== 'function') {
    return configModule;
  }

  return configModule({
    webpack,
    command: cliOpts.command,
    mode: cliOpts.mode
  });
}

'use strict';

const getDefaultConfig = require('../default-underreact.config');

const Urc = require('./urc');
const getUserConfig = require('./get-user-config');

/**
 * Reads the user configuration and merges it with
 * the internal configuration.
 * @param {Object} cliOpts - The cli parameters
 * @param {string} cliOpts.command
 * @param {string} cliOpts.configPath - The absolute path to user configuration
 * @param {'production'|'development'} cliOpts.mode
 * @param {boolean} cliOpts.stats - Generate webpack stats flag
 * @param {port} cliOpts.port - Port of the webserver serving the build
 * @returns {Promise<Urc>}
 */
module.exports = function config(cliOpts) {
  const defaultConfig = getDefaultConfig(cliOpts);
  const userConfigPromise = getUserConfig(cliOpts);

  return userConfigPromise.then(
    userConfig => new Urc(userConfig, defaultConfig)
  );
};

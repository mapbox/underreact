'use strict';

const webpack = require('webpack');

const getDefaultConfig = require('../default-underreact.config');
const createUrc = require('./create-urc');

module.exports = config;

function config(cliOpts) {
  return userConfigReader(cliOpts.configPath).then(getUserConfig => {
    const userConfig = getUserConfig({
      webpack,
      command: cliOpts.command,
      mode: cliOpts.command
    });
    const defaultConfig = getDefaultConfig(cliOpts);

    return createUrc(userConfig, defaultConfig);
  });
}

function userConfigReader(configPath) {
  return Promise.resolve().then(() => {
    const configModule = require(configPath);
    return typeof configModule === 'function'
      ? configModule
      : () => configModule;
  });
}

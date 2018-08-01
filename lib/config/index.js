'use strict';
const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');

const { DEFAULT_CONFIG_NAME } = require('../constants');
const getDefaultConfig = require('../default-underreact.config');
const createConfig = require('./create-urc');

module.exports = config;

function config(command, argv) {
  const configIsNotSpecified = argv.config === undefined;
  let configPath;

  if (configIsNotSpecified) {
    configPath = path.join(process.cwd(), DEFAULT_CONFIG_NAME);
  } else {
    configPath = path.resolve(argv.config);
  }

  return userConfigReader(configPath)
    .catch(() => {
      // If the user didn't use --config, it's fine if the underreact.config.js
      // does not exist at the default path.
      if (configIsNotSpecified) {
        return () => {};
      }
      // But if they did specify a path, tell them it didn't work.
      throw new Error(
        `Failed to load underreact configuration module from ${chalk.underline(
          configPath
        )}`
      );
    })
    .then(getUserConfig => {
      let production = true;
      if (command === 'build') {
        production = !argv.debug;
      } else if (command === 'start') {
        production = argv.production;
      } else if (argv.env === 'prod') {
        production = true;
      }

      // This object is passed as the argument to the config module, if it's a
      // function.
      const configModuleContext = {
        webpack,
        command,
        production
      };

      const userConfig = getUserConfig(configModuleContext);
      const defaultConfig = getDefaultConfig(
        Object.assign({}, configModuleContext, {
          argv,
          configDir: path.dirname(configPath),
          stats: argv.stats,
          port: argv.port
        })
      );
      return createConfig(userConfig, defaultConfig);
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

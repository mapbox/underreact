'use strict';

const webpack = require('webpack');

const dynamicRequire = require('../utils/dynamic-require');

module.exports = function getUserConfig(cliOpts) {
  const configModule = dynamicRequire({
    absPath: cliOpts.configPath,
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
};

'use strict';
const path = require('path');

module.exports = function getCliOpts(command, argv) {
  const cliOpts = {
    command,
    configPath: path.resolve(argv.config),
    mode: argv.mode,
    stats: argv.stats,
    port: argv.port
  };
  return cliOpts;
};

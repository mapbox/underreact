'use strict';
const path = require('path');

module.exports = getCliOpts;

function getCliOpts(command, argv) {
  const cliOpts = {
    command,
    configPath: path.resolve(argv.config),
    mode: argv.mode,
    stats: argv.stats,
    host: argv.host,
    port: argv.port
  };
  return cliOpts;
}

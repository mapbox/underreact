'use strict';
const path = require('path');

module.exports = function parseArgv(command, argv = {}) {
  const configIsNotSpecified = argv.config === undefined;
  // The path to root of the application running underreact
  let rootDirectory;

  if (configIsNotSpecified) {
    rootDirectory = process.cwd();
  } else {
    rootDirectory = path.dirname(path.resolve(argv.config));
  }

  return {
    rootDirectory,
    command,
    mode: argv.mode,
    stats: argv.stats,
    port: argv.port
  };
};

'use strict';

const validateConfig = require('../lib/validate-config');
const startServer = require('../lib/start-server');

function serveStatic(rawConfig, configDir) {
  const cl = validateConfig(rawConfig, configDir);
  startServer(cl);
}

module.exports = serveStatic;

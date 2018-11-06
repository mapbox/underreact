'use strict';

const startServer = require('../lib/start-server');

function serveStatic(urc) {
  return startServer(urc);
}

module.exports = serveStatic;

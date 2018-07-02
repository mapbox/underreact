'use strict';

const startServer = require('../lib/start-server');

function serveStatic(urc) {
  startServer(urc);
}

module.exports = serveStatic;

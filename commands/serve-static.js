'use strict';

const startServer = require('../lib/start-server');

function serveStatic(cl) {
  startServer(cl);
}

module.exports = serveStatic;

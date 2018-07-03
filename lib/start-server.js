'use strict';

const reloadingServer = require('./packageable/reloading-server');
const logger = require('./logger');

function startServer(urc) {
  const server = reloadingServer({
    dir: urc.outputDirectory,
    port: urc.port,
    siteBasePath: urc.siteBasePath,
    historyFallback: urc.devServerHistoryFallback
  });

  server.on('info', logger.log);
  server.on('error', logger.error);
  return new Promise(resolve => {
    server.on('ready', resolve);
  });
}

module.exports = startServer;

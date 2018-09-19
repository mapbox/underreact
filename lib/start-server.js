'use strict';

const reloadingServer = require('./utils/reloading-server');
const logger = require('./logger');

const delay = t => new Promise(res => setTimeout(res, t));

function startServer(urc) {
  // Give a slight delay to let build tasks settle
  return delay(400).then(() => {
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
  });
}

module.exports = startServer;

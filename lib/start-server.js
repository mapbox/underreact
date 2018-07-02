'use strict';

const path = require('path');
const chalk = require('chalk');
const liveServer = require('live-server');
const getPort = require('get-port');
const address = require('address');
const logger = require('./logger');
const joinUrlParts = require('./join-url-parts');
const historyApiFallback = require('connect-history-api-fallback');

function startServer(urc) {
  const logPort = actualPort => {
    if (actualPort === urc.port) return;
    let portMsg = chalk.yellow(`Something is already using port ${urc.port}.`);
    portMsg += ' Finding an open port ...';
    logger.log(portMsg);
  };

  const logReady = actualPort => {
    const localUrl = joinUrlParts(
      `http://localhost:${actualPort}`,
      urc.siteBasePath,
      ''
    );
    const chevron = chalk.green.bold('>');
    let startMsg = chalk.green.bold('Ready!');
    startMsg += `\n  ${chevron} Access your site at ${chalk.bold.magenta.underline(
      localUrl
    )}`;

    const ip = address.ip();
    if (ip) {
      const externalUrl = joinUrlParts(
        `http://${ip}:${actualPort}`,
        urc.siteBasePath,
        ''
      );
      startMsg += `\n  ${chevron} Available externally at ${chalk.magenta(
        externalUrl
      )}`;
    }

    startMsg += `\n  ${chevron} Files are in ${chalk.cyan(
      path.relative(process.cwd(), urc.outputDirectory)
    )}`;

    logger.log(startMsg);
  };

  const stripSiteBasePath = (req, res, next) => {
    if (req.url.startsWith(urc.siteBasePath)) {
      req.url = req.url.replace(urc.siteBasePath, '') || '/';
    }
    next();
  };

  const middleware = [stripSiteBasePath];
  if (urc.devServerHistoryFallback) {
    middleware.push(historyApiFallback());
  }

  // Adding ipv4 host is necessary as node defaults
  // to using ipv6 host which leads to false positives.
  // https://github.com/sindresorhus/get-port/issues/8
  return getPort({ port: urc.port, host: '0.0.0.0' }).then(actualPort => {
    logPort(actualPort);

    liveServer.start({
      port: actualPort,
      root: urc.outputDirectory,
      file: path.join(urc.outputDirectory, 'index.html'),
      logLevel: 0,
      open: false,
      wait: 100,
      middleware
    });

    logReady(actualPort);
  });
}

module.exports = startServer;

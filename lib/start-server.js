'use strict';

const path = require('path');
const chalk = require('chalk');
const liveServer = require('live-server');
const getPort = require('get-port');
const address = require('address');
const logger = require('./chunk-light-logger');
const joinUrlParts = require('./join-url-parts');
const historyApiFallback = require('connect-history-api-fallback');

function startServer(cl) {
  const stripSiteBasePath = (req, res, next) => {
    if (req.url.startsWith(cl.siteBasePath)) {
      req.url = req.url.replace(cl.siteBasePath, '') || '/';
    }
    next();
  };

  const middleware = [stripSiteBasePath];
  if (cl.devServerHistoryFallback) {
    middleware.push(historyApiFallback());
  }

  // adding ipv4 host is necessary as node defaults
  // to using ipv6 host which leads to false positives
  // ref: https://github.com/sindresorhus/get-port/issues/8
  return getPort({ port: cl.port, host: '0.0.0.0' }).then(actualPort => {
    if (actualPort !== cl.port) {
      let portMsg = chalk.yellow(`Something is already using port ${cl.port}.`);
      portMsg += ' Finding an open port ...';
      logger.log(portMsg);
    }

    liveServer.start({
      port: actualPort,
      root: cl.outputDirectory,
      file: path.join(cl.outputDirectory, 'index.html'),
      logLevel: 0,
      open: false,
      wait: 100,
      middleware
    });

    const localUrl = joinUrlParts(
      `http://localhost:${actualPort}`,
      cl.siteBasePath,
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
        cl.siteBasePath,
        ''
      );
      startMsg += `\n  ${chevron} Available externally at ${chalk.magenta(
        externalUrl
      )}`;
    }

    startMsg += `\n  ${chevron} Files are in ${chalk.cyan(
      path.relative(process.cwd(), cl.outputDirectory)
    )}`;

    logger.log(startMsg);
  });
}

module.exports = startServer;

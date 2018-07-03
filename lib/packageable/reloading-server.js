'use strict';

const path = require('path');
const chalk = require('chalk');
const liveServer = require('live-server');
const { EventEmitter } = require('events');
const getPort = require('get-port');
const address = require('address');
const urlJoin = require('url-join');
const historyApiFallback = require('connect-history-api-fallback');

// Unlike live-server on its own, this server:
// - Will get an available port if the preferred port is not available.
// - Works with specified siteBasePath in a way that effectively simulates
//   the production deployment setting.
// - Can log nice messages saying where to open the browser.
//
// Returns an EventEmitter that emits the following events:
// - "info"
// - "error"
// - "ready"
// - "port"
function reloadingServer({
  dir,
  port = 8080,
  siteBasePath = '',
  historyFallback = false,
  quiet = false
} = {}) {
  const emitter = new EventEmitter();
  const emitInfo = msg => {
    if (quiet) return;
    emitter.emit('info', msg);
  };
  const emitError = error => {
    emitter.emit('error', error);
  };

  const logPort = actualPort => {
    if (actualPort === port) return;
    let portMsg = chalk.yellow(`Something is already using port ${port}.`);
    portMsg += ' Finding an open port ...';
    emitInfo(portMsg);
  };

  const logReady = actualPort => {
    const localUrl = urlJoin(`http://localhost:${actualPort}`, siteBasePath);
    const chevron = chalk.green.bold('>');
    let startMsg = chalk.green.bold('Ready!');
    startMsg += `\n  ${chevron} Access your site at ${chalk.bold.magenta.underline(
      localUrl
    )}`;

    const ip = address.ip();
    if (ip) {
      const externalUrl = urlJoin(`http://${ip}:${actualPort}`, siteBasePath);
      startMsg += `\n  ${chevron} Available externally at ${chalk.magenta(
        externalUrl
      )}`;
    }

    startMsg += `\n  ${chevron} Files are in ${chalk.cyan(
      path.relative(process.cwd(), dir)
    )}`;

    emitInfo(startMsg);
  };

  const stripSiteBasePath = (req, res, next) => {
    if (req.url.startsWith(siteBasePath)) {
      req.url = req.url.replace(siteBasePath, '') || '/';
    }
    next();
  };

  const middleware = [stripSiteBasePath];
  if (historyFallback) {
    middleware.push(historyApiFallback());
  }

  // Adding ipv4 host is necessary as node defaults
  // to using ipv6 host which leads to false positives.
  // https://github.com/sindresorhus/get-port/issues/8
  getPort({ port: port, host: '0.0.0.0' })
    .then(actualPort => {
      emitter.emit('port', actualPort);
      logPort(actualPort);

      liveServer.start({
        port: actualPort,
        root: dir,
        logLevel: 0,
        open: false,
        wait: 100,
        middleware
      });

      logReady(actualPort);
      emitter.emit('ready');
    })
    .catch(emitError);

  return emitter;
}

module.exports = reloadingServer;

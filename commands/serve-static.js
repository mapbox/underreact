'use strict';

const handler = require('serve-handler');
const http = require('http');
const fs = require('fs');
const promisify = require('util.promisify');
const path = require('path');
const urlJoin = require('url-join');

const logger = require('../lib/logger');
const getReadyMessage = require('../lib/utils/get-ready-message');

module.exports = startServer;

const normalizePath = p => p.replace(/\//g, path.sep);

function startServer(urc) {
  const serverOpts = {
    public: urc.outputDirectory,
    cleanUrls: true,
    headers: [
      {
        source: `**/${urc.publicAssetsPath}/**`,
        headers: [
          {
            key: 'Cache-Control',
            value: 'max-age=7201'
          }
        ]
      },
      {
        source: '**/*.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'max-age=0'
          }
        ]
      }
    ]
  };
  if (urc.devServerHistoryFallback) {
    serverOpts.rewrites = [
      {
        source: `${urlJoin(urc.siteBasePath, '/')}/**`,
        destination:
          urc.siteBasePath === '/'
            ? '/index.html'
            : urlJoin('/', urc.siteBasePath, 'index.html')
      }
    ];
  }
  if (urc.siteBasePath !== '/') {
    serverOpts.redirects = [
      {
        source: `/`,
        destination: `${urlJoin(urc.siteBasePath, '/')}`,
        type: 302
      }
    ];
  }
  const server = http.createServer((request, response) => {
    return handler(request, response, serverOpts, {
      stat(requestedPath) {
        // Prevent accessing incorrect root relative paths. For example,
        // if the `base_path=fancy` and there is an image with
        // path `<root>/public/img/xyz.jpg` in the publicDirectory,
        // we will want to prevent ths user from loading `<img src='/img/xyz.jpg'>`
        // and instead allow loading of <img src='/fancy/img/xyz.jpg'>.
        if (
          !requestedPath.startsWith(
            path.join(urc.outputDirectory, normalizePath(urc.siteBasePath))
          )
        ) {
          return promisify(fs.stat)('');
        }

        requestedPath = stripSiteBasePath({ requestedPath, urc });
        return promisify(fs.stat)(requestedPath);
      },
      createReadStream(requestedPath) {
        requestedPath = stripSiteBasePath({ requestedPath, urc });
        return fs.createReadStream(requestedPath);
      },
      readdir(requestedPath) {
        requestedPath = stripSiteBasePath({ requestedPath, urc });
        return promisify(fs.readdir)(requestedPath);
      }
    });
  });
  server.listen(urc.port, () => {
    logger.log(getReadyMessage(urc));
  });
}

function stripSiteBasePath({ requestedPath, urc }) {
  const normalizedSiteBasePath = normalizePath(urc.siteBasePath);
  const pathToReplace = path.join(
    urc.outputDirectory,
    normalizedSiteBasePath,
    path.sep
  );
  const pathToReplaceWith = path.join(urc.outputDirectory, path.sep);
  return requestedPath.replace(pathToReplace, pathToReplaceWith);
}

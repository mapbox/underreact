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
        destination: '/index.html'
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
      stat(path) {
        path = stripSiteBasePath({ requestedPath: path, urc });
        return promisify(fs.stat)(path);
      },
      createReadStream(path) {
        path = stripSiteBasePath({ requestedPath: path, urc });
        return fs.createReadStream(path);
      },
      readdir(path) {
        path = stripSiteBasePath({ requestedPath: path, urc });
        return promisify(fs.readdir)(path);
      }
    });
  });
  server.listen(urc.port, () => {
    logger.log(getReadyMessage(urc));
  });
}

function stripSiteBasePath({ requestedPath, urc }) {
  const normalizedSiteBasePath = urc.siteBasePath.replace(/\//g, path.sep);
  const pathToReplace = path.join(
    urc.outputDirectory,
    normalizedSiteBasePath,
    path.sep
  );
  const pathToReplaceWith = path.join(urc.outputDirectory, path.sep);
  return requestedPath.replace(pathToReplace, pathToReplaceWith);
}

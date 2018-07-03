'use strict';

const cpy = require('cpy');
const del = require('del');
const path = require('path');
const chokidar = require('chokidar');
const logger = require('./logger');

function copyPublicFiles(urc) {
  return cpy('**/*', urc.outputDirectory, {
    cwd: urc.publicDirectory,
    parents: true
  });
}

function watchPublicFiles(urc) {
  const watcher = chokidar.watch('**/*', {
    cwd: urc.publicDirectory,
    ignoreInitial: true
  });
  const copyFile = filename => {
    logger.log(`Copying ${filename}`);
    cpy(filename, urc.outputDirectory, {
      cwd: urc.publicDirectory,
      parents: true
    }).catch(logger.error);
  };
  const deleteFile = filename => {
    logger.log(`Deleting ${filename}`);
    del(path.join(urc.outputDirectory, filename), { force: true }).catch(
      logger.error
    );
  };
  watcher.on('add', copyFile);
  watcher.on('addDir', copyFile);
  watcher.on('change', copyFile);
  watcher.on('unlink', deleteFile);
  watcher.on('unlinkDir', deleteFile);
  watcher.on('error', logger.error);
}

module.exports = {
  copy: copyPublicFiles,
  watch: watchPublicFiles
};

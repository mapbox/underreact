'use strict';

const cpy = require('cpy');
const del = require('del');
const path = require('path');
const chokidar = require('chokidar');
const logger = require('./logger');

function copyPublicFiles(cl) {
  return cpy('**/*', cl.outputDirectory, {
    cwd: cl.publicDirectory,
    parents: true
  });
}

function watchPublicFiles(cl) {
  const watcher = chokidar.watch('**/*', { cwd: cl.publicDirectory });
  const copyFile = filename => {
    logger.log(`Copying ${filename}`);
    cpy(filename, cl.outputDirectory, {
      cwd: cl.publicDirectory,
      parents: true
    }).catch(logger.error);
  };
  const deleteFile = filename => {
    logger.log(`Deleting ${filename}`);
    del(path.join(cl.outputDirectory, filename), { force: true }).catch(
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

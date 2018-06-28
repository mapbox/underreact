'use strict';

const cpy = require('cpy');
const del = require('del');
const path = require('path');
const chokidar = require('chokidar');
const logger = require('./chunk-light-logger');

function copyPublicFiles(cl) {
  return cpy('**/*', cl.outputDirectory, {
    cwd: cl.publicDirectory,
    parents: true
  });
}

function watchPublicFiles(cl, onError) {
  const watcher = chokidar.watch('**/*', { cwd: cl.publicDirectory });
  const copyFile = filename => {
    logger.log(`Copying ${filename}`);
    cpy(filename, cl.outputDirectory, {
      cwd: cl.publicDirectory,
      parents: true
    }).catch(onError);
  };
  watcher.on('add', copyFile);
  watcher.on('change', copyFile);
  watcher.on('unlink', filename => {
    logger.log(`Deleting ${filename}`);
    del(path.join(cl.outputDirectory, filename), { force: true }).catch(
      onError
    );
  });
  watcher.on('error', onError);
}

module.exports = {
  copy: copyPublicFiles,
  watch: watchPublicFiles
};

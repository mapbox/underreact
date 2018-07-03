'use strict';

const cpy = require('cpy');
const del = require('del');
const path = require('path');
const chokidar = require('chokidar');
const { EventEmitter } = require('events');

const SOURCE_GLOB_DEFAULT = '**/*';

function copyFiles({ sourceDir, destDir, sourceGlob = SOURCE_GLOB_DEFAULT }) {
  return cpy(sourceGlob, destDir, {
    cwd: sourceDir,
    parents: true
  });
}

function watchFiles({ sourceDir, destDir, sourceGlob = SOURCE_GLOB_DEFAULT }) {
  const emitter = new EventEmitter();
  const emitError = error => {
    emitter.emit('error', error);
  };
  const watcher = chokidar.watch(sourceGlob, {
    cwd: sourceDir,
    ignoreInitial: true
  });
  const copyFile = filename => {
    cpy(filename, destDir, {
      cwd: sourceDir,
      parents: true
    }).then(() => {
      emitter.emit('copy', filename);
    }, emitError);
  };
  const deleteFile = filename => {
    emitter.emit('delete', filename);
    del(path.join(destDir, filename), { force: true }).catch(emitError);
  };
  watcher.on('add', copyFile);
  watcher.on('addDir', copyFile);
  watcher.on('change', copyFile);
  watcher.on('unlink', deleteFile);
  watcher.on('unlinkDir', deleteFile);
  watcher.on('error', emitError);

  return emitter;
}

module.exports = {
  copy: copyFiles,
  watch: watchFiles
};

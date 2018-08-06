'use strict';

const cpy = require('cpy');
const del = require('del');
const path = require('path');
const chokidar = require('chokidar');
const { EventEmitter } = require('events');

const SOURCE_GLOB_DEFAULT = '**/*';

function watchFiles({ sourceDir, sourceGlob = SOURCE_GLOB_DEFAULT }) {
  const emitter = new EventEmitter();

  const copyFile = filename => {
    emitter.emit('copy', filename);
  };
  const deleteFile = filename => {
    emitter.emit('delete', filename);
  };
  const watcherError = error => {
    emitter.emit('error', error);
  };

  const watcher = chokidar.watch(sourceGlob, {
    cwd: sourceDir,
    ignoreInitial: true
  });

  // TOFIX what happens on rename
  watcher.on('add', copyFile);
  watcher.on('addDir', copyFile);
  watcher.on('change', copyFile);
  watcher.on('unlink', deleteFile);
  watcher.on('unlinkDir', deleteFile);
  watcher.on('error', watcherError);

  emitter.close = () => {
    watcher.close();
    emitter.removeAllListeners();
  };

  return emitter;
}

function copyFile({ filename, destDir, sourceDir }) {
  return cpy(filename, destDir, {
    cwd: sourceDir,
    parents: true
  });
}

function delFile({ filename, destDir }) {
  return del(path.join(destDir, filename), { force: true });
}

module.exports = {
  watchDir: watchFiles,
  copyFile: copyFile,
  delFile: delFile
};

'use strict';

const cpy = require('cpy');
const del = require('del');
const path = require('path');
const chokidar = require('chokidar');
const { EventEmitter } = require('events');

const SOURCE_GLOB_DEFAULT = '**/*';

module.exports = mirrorDir;

// Keeps two directories in sync lazily.
// Returns an `emitter` with `copy`, `delete`, `error` events.
// The `copy`, `delete` events emit an object `{filename, commit}`
// `filename` - is the relative path of the file wrt `destDir`
// `commit` - is a function for lazy execution of the operation, returns a promise.
function mirrorDir({ sourceDir, destDir, sourceGlob = SOURCE_GLOB_DEFAULT }) {
  const emitter = new EventEmitter();

  const copyFile = filename => {
    emitter.emit('copy', {
      filename,
      commit: () =>
        cpy(filename, destDir, {
          cwd: sourceDir,
          parents: true
        })
    });
  };

  const deleteFile = filename => {
    emitter.emit('delete', {
      filename,
      commit: () => del(path.join(destDir, filename), { force: true })
    });
  };
  const watcherError = error => {
    emitter.emit('error', error);
  };

  const chokidarWatcher = chokidar.watch(sourceGlob, {
    cwd: sourceDir,
    ignoreInitial: true
  });

  chokidarWatcher.on('add', copyFile);
  chokidarWatcher.on('addDir', copyFile);
  chokidarWatcher.on('change', copyFile);
  chokidarWatcher.on('unlink', deleteFile);
  chokidarWatcher.on('unlinkDir', deleteFile);
  chokidarWatcher.on('error', watcherError);

  emitter.close = () => {
    chokidarWatcher.close();
    emitter.removeAllListeners();
  };

  return emitter;
}

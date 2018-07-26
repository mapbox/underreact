'use strict';

const autoCopy = require('./packageable/auto-copy');

module.exports = copyPublicFiles;

function copyPublicFiles(urc) {
  return autoCopy.copy({
    sourceDir: urc.publicDirectory,
    destDir: urc.outputDirectory
  });
}

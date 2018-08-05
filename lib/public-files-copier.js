'use strict';

const autoCopy = require('./utils/auto-copy');

module.exports = copyPublicFiles;

function copyPublicFiles(urc) {
  return autoCopy.copy({
    sourceDir: urc.publicDirectory,
    destDir: urc.outputDirectory
  });
}

'use strict';

const autoCopy = require('./packageable/auto-copy');
const logger = require('./logger');

function copyPublicFiles(urc) {
  return autoCopy.copy({
    sourceDir: urc.publicDirectory,
    destDir: urc.outputDirectory
  });
}

function watchPublicFiles(urc) {
  const copier = autoCopy.watch({
    sourceDir: urc.publicDirectory,
    destDir: urc.outputDirectory
  });
  copier.on('copy', filename => {
    logger.log(`Copying ${filename}`);
  });
  copier.on('delete', filename => {
    logger.log(`Deleting ${filename}`);
  });
  copier.on('error', logger.error);
}

module.exports = {
  copy: copyPublicFiles,
  watch: watchPublicFiles
};

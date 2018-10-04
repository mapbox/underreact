'use strict';

// Takes an array of chunk names to exclude the corresponding assets
// from the final webpack output.
module.exports = class ExcludeChunksPlugin {
  constructor(options = {}) {
    this.excludeChunks = options.excludeChunks;
  }
  apply(compiler) {
    compiler.hooks.emit.tap('ExcludeChunksPlugin', compilation => {
      const assets = Object.assign({}, compilation.assets);
      this.excludeChunks.forEach(chunkName => {
        const filenames = getAssetFilenames(compilation.chunks, chunkName);
        filenames.forEach(filename => {
          delete assets[filename];
        });
      });
      compilation.assets = assets;
    });
  }
};

function getAssetFilenames(chunks, chunkName) {
  for (const chunk of chunks) {
    if (chunk.name === chunkName) {
      return chunk.files;
    }
  }
  return [];
}

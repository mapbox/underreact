'use strict';

// Creates a tree object containing `index.js` & `package.json`
module.exports = function createStubModule({ moduleName, content }) {
  return {
    'index.js': content,
    'package.json': `{
        "name": "${moduleName}",
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "scripts": {
        },
        "author": "",
        "license": "ISC"
      }`
  };
};

'use strict';

const path = require('path');
const promisify = require('util.promisify');
const fs = require('fs');

const ensureDir = require('../../lib/utils/ensure-dir');

const writeFile = promisify(fs.writeFile);

module.exports = function bootstrapReactRepo(dirPath) {
  const nodeModulesPath = path.join(dirPath, 'node_modules');

  return ensureDir(nodeModulesPath).then(() =>
    Promise.all([
      createStubModule({
        moduleName: 'react',
        nodeModulesPath,
        indexJsContent: `console.log('react');`
      }),
      createStubModule({
        moduleName: 'react-dom',
        nodeModulesPath,
        indexJsContent: `console.log('react-dom');`
      })
    ])
  );
};

// Creates a directory  containing `index.js` & `package.json`
function createStubModule({ moduleName, nodeModulesPath, indexJsContent }) {
  const modulePath = path.join(nodeModulesPath, moduleName);

  return ensureDir(modulePath).then(() =>
    Promise.all([
      writeFile(path.join(modulePath, 'index.js'), indexJsContent),
      writeFile(
        path.join(modulePath, 'package.json'),
        `{
            "name": "${moduleName}",
            "version": "1.0.0",
            "description": "",
            "main": "index.js",
            "scripts": {
            },
            "author": "",
            "license": "ISC"
          }`
      )
    ])
  );
}

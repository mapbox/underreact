'use strict';

const fse = require('fs-extra');
const path = require('path');

module.exports = function bootstrapReactRepo(dirPath) {
  const nodeModulesPath = path.join(dirPath, 'node_modules');
  return fse
    .ensureDir(dirPath)
    .then(() =>
      createStubModule('react', nodeModulesPath, `console.log('react');`)
    )
    .then(() =>
      createStubModule(
        'react-dom',
        nodeModulesPath,
        `console.log('react-dom');`
      )
    );
};

/**
 * Creates a directory  containing `index.js` & `package.json`
 * @param {string} moduleName name of module
 * @param {string} nodeModulePath the path of node_modules dir
 * @param {*} indexContent the content of index.js
 */
function createStubModule(moduleName, nodeModulePath, indexContent) {
  const modulePath = path.join(nodeModulePath, moduleName);
  return fse
    .ensureDir(modulePath)
    .then(() => fse.writeFile(path.join(modulePath, 'index.js'), indexContent))
    .then(() =>
      fse.writeFile(
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
    );
}

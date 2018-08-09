'use strict';

const getDotenvFiles = require('./get-dotenv-files');

module.exports = function setEnv(rootDirectory = process.cwd()) {
  const dotenvFiles = getDotenvFiles(rootDirectory);
  // https://github.com/motdotla/dotenv
  // https://github.com/motdotla/dotenv-expand
  dotenvFiles.forEach(dotenvFile => {
    require('dotenv-expand')(
      require('dotenv').config({
        path: dotenvFile
      })
    );
  });
};

'use strict';
const path = require('path');
const fs = require('fs');

module.exports = function getDotenvFiles(rootDirectory = process.cwd()) {
  const NODE_ENV = process.env.NODE_ENV;
  const dontenvPath = path.join(rootDirectory, '.env');

  // https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
  const dotenvFiles = [
    NODE_ENV && `${dontenvPath}.${NODE_ENV}.local`,
    NODE_ENV && `${dontenvPath}.${NODE_ENV}`,
    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    NODE_ENV !== 'test' && `${dontenvPath}.local`,
    dontenvPath
  ]
    .filter(Boolean)
    .filter(file => fs.existsSync(file));

  return dotenvFiles;
};
'use strict';
const path = require('path');
const fs = require('fs');

module.exports = function getDotenvFiles(rootDirectory = process.cwd()) {
  const DEPLOY_ENV = process.env.DEPLOY_ENV || process.env.NODE_ENV;
  const dontenvPath = path.join(rootDirectory, '.env');

  // https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
  const dotenvFiles = [
    DEPLOY_ENV && `${dontenvPath}.${DEPLOY_ENV}.local`,
    DEPLOY_ENV && `${dontenvPath}.${DEPLOY_ENV}`,
    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    DEPLOY_ENV !== 'test' && `${dontenvPath}.local`,
    dontenvPath
  ]
    .filter(Boolean)
    .filter(file => fs.existsSync(file));

  return dotenvFiles;
};

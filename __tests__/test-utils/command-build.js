'use strict';

const path = require('path');

const spawn = require('./spawn-promise');

module.exports = function commandBuild({ env, cwd, args = [] } = {}) {
  env = Object.assign({}, process.env, { NODE_ENV: '', BABEL_ENV: '' }, env);
  return spawn('node', [path.resolve('./bin/underreact'), 'build', ...args], {
    env,
    cwd
  });
};

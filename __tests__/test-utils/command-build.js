'use strict';

const spawn = require('cross-spawn');

module.exports = function commandBuild(argv, { env, stdio = 'inherit' } = {}) {
  env = Object.assign({}, process.env, { NODE_ENV: '', BABEL_ENV: '' }, env);
  return spawn.sync('node', ['./bin/underreact', 'build', ...argv], {
    stdio,
    env
  });
};

'use strict';
const path = require('path');

const spawn = require('cross-spawn');

module.exports = function commandBuild(
  argv,
  { env, stdio = 'inherit', cwd } = {}
) {
  env = Object.assign({}, process.env, { NODE_ENV: '', BABEL_ENV: '' }, env);
  return spawn.sync(
    'node',
    [path.resolve('./bin/underreact'), 'build', ...argv],
    {
      stdio,
      env,
      cwd
    }
  );
};

'use strict';

const del = require('del');

// returns the `del` module but injects the `force=true`
// option to allow for overwriting outside the <rootDir>
module.exports = function() {
  const hijackArgs = function(args) {
    args[1] = Object.assign({}, args[1], { force: true });
    return args;
  };
  const mock = function() {
    return del.apply(this, hijackArgs(Array.from(arguments)));
  };
  mock.sync = function() {
    return del.sync.apply(this, hijackArgs(Array.from(arguments)));
  };
  return mock;
};

'use strict';

const crossSpawn = require('cross-spawn');

module.exports = function spawn(cmd, args, options) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const cp = crossSpawn(cmd, args, options);
    cp.stdout.on('data', data => {
      buffer += data.toString();
    });
    cp.stderr.on('data', data => {
      buffer += data.toString();
    });
    cp.on('error', err => {
      if (buffer.length > 0) {
        reject(buffer);
      } else {
        reject(err);
      }
    });
    cp.on('close', code => {
      if (code === 0) {
        resolve(buffer);
      } else {
        reject(buffer);
      }
    });
  });
};

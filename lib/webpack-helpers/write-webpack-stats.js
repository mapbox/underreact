'use strict';

const fs = require('fs');
const path = require('path');
const promisify = require('util.promisify');

function writeWebpackStats(dir, stats) {
  return promisify(fs.writeFile)(
    path.join(dir, 'webpack-stats.json'),
    JSON.stringify(stats.toJson())
  );
}

module.exports = writeWebpackStats;

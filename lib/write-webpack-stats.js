'use strict';

const fs = require('fs');
const path = require('path');

function writeWebpackStats(dir, stats) {
  fs.writeFileSync(
    path.join(dir, 'webpack-stats.json'),
    JSON.stringify(stats.toJson())
  );
}

module.exports = writeWebpackStats;

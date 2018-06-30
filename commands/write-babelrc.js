'use strict';

const fs = require('fs');
const path = require('path');
const createBabelConfig = require('../lib/create-babel-config');

function writeBabelrc(cl, dir, env) {
  const babelConfig = createBabelConfig({
    env,
    customPresets: cl.babelPresets,
    customPlugins: cl.babelPlugins,
    devBrowserslist: cl.devBrowserslist
  });
  fs.writeFileSync(
    path.join(dir, '.babelrc'),
    JSON.stringify(babelConfig, null, 2)
  );
}

module.exports = writeBabelrc;

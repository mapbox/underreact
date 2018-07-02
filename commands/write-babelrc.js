'use strict';

const fs = require('fs');
const path = require('path');
const createBabelConfig = require('../lib/create-babel-config');
const logger = require('../lib/logger');

function writeBabelrc(urc, dir, env) {
  const babelConfig = createBabelConfig({
    env,
    customPresets: urc.babelPresets,
    customPlugins: urc.babelPlugins,
    devBrowserslist: urc.devBrowserslist
  });

  try {
    fs.writeFileSync(
      path.join(dir, '.babelrc'),
      JSON.stringify(babelConfig, null, 2)
    );
  } catch (error) {
    logger.error(error);
  }
}

module.exports = writeBabelrc;

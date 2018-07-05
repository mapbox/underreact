'use strict';

const fs = require('fs');
const path = require('path');
const createBabelConfig = require('../lib/packageable/create-babel-config');
const logger = require('../lib/logger');

function writeBabelrc(urc, dir) {
  const testConfig = createBabelConfig({
    env: 'node',
    customPresets: urc.babelPresets,
    customPlugins: urc.babelPlugins
  });
  const developmentConfig = createBabelConfig({
    env: 'development',
    customPresets: urc.babelPresets,
    customPlugins: urc.babelPlugins
  });
  const productionConfig = createBabelConfig({
    env: 'production',
    customPresets: urc.babelPresets,
    customPlugins: urc.babelPlugins
  });
  const fullConfig = {
    env: {
      test: testConfig,
      development: developmentConfig,
      production: productionConfig
    }
  };

  try {
    fs.writeFileSync(
      path.join(dir, '.babelrc'),
      JSON.stringify(fullConfig, null, 2)
    );
  } catch (error) {
    logger.error(error);
  }
}

module.exports = writeBabelrc;

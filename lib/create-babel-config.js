'use strict';

const fs = require('fs');
const path = require('path');

// We'll use the Node env when writing .babelrc, because the assumed use
// case for that .babelrc file is Node processes that look at Babel
// like Jest and Ava.
const nodeEnvOptions = { targets: { node: 'current' } };

function createBabelConfig(cl) {
  // require.resolve the defaults so we get the npm package relative to this
  // file, rather than relative to the user's files.
  const nonEnvPresets = [
    require.resolve('babel-preset-react'),
    ...cl.babelPresets
  ];

  const plugins = [
    require.resolve('babel-plugin-syntax-dynamic-import'),
    require.resolve('babel-plugin-transform-class-properties'),
    require.resolve('babel-plugin-transform-object-rest-spread'),
    ...cl.babelPlugins
  ];

  if (!cl.production) {
    plugins.push(require.resolve('babel-plugin-transform-react-jsx-source'));
    plugins.push(require.resolve('babel-plugin-transform-react-jsx-self'));
  }

  // Always create and write a .babelrc that includes the same plugins and
  // presets but is targeting Node. This is useful for Jest or any other
  // processes that may read your source files in Node.
  const babelrcContent = {
    presets: [
      [require.resolve('babel-preset-env'), nodeEnvOptions],
      ...nonEnvPresets
    ],
    plugins
  };
  writeBabelrc(cl.rootDirectory, babelrcContent);

  const envOptions = {
    modules: false,
    useBuiltIns: false,
    targets: {
      browsers: cl.browserslist
    }
  };

  const presets = [
    [require.resolve('babel-preset-env'), envOptions],
    ...nonEnvPresets
  ];

  if (cl.production) {
    plugins.push(
      require.resolve('babel-plugin-transform-react-remove-prop-types')
    );
  }

  return {
    presets,
    plugins
  };
}

function writeBabelrc(dir, config) {
  const relativize = p => {
    if (Array.isArray(p)) {
      return [`./${path.relative(dir, p[0])}`, p[1]];
    }
    return `./${path.relative(dir, p)}`;
  };
  // Make all the paths relative to the file. That way the file can reference
  // plugins/presets that are dependencies of *this* package, not direct
  // dependencies of the user's.
  const relativeConfig = {
    presets: config.presets.map(relativize),
    plugins: config.plugins.map(relativize)
  };
  fs.writeFileSync(
    path.join(dir, '.babelrc'),
    JSON.stringify(relativeConfig, null, 2)
  );
}

module.exports = createBabelConfig;

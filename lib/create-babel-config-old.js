'use strict';

const fs = require('fs');
const path = require('path');

// **Much of this mimics create-react-app's config.**
// Check that regularly to be exposed to problems and new ideas.

// We'll use the Node env when writing .babelrc, because the assumed use
// case for that .babelrc file is Node processes that look at Babel
// like Jest and Ava.
const nodeEnvOptions = { targets: { node: 'current' } };

function createBabelConfig(cl) {
  // require.resolve the defaults so we get the npm package relative to this
  // file, rather than relative to the user's files.
  const universalPresets = [
    require.resolve('babel-preset-react'),
    ...cl.babelPresets
  ];

  const universalPlugins = [
    // Necessary to include regardless of the environment because
    // in practice some other transforms (such as object-rest-spread)
    // don't work without it: https://github.com/babel/babel/issues/7215
    require.resolve('babel-plugin-transform-es2015-destructuring'),
    require.resolve('babel-plugin-transform-class-properties'),
    // useBuiltIns for these plugins means they'll rely on Object.assign
    // being available, instead of adding their own polyfill.
    [
      require.resolve('babel-plugin-transform-object-rest-spread'),
      { useBuiltIns: true }
    ],
    [
      require.resolve('babel-plugin-transform-react-jsx'),
      { useBuiltIns: true }
    ],
    // Polyfills the runtime needed for async/await and generators
    [
      require.resolve('babel-plugin-transform-runtime'),
      {
        helpers: false,
        polyfill: false,
        regenerator: true
      }
    ],
    ...cl.babelPlugins
  ];

  if (!cl.production) {
    universalPlugins.push(
      require.resolve('babel-plugin-transform-react-jsx-source')
    );
    universalPlugins.push(
      require.resolve('babel-plugin-transform-react-jsx-self')
    );
  }

  // Always create and write a .babelrc that includes the same plugins and
  // presets but is targeting Node. This is useful for Jest or any other
  // processes that may read your source files in Node.
  const nodePlugins = [
    // Compiles import() to a deferred require()
    require.resolve('babel-plugin-dynamic-import-node'),
    ...universalPlugins
  ];
  const babelrcContent = {
    presets: [
      [require.resolve('babel-preset-env'), nodeEnvOptions],
      ...universalPresets
    ],
    plugins: nodePlugins
  };
  writeBabelrc(cl.rootDirectory, babelrcContent);

  const envOptions = {
    modules: false,
    useBuiltIns: false,
    targets: cl.production ? { uglify: true } : { browsers: cl.devBrowserslist }
  };

  const presets = [
    [require.resolve('babel-preset-env'), envOptions],
    ...universalPresets
  ];

  const browserPlugins = [
    require.resolve('babel-plugin-syntax-dynamic-import'),
    ...universalPlugins
  ];
  if (cl.production) {
    browserPlugins.push(
      require.resolve('babel-plugin-transform-react-remove-prop-types')
    );
  }

  return {
    presets,
    plugins: browserPlugins
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

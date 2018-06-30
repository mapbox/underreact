'use strict';

// **Much of this mimics create-react-app's config.**
// Check that regularly to be exposed to problems and new ideas.

function createBabelConfig({
  customPresets = [],
  customPlugins = [],
  // development, production, node
  env = 'development',
  react = true,
  devBrowserslist
}) {
  const envIsNode = env === 'node';
  const envIsWebpack = !envIsNode;
  const envIsWebpackProduction = env === 'production';
  const envIsWebpackDevelopment = env === 'development';

  const envOptions = {
    modules: envIsNode
  };
  if (envIsNode) {
    envOptions.targets = { node: 'current' };
  } else if (envIsWebpackDevelopment && devBrowserslist) {
    envOptions.targets = { browsers: devBrowserslist };
  } else {
    envOptions.targets = { uglify: true };
  }

  // require.resolve the defaults so we get the npm package relative to this
  // file, rather than relative to the user's files.
  const presets = [
    [require.resolve('babel-preset-env'), envOptions],
    react && require.resolve('babel-preset-react'),
    ...customPresets
  ].filter(Boolean);

  const plugins = [
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
    react && [
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
    envIsNode && require.resolve('babel-plugin-dynamic-import-node'),
    envIsWebpack && require.resolve('babel-plugin-syntax-dynamic-import'),
    react &&
      envIsWebpackDevelopment &&
      require.resolve('babel-plugin-transform-react-jsx-source'),
    react &&
      envIsWebpackDevelopment &&
      require.resolve('babel-plugin-transform-react-jsx-self'),
    react &&
      envIsWebpackProduction &&
      require.resolve('babel-plugin-transform-react-remove-prop-types'),
    ...customPlugins
  ].filter(Boolean);

  return {
    presets,
    plugins
  };
}

module.exports = createBabelConfig;

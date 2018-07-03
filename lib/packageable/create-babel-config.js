'use strict';

// **Much of this mimics create-react-app's config.**
// Check that regularly to be exposed to weird problems and new ideas.

// Returns a serializable Babel configuration object.
function createBabelConfig({
  // Should be absolute paths.
  customPresets = [],
  // Should be absolute paths.
  customPlugins = [],
  // 'development'|'production'|'node'
  mode = 'development'
} = {}) {
  const modeIsNode = mode === 'node';
  const modeIsWebpack = !modeIsNode;
  const modeIsWebpackProduction = mode === 'production';
  const modeIsWebpackDevelopment = mode === 'development';

  const envOptions = {
    modules: modeIsNode
  };
  if (modeIsNode) {
    envOptions.targets = { node: 'current' };
  }

  // require.resolve the defaults so we get the npm package relative to this
  // file, rather than relative to the user's files.
  const presets = [
    [require.resolve('babel-preset-env'), envOptions],
    require.resolve('babel-preset-react'),
    ...customPresets
  ].filter(Boolean);

  const plugins = [
    // Necessary to include regardless of the modeironment because
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
    modeIsNode && require.resolve('babel-plugin-dynamic-import-node'),
    modeIsWebpack && require.resolve('babel-plugin-syntax-dynamic-import'),
    modeIsWebpackDevelopment &&
      require.resolve('babel-plugin-transform-react-jsx-source'),
    modeIsWebpackDevelopment &&
      require.resolve('babel-plugin-transform-react-jsx-self'),
    modeIsWebpackProduction &&
      require.resolve('babel-plugin-transform-react-remove-prop-types'),
    ...customPlugins
  ].filter(Boolean);

  return {
    presets,
    plugins
  };
}

module.exports = createBabelConfig;

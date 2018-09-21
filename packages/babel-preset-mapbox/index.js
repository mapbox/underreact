'use strict';
const isPlainObj = require('is-plain-obj');

module.exports = function(api, opts) {
  const { plugins, presets } = preset.call(this, api, opts);

  // this is done in order to easily test this module
  const requireModule = entity => {
    const esmInterop = obj =>
      obj.hasOwnProperty('default') ? obj.default : obj;

    if (Array.isArray(entity)) {
      return [esmInterop(require(entity[0])), entity[1]];
    }
    return esmInterop(require(entity));
  };

  return {
    plugins: plugins.map(requireModule),
    presets: presets.map(requireModule)
  };
};

module.exports.babelPresetMapbox = preset;

function preset(api, opts) {
  const env = process.env.BABEL_ENV || process.env.NODE_ENV || 'development';

  opts = opts || {};

  const isEnvDevelopment = env === 'development';
  const isEnvProduction = env === 'production';
  const isEnvTest = env === 'test';

  if (!isEnvDevelopment && !isEnvProduction && !isEnvTest) {
    throw new Error(
      'Using `@mapbox/babel-preset-mapbox` requires that you specify `NODE_ENV` or ' +
        '`BABEL_ENV` environment variables. Valid values are "development", ' +
        '"test", and "production". Instead, received: ' +
        JSON.stringify(env) +
        '.'
    );
  }

  if (!isPlainObj(opts)) {
    throw new Error(
      '`@mapbox/babel-preset-mapbox` expects an object as an option.'
    );
  }

  // prevent ambiguity if user is using both
  if (process.env.BROWSERSLIST && opts['@babel/preset-env']) {
    throw new Error(
      'Please do not use process.env.BROWSERSLIST and `babel-preset-env` together.'
    );
  }

  opts = Object.assign({}, opts);

  const presets = [
    {
      name: '@babel/preset-react',
      options: {
        // Adds component stack to warning messages
        // Adds __self attribute to JSX which React will use for some warnings
        development: isEnvDevelopment || isEnvTest,
        // Will use the native Object.assign instead of trying to polyfill
        // it.
        useBuiltIns: true
      }
    },
    {
      name: '@babel/preset-env',
      conditional: [
        isEnvTest && {
          targets: {
            node: 'current'
          }
        },
        (isEnvProduction || isEnvDevelopment) && {
          // `entry` transforms `@babel/polyfill` into individual requires for
          // the targeted browsers. This is safer than `usage` which performs
          // static code analysis to determine what's required.
          // This is probably a fine default to help trim down bundles when
          // end-users inevitably import '@babel/polyfill'.
          useBuiltIns: 'entry',
          // Do not transform modules to CJS
          modules: false
        }
      ]
    }
  ]
    .filter(entity => filterConditionals(entity, env))
    .map(entity => toBabelFormat(entity, opts));

  const plugins = [
    {
      // Necessary to include regardless of the environment because
      // in practice some other transforms (such as object-rest-spread)
      // don't work without it: https://github.com/babel/babel/issues/7215
      name: '@babel/plugin-transform-destructuring'
    },
    {
      // Enable loose mode to use assignment instead of defineProperty
      // See discussion in https://github.com/facebook/create-react-app/issues/4263
      name: '@babel/plugin-proposal-class-properties',
      options: {
        loose: true
      }
    },
    {
      // Note that this assumes `Object.assign` is available.
      name: '@babel/plugin-proposal-object-rest-spread',
      options: { useBuiltIns: true }
    },
    {
      // Polyfills the runtime needed for async/await and generators
      name: '@babel/plugin-transform-runtime',
      options: {
        helpers: false,
        regenerator: true
      }
    },
    {
      name: '@babel/plugin-syntax-dynamic-import'
    },

    {
      name: 'babel-plugin-transform-dynamic-import',
      conditional: [isEnvTest]
    },
    {
      // Transpiles generator functions to babel regenerator
      name: '@babel/plugin-transform-regenerator',
      conditional: [
        !isEnvTest && {
          // Async functions are converted to generators by @babel/preset-env
          async: false
        }
      ]
    },
    {
      name: 'babel-plugin-transform-react-remove-prop-types',
      conditional: [
        isEnvProduction && {
          removeImport: true
        }
      ]
    }
  ]
    .filter(entity => filterConditionals(entity, env))
    .map(entity => toBabelFormat(entity, opts));

  return {
    plugins,
    presets
  };
}

function filterConditionals(entity, env) {
  // let any entity which doesn't have conditional property
  // be passed through.
  if (!entity.hasOwnProperty('conditional')) {
    return true;
  }

  const conditional = entity.conditional.filter(Boolean);

  if (conditional.length > 1) {
    throw new Error(`Duplicate of ${entity.name} found for environment ${env}`);
  }

  // The babel entity is supposed to be not used in this particular env.
  if (conditional.length === 0) {
    return false;
  }

  return true;
}

function toBabelFormat(entity, opts) {
  const userOptions = opts[entity.name];
  let entityOptions = entity.options;

  // use the env conditional option
  if (entity.hasOwnProperty('conditional')) {
    entityOptions = entity.conditional.filter(Boolean)[0];
  }

  // apply user overrides
  const options = Object.assign({}, entityOptions, userOptions);

  if (Object.keys(options).length === 0) {
    return entity.name;
  }
  return [entity.name, options];
}

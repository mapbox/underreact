'use strict';
const isPlainObj = require('is-plain-obj');

module.exports = function preset(context, opts) {
  opts = opts || {};
  // see https://github.com/facebook/create-react-app/blob/590df7eead1a2526828aa36ceff41397e82bd4dd/packages/babel-preset-react-app/index.js#L52
  const env = process.env.BABEL_ENV || process.env.NODE_ENV;
  if (
    env !== undefined &&
    env !== 'development' &&
    env !== 'test' &&
    env !== 'production'
  ) {
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
  if (
    (process.env.BROWSERSLIST && opts['babel-preset-env']) ||
    (process.env.BROWSERSLIST && opts['env'])
  ) {
    throw new Error(
      'Please do not use process.env.BROWSERSLIST and `babel-preset-env` together.'
    );
  }

  opts = Object.assign({}, opts);

  const isEnvDevelopment = env === 'development' || env === undefined;
  const isEnvProduction = env === 'production';
  const isEnvTest = env === 'test';
  let payload = [
    { name: 'babel-preset-react' },
    {
      // Necessary to include regardless of the environment because
      // in practice some other transforms (such as object-rest-spread)
      // don't work without it: https://github.com/babel/babel/issues/7215
      name: 'babel-plugin-transform-es2015-destructuring'
    },
    {
      name: 'babel-plugin-transform-class-properties'
    },
    {
      // useBuiltIns for these plugins means they'll rely on Object.assign
      // being available, instead of adding their own polyfill.
      name: 'babel-plugin-transform-object-rest-spread',
      options: { useBuiltIns: true }
    },
    {
      name: 'babel-plugin-transform-react-jsx',
      options: { useBuiltIns: true }
    },
    {
      name: 'babel-plugin-transform-runtime',
      options: {
        helpers: false,
        polyfill: false,
        regenerator: true
      }
    }
  ];

  if (isEnvTest) {
    payload.push(
      {
        name: 'babel-preset-env',
        options: {
          targets: {
            node: 'current'
          }
        }
      },
      // Compiles import() to a deferred require()
      {
        name: 'babel-plugin-dynamic-import-node'
      }
    );
  } else {
    const presetEnv = {
      name: 'babel-preset-env',
      options: {
        // Do not transform modules to CJS
        modules: false
      }
    };
    if (process.env.BROWSERSLIST) {
      presetEnv.options = {
        targets: {
          browsers: process.env.BROWSERSLIST
        }
      };
    }

    payload.push(
      presetEnv,
      // Adds syntax support for import()
      { name: 'babel-plugin-syntax-dynamic-import' }
    );
  }

  if (isEnvDevelopment || isEnvTest) {
    payload.push(
      { name: 'babel-plugin-transform-react-jsx-source' },
      { name: 'babel-plugin-transform-react-jsx-self' }
    );
  }

  if (isEnvProduction) {
    payload.push({
      name: 'babel-plugin-transform-react-remove-prop-types'
    });
  }

  payload = payload.map(item => {
    const userOptions = findProperty(opts, item.name);
    const options = Object.assign({}, item.options, userOptions);
    if (Object.keys(options).length === 0) {
      return item.name;
    }
    return [item.name, options];
  });

  return {
    plugins: filterOutPlugins(payload),
    presets: filterOutPresets(payload)
  };
};

function findProperty(data, name) {
  if (data[name]) {
    return data[name];
  }
  // NOTE: babel-preset & babel-plugin have same length
  const len = 'babel-preset-'.length;
  // If the user used a shorthand for eg. dynamic-import-node instead of babel-plugin-dynamic-import-node
  // remove `babel-*-` and then try to find it.
  return data[name.substring(len)];
}

function filterOutPlugins(payload) {
  return payload.filter(r => {
    const name = Array.isArray(r) ? r[0] : r;
    return name.startsWith('babel-plugin-');
  });
}
function filterOutPresets(payload) {
  return payload.filter(r => {
    const name = Array.isArray(r) ? r[0] : r;
    return name.startsWith('babel-preset-');
  });
}

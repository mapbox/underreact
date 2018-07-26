'use strict';

module.exports = function preset(context, opts) {
  opts = opts || [];
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

  if (!Array.isArray(opts)) {
    throw new Error(
      '`@mapbox/babel-preset-mapbox` expects an array as an option.'
    );
  }

  // a shorthand if you want to override one property
  if (opts.length === 2 && typeof opts[0] === 'string') {
    opts = [opts];
  }

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
    payload.push(
      {
        name: 'babel-preset-env',
        options: {
          // Do not transform modules to CJS
          modules: false
        }
      },
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
  const found = data.find(r => typeof r[0] === 'string' && r[0] === name);
  return found && found[1];
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

# @mapbox/babel-preset-mapbox

A configurable Babel preset which abstracts away the most common Babel plugins and presets needed to build a modern web application.

## Usage

This package works with **Babel 7 and above**. Install `@mapbox/babel-preset-mapbox` by running the following command at the root of your project:

```
npm install --save-dev @mapbox/babel-preset-mapbox
```

Then create a `babel.config.js` at the root of your project:

```
module.exports = {
  "presets": ["@mapbox/babel-preset-mapbox"]
}
```

### Configuration

`@mapbox/babel-preset-mapbox` is a simple wrapper around a bunch of Babel presets and plugins. You can customize each of the [babel preset/plugin](#which-babel-preset-and-plugin-does-it-use), by passing an object with keys and values representing the name and configuration of preset/plugin respectively. In the example below, we are customizing the defaults of `@babel/preset-react`:

```js
// babel.config.js
module.export = {
  presets: [
    '@mapbox/babel-preset-mapbox',
    {
      '@babel/preset-react': {
        pragma: 'dom'
      }
    }
  ]
};
```

**Note:** This option does a shallow merge with already existing properties in `@mapbox/babel-preset-mapbox`. If you want a more fine tuned control look at [Advanced Configuration](#advanced-configuration)

### Which Babel preset and plugin does it use?

- [@babel/preset-react](https://babeljs.io/docs/en/babel-preset-react)
- [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env)
- [@babel/plugin-proposal-class-properties](https://babeljs.io/docs/en/babel-plugin-proposal-class-properties)
- [@babel/plugin-transform-runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime)
- [@babel/plugin-syntax-dynamic-import](https://babeljs.io/docs/en/babel-plugin-syntax-dynamic-import)
- [babel-plugin-transform-dynamic-import](https://www.npmjs.com/package/babel-plugin-transform-dynamic-import)
- [babel-plugin-transform-react-remove-prop-types](https://www.npmjs.com/package/babel-plugin-transform-react-remove-prop-types)

### Modifying browser support with the help of `browserslist`

You can customize the amount of compilation done by giving a list of browsers you want to support. We use [browserslist](https://github.com/ai/browserslist) to parse this information, so you can use [any valid query format supported by browserslist](https://github.com/ai/browserslist#queries).

`@mapbox/babel-preset-mapbox` allows you to customize [browserslist](https://github.com/ai/browserslist) by using any of the methods mentioned [here](https://github.com/browserslist/browserslist#packagejson).

An example of setting the environment variable `BROWSERSLIST`:

```bash
export BROWSERSLIST=">0.25%, not ie 11"
npx babel script.js
```

You can also set the `BROWSERSLIST` environment variable in your node application before parsing code with Babel

```js
const babel = require('babel-core');
const fs = require('fs');

process.env.BROWSERSLIST = '>0.25%, not ie 11';

const srcCode = fs.readFileSync('./src/index.js', 'utf8');

const output = babel.transform(srcCode, {
  presets: [require('@mapbox/babel-preset-mapbox')],
  filename: 'index.js'
}).code;

console.log(output);
```

### Advanced configuration

You can pass a callback to the `override` option to fully customize this preset:

```js
// babel.config.js
module.exports = {
  presets: [
    [
      '@mapbox/babel-preset-mapbox',
      {
        override({ name, options }) {
          if (name === 'babel-plugin-transform-react-remove-prop-types') {
            // returning null removes plugin/preset.
            return null;
          }

          if (name === '@babel/preset-react') {
            // Completely change the option.
            return {
              pragma: 'h'
            };
          }

          if (name === '@babel/preset-env') {
            // Override a particular option
            return Object.assign({}, options, { debug: true });
          }

          // Do not override options for other plugins/presets
          return options;
        }
      }
    ]
  ]
};
```

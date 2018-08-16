# @mapbox/babel-preset-mapbox

A configurable Babel preset which abstracts away the most common Babel plugins and presets needed to build a modern web application.

## Usage

Install `babel-preset-mapbox` by running the following command at the root of your project:

```npm
npm install --save-dev @mapbox/babel-preset-mapbox
```

Then create a `.babelrc` at the root of your project:

```
// .babelrc
{
  "presets": ["@mapbox/babel-preset-mapbox"]
}
```

### Configuration

`babel-preset-mapbox` is a simple wrapper around a bunch of Babel presets and plugins. You can customize each of the [babel preset/plugin](#which-babel-preset-and-plugin-does-it-use), by passing an object with keys and values representing the name and configuration of preset/plugin respectively. In the example below, we are overriding the defaults of `transform-react-jsx`:

```
{
  "presets": ["@mapbox/babel-preset-mapbox", {
    'transform-react-jsx': {
      pragma: 'dom'
    }
  }]
}
```

## Which Babel preset and plugin does it use?

- [babel-plugin-dynamic-import-node](https://www.npmjs.com/package/babel-plugin-dynamic-import-node)
- [babel-plugin-syntax-dynamic-import](https://www.npmjs.com/package/babel-plugin-syntax-dynamic-import)
- [babel-plugin-transform-class-properties](https://www.npmjs.com/package/babel-plugin-transform-class-properties)
- [babel-plugin-transform-es2015-destructuring](https://www.npmjs.com/package/babel-plugin-transform-es2015-destructuring)
- [babel-plugin-transform-object-rest-spread](https://www.npmjs.com/package/babel-plugin-transform-object-rest-spread)
- [babel-plugin-transform-react-jsx-self](https://www.npmjs.com/package/babel-plugin-transform-react-jsx-self)
- [babel-plugin-transform-react-jsx-source](https://www.npmjs.com/package/babel-plugin-transform-react-jsx-source)
- [babel-plugin-transform-react-remove-prop-types](https://www.npmjs.com/package/babel-plugin-transform-react-remove-prop-types)
- [babel-plugin-transform-runtime](https://www.npmjs.com/package/babel-plugin-transform-runtime)
- [babel-preset-env](https://www.npmjs.com/package/babel-preset-env)
- [babel-preset-react](https://www.npmjs.com/package/babel-preset-react)

### Modifying browser support with the help of `browserslist`

You can customize the amount of compilation done by giving a list of browsers you want to support. We use [browserslist](https://github.com/ai/browserslist) to parse this information, so you can use [any valid query format supported by browserslist](https://github.com/ai/browserslist#queries).

`@mapbox/babel-preset-mapbox` allows you to customize [browserslist](https://github.com/ai/browserslist) by setting the environment variable `BROWSERSLIST`. You can set it directly in your shell before running Babel:

```bash
export BROWSERSLIST=">0.25%, not ie 11"
npx babel script.js
```

Make sure your `.babelrc` files includes the `@mapbox/babel-preset-mapbox` preset:

```
// .babelrc
{
  "presets": [
    "@mapbox/babel-preset-mapbox"
  ]
}
```

You can also set the `BROWSERSLIST` environment variable in your node application before parsing code with Babel and `"@mapbox/babel-preset-mapbox"`:

```js
const babel = require('babel-core');

process.env.BROWSERSLIST = ">0.25%, not ie 11";

babel.transform(code, {
    presets: [require.resolve('@mapbox/babel-preset-mapbox')],
    filename: 'source.js'
}).code;
```

**Note:** Please avoid using [babel-preset-env](https://www.npmjs.com/package/babel-preset-env) to define your browser support. Using it would throw an **error** to avoid conflicting with the `BROWSERSLIST` env var. You should instead just set the value of environment variable `BROWSERSLIST`. If your use case doesn't allow for this, please feel free to open a ticket about it.

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

`babel-preset-mapbox` uses [babel-preset-env](https://www.npmjs.com/package/babel-preset-env) internally to compile ES2015+ Javascript to older Javascript. You can customize the amount of compilation done by giving a list of browsers you want to support. We use [browserslist](https://github.com/ai/browserslist) to parse this information, so you can use [any valid query format supported by browserslist](https://github.com/ai/browserslist#queries).

```
{
  "presets": [
    "@mapbox/babel-preset-mapbox", {
      browserslist: [">0.25%", "not ie 11", "not op_mini all"]
    }
  ]
}
```

### Different configuration with node environment

If you want to have a different configuration for each node environments, for e.g. `production`, `test` or `development`, you can configure your `.babelrc` accordingly. In the example below, we are overriding the `browserslist` to target only Chrome for development environment. For more information visit [babelrc](https://babeljs.io/docs/en/babelrc).

```
{
  "env": {
    "production": {
      "presets": ["@mapbox/babel-preset-mapbox"],
    },
    "development": {
      "presets": ["@mapbox/babel-preset-mapbox", {
        browserslist: ["last 2 Chrome versions"]
      }]
    }
  }
}
```

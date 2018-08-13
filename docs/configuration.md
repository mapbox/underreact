# Configuration

**No configuration is necessary to get started.** On most production projects you'll want to set at least a few of the "Basic configuration" options. "Advanced configuration" options shouldn't be necessary in *most* cases ... but you never know.

## Table of contents

- [Basic configuration](#basic-configuration)
  - [siteBasePath](#sitebasepath)
  - [stylesheets](#stylesheets)
  - [browserslist](#browserslist)
  - [vendorModules](#vendormodules)
  - [environmentVariables](#environmentvariables)
  - [polyfills](#polyfills)
  - [devServerHistoryFallback](#devserverhistoryfallback)
- [Advanced configuration](#advanced-configuration)
  - [htmlSource](#htmlsource)
  - [postcssPlugins](#postcssplugins)
  - [webpackLoaders](#webpackloaders)
  - [webpackPlugins](#webpackplugins)
  - [webpackConfigTransform](#webpackconfigtransform)
  - [jsEntry](#jsentry)
  - [outputDirectory](#outputdirectory)
  - [publicDirectory](#publicdirectory)
  - [publicAssetsPath](#publicassetspath)
  - [port](#port)

## Basic configuration

### siteBasePath

Type: `string`. Default: `''`.

Root-relative path to the base directory on the domain where the site will be deployed.

There's a good chance your app isn't at the root of your domain. So this option represents the path of your site *within* that domain.

For example, if your app is at `https://www.special.com/ketchup/*`, you should set `siteBasePath: ketchup`.

### stylesheets

Type: `Array<string>`. Absolute paths, please. Default: `[]`.

An array of filenames pointing to stylesheets that you want to include in your site.

These will be processed by PostCSS with [Autoprefixer] and any other [`postcssPlugins`] that you specify; concatenated in the order specified; and added to the `<head>` of your document.

Assets referenced by your stylesheets will be hashed and copied to the [`outputDirectory`], unless they are absolute URLs.

### browserslist

Type: `string | Array<string>`. A valid [Browserslist](https://github.com/browserslist/browserslist) value. Default: `['defaults']`.

This value is used by Autoprefixer to set vendor prefixes in the CSS of your [`stylesheets`], and may in the future be used to determine Babel compilation via [`babel-preset-env`].

The default value uses Browserslist's default, which is `> 0.5%, last 2 versions, Firefox ESR, not dead`.

**You should probably make a deliberate decision and set this value.**

### vendorModules

Type: `Array<string>`. Default: `[]`.

Identifiers of npm modules that you want to be added to the vendor bundle.
The purpose of the vendor bundle is to deliberately group dependencies that change relatively infrequently — so this bundle will stay cached for longer than the others.

By default, the vendor bundle includes `react` and `react-dom`.

### environmentVariables

Type: `Array<string>`. Default: `[]`.

Environment variables that you'd like to make available in your client-side code. All you need to provide is the variable name, and it will be available at `process.env.${name}` in your JS.

For example, to make `DEPLOY_ENV` available in your code, set `environmentVariables: ['DEPLOY_ENV']`.

### polyfills

Type: `{ [string]: boolean }`. Default:

```js
{
  objectAssign: false,
  promise: false,
  fetch: false
}
```

Underreact makes it easy to turn on some key polyfills. Provide an object: each key is an option below and each value is a boolean (usually `true`). **All polyfills are off by default,** so turn on the ones you need, based on your own browser-support needs.

- `promise`: Polyfills `Promise`.
- `objectAssign`: Polyfills `Object.assign`.
- `fetch`: Polyfills `fetch`.

### devServerHistoryFallback

Type: `boolean`. Default: `false`.

Set to `true` if you want to use HTML5 History for client-side routing (as opposed to hash routing). This configures the development server to fall back to `index.html` when you request nested routes.

This is `false` by default because it should only be *intentionally* turned on, when you know you're going to configure your server to allow for HTML5 History—powered client-side routing.

## Advanced configuration

### htmlSource

Type: `string`. Absolute path, please. Default: `${project-directory}/src/html.js`.

The path to your HTML source file. For more information, read ["Defining your HTML"].

### postcssPlugins

Type: `Array<Function>`. Default: [Autoprefixer].

All of the CSS you load via [`stylesheets`] is run through [PostCSS](http://postcss.org/), so you can apply any [PostCSS plugins](https://github.com/postcss/postcss/blob/master/docs/plugins.md) to it.
By default, only [Autoprefixer] is applied.

### webpackLoaders

Type: `Array<Rule>`.

[Webpack `Rule`s](https://webpack.js.org/configuration/module/#rule) specifying additional loaders that you'd like to add your Webpack configuration.

If you need more fine-grained control over the Webpack configuration, use [`webpackConfigTransform`].

### webpackPlugins

Type: `Array<Object>`.

Additional plugins to add to your Webpack configuration.

For plugins exposed on the `webpack` module itself (e.g. `webpack.DefinePlugin`), **you should use Underreact's version of Webpack instead of installing your own.**
That will prevent any version incompatibilities.
That version is available in the context object passed to your configuration module function.

Here, for example, is how you could use the `DefinePlugin` in your `underreact.config.js`:

```js
module.exports = ({ webpack }) => {
  return {
    webpackPlugins: [new webpack.DefinePlugin(..)]
  };
}
```

### webpackConfigTransform

Type: `config => transformedConfig`. Default `x => x` (Identity function).

If you want to make changes to the Webpack configuration beyond what's available in the above options, you can use this, the nuclear option.
Your function receives the Webpack configuration that Underreact generates and returns a new Webpack configuration, representing your heart's desires.

### jsEntry

Type: `string`. Absolute path, please. Default: `${project-directory}/src/index.js`.

The entry JS file for your app. Typically this is the file where you'll use `react-dom` to render your app on an element.

In the default value, `project-directory` refers to the directory of your `underreact.config.js` file, or the current working directory.

### outputDirectory

Type `string`. Absolute path, please. Default: `${project-directory}/_underreact-site/`.

The directory where files should be written.

You'll want to ignore this directory with `.gitignore`, `.eslintignore`, etc.

In the default value, `project-directory` refers to the directory of your `underreact.config.js` file, or the current working directory.

### publicDirectory

Type `string`. Absolute path, please. Default: `${project-directory}/src/public/`.

Any files you put into this directory will be copied, without processing, into the [`outputDirectory`].
You can put images, favicons, data files, anything else you want in here.

In the default value, `project-directory` refers to the directory of your `underreact.config.js` file, or the current working directory.

### publicAssetsPath

Type: `string`. Default: `underreact-assets`.

The directory where Underreact assets will be placed, relative to the site's root.

By default, for example, the main JS chunk will be written to `underreact-assets/main.chunk.js`.

It's important to know about this value so you can set up caching and other asset configuration on your server.

### port

Type: `number`. Default: `8080`.

Preferred port for development servers.
If the specified port is unavailable, another port is used.

[autoprefixer]: https://github.com/postcss/autoprefixer

[`postcssplugins`]: #postcssplugins

[`outputdirectory`]: #outputdirectory

[`stylesheets`]: #stylesheets

[`webpackconfigtransform`]: #webpackconfigtransform

[`babel-preset-react`]: https://babeljs.io/docs/plugins/preset-react/

[`babel-preset-env`]: https://babeljs.io/docs/plugins/preset-env/

["defining your html"]: ../readme.md#defining-your-html

# @mapbox/underreact

🚨🚨 **WORK IN PROGRESS!** 🚨🚨

Minimal, extensible React app build system that you won't need to eject when things get weird.

It's a pretty thin wrapper around Babel, Webpack, and PostCSS, and will never accumulate an ecosystem of its own. And it aims to be just as useful for production applications with idiosyncratic demands as for simple prototypes.

## Table of contents

- [Installation](#installation)
  - [Getting started](#getting-started)
- [Usage](#usage)
  - [Defining your HTML](#defining-your-html)
- [Babel](#babel)
  - [Exposing .babelrc](#exposing-babelrc)
- [Deployment environments](#deployment-environments)
  - [Using environment variables](#using-environment-variables)
  - [Targeting multiple deployment environments](#targeting-multiple-deployment-environments)
  - [Why not use NODE_ENV?](#why-not-use-node_env)
  - [Using environment variables inside underreact.config.js](#using-environment-variables-inside-underreactconfigjs)
- [Underreact configuration file](#underreact-configuration-file)
- [Configuration Object Properties](#configuration-object-properties)
  - [devServerHistoryFallback](#devserverhistoryfallback)
  - [htmlSource](#htmlsource)
  - [jsEntry](#jsentry)
  - [outputDirectory](#outputdirectory)
  - [publicDirectory](#publicdirectory)
  - [publicAssetsPath](#publicassetspath)
  - [port](#port)
  - [browserslist](#browserslist)

## Installation

Requirements:

- Node 6+.

Install Underreact as a developer dependency of your project:

```
npm install ---save-dev @mapbox/underreact
```

If you are building a React application, you also need to install React dependencies:

```
npm install react react-dom
```

Add `_underreact*` to your `.gitignore`, and maybe other ignore files (e.g. `.eslintignore`). That way you'll ignore files that Underreact generates. (If you set the [outputDirectory](#outputdirectory) option, you'll want to do this for your custom value.)

### Getting started

**The bare minimum to get started with Underreact.**

- Create your entry JS file at `src/entry.js`.

```js
// src/entry.js
console.log('hello world!');
```

- Run it with `underreact`

```bash
npx underreact start 
# or 
node node_modules/.bin/underreact start
```

- Open the URL printed in your terminal.

**Using with React**

- Create your entry JS file at `src/entry.js`.

```jsx
// src/entry.js
import React from 'react';
import ReactDOM from 'react-dom';

class App extends React.Component {
  render() {
    return <div>Hello world</div>;
  }
}

const container = document.createElement('div');
document.body.appendChild(container);
ReactDOM.render(<App />, container);
```

- Run it with `underreact`

```bash
npx underreact start
```

- Open the URL printed in your terminal.

## Usage

You should not install the Underreact CLI globally. Instead, install it as a dependency of your project and use the `underreact` command via  `npx`, npm `"scripts"`, or `node_modules/.bin/underreact`. The easiest way is probably to set up npm scripts in `package.json`, so you can use `npm run start`, `npm run build`, etc., as needed.

The CLI provides the following commands:

- `start`: Start a development server.
- `build`: Build for deployment.
- `serve-static`: Serve the files that you built for deployment.

All commands look for `underreact.config.js` in the current working directory.

### Defining your HTML

Underreact is intended for single-page apps, so you only need one HTML page. Your JavaScript needs to use `react-dom` to render your application component into the HTML.

You have 2 choices:

- **Preferred:** Write a JS module exporting a function that returns an HTML string or a Promise that resolves with an HTML string. Put it at `src/html.js` (the default) or point to it with the [htmlSource](#htmlsource) configuration option.
- Provide no HTML-rendering module and let Underreact create a default document. *You should only do this for prototyping and early development*: for production projects, you'll definitely want to define your own HTML at some point, if only for the `<title>`.

In your JS module, you can use JS template literals to interpolate expressions, and you can use any async I/O you need to put together the page. For example, you could read JS files and inject their code directly into `<script>` tags, or inject CSS into `<style>` tags. Or you could make an HTTP call to fetch dynamic data and inject it into the page with a `<script>` tag, so it's available to your React app.

The function exported by your JS module will be passed a context object with the following properties:

- `renderJsBundles`: **You must use this function to add JS to the page.** Typically you'll invoke it at the end of your `<body>`. It adds the `<script>` tags that pull in Webpack bundles.
- `renderCssLinks`: **You must use this function to add CSS to the page,** unless your only sources of CSS are `<link>`s and `<style>`s that you write directly into your HTML. It will add CSS compiled from the [`stylesheets`](#stylesheets) option and also any CSS that was created through other Webpack plugins you added.
- `siteBasePath`: The [siteBasePath](#sitebasepath) you set in your configuration (or the default).
- `publicAssetsPath`: The [publicAssetsPath](#publicassetspath) you set in your configuration (or the default).
- `production`: Whether or not the HTML is being built in production mode. You may want to use this, for example, to decide whether or not to minify JS or CSS you are inlining into the HTML.

Here's an example of what an HTML-rendering module might look like:

```js
'use strict';

const fs = require('fs');
const path = require('path');
const minimizeJs = require('./minimize-js');

module.exports = ({ renderJsBundles, renderCssLinks, production }) => {
  let inlineJs = fs.readFileSync(path.join(__dirname, './path/to/some-script.js'));
  if (production) {
    inlineJs = minimizeJs(inlineJs);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
      <title>Words that rhyme with fish</title>
      <meta name="description" content="A website about words that rhyme with fish, like plish">
      <link href="https://api.mapbox.com/mapbox-assembly/v0.21.2/assembly.min.css" rel="stylesheet">
      ${renderCssLinks()}
      <script async defer src="https://api.mapbox.com/mapbox-assembly/v0.21.2/assembly.js"></script>
      <script>${inlineJs}</script>
    </head>
    <body>
      <div id="app">
        <!-- React app will be rendered into this div -->
      </div>
      ${renderJsBundles()}
    </body>

    </html>
  `;

  return html;
};
```

## Babel

Out of the box Underreact doesn't require you to setup a `.babelrc` file. It uses [`@mapbox/babel-preset-mapbox`](https://github.com/mapbox/underreact/tree/next/packages/babel-preset-mapbox) internally to provide a set of default configuration for your application.

### Exposing `.babelrc`

There are certain libraries that expect `.babelrc` to exist at the root your project. In this case it is best to create a `.babelrc` at the root of your project:

```npm
npm install --save-dev @mapbox/babel-preset-mapbox
```

```json5
// .babelrc
{
    "presets": [
        "@mapbox/babel-preset-mapbox"
    ]
}
```

While you are free to use any Babel presets & plugins, we strongly recommend you to use `@mapbox/babel-preset-mapbox` as it provides a good combination of presets and plugins that are necessary for any Underreact application to work properly. For more advanced configuration visit [`@mapbox/babel-preset-mapbox`](https://github.com/mapbox/underreact/tree/next/packages/babel-preset-mapbox).

## Deployment environments

### Using environment variables

Underreact allows you to inject environment variables **during the build time**. You can set them up by creating a `.env` file at the root of your project:

```
#.env
SERVER=https://example.com
```

You can then use them in your client-side code:

```javascript
const url = process.env.SERVER;
fetch(`${url}/data`);
```

All the variables in your environment **will not be automatically available** in your client-side code: any environment variable that you want to use in your app must be declared in the .env file. This is required to prevent unintentional leaking of env vars in your javascript bundle.

**Note: There is an exception to the above rule, [`DEPLOY_ENV`](#targeting-multiple-deployment-environments) & [`NODE_ENV`](#targeting-multiple-deployment-environments) are special environment variables in Underreact and they should never be set in `.env` files.**

If you want to pass an environment variable directly to Underreact command, make sure it is first declared in your `.env` file:

```
#.env
API_URL=https://example.com
```

Ypu can then override its value directly like this:

```
API_URL=https://one.two.com npx underreact start
```

You can also expand already existing env variables in your machine:

```
APP_VERSION=${npm_package_version}
```

Or expand local variables:

```
SERVER=https://example.com
SERVER_FOO=$SERVER/foo
```

### Targeting multiple deployment environments

Underreact allows your app to target different environments with the help of `DEPLOY_ENV` environment variable. There are certain things to keep in mind:

- If `DEPLOY_ENV` is not set it will default to `development` in development mode and `production` in production mode.
- It is recommended that you do not change the default value of `DEPLOY_ENV` when running in development mode.
- `DEPLOY_ENV` is generally recommended to be set to `staging` or `production` for production mode, but you can set it to any value you wish to better align with your target environments.
- `DEPLOY_ENV` is not the same as `NODE_ENV`, refer to [Why not use NODE_ENV](#why-not-use-node_env).
- Do not set `DEPLOY_ENV` in any of `.env` files, as it is expected to be already available in your environment.

Underreact allows you to have multiple `.env` files for different deployment targets. It can read the following type of `.env` files

- `.env:` Default.
- `.env.development`, `.env.staging`, `.env.production`: Deployment-specific settings.

The deployment target is defined by the env variable `DEPLOY_ENV`. Underreact would then find the file which matches the `.env.<DEPLOY_ENV>`. For example if your machine has `DEPLOY_ENV=staging`, Underreact would try to find `.env.staging`. 

**Note: values in `.env.<DEPLOY_ENV>` will override values in `.env`**. This also means you do not need to keep all the variables in `.env.<DEPLOY_ENV>` but only the ones that are supposed to override values set in `.env`.

The following example illustrates the how multiple env files work:

```
#.env
SERVER=example.com
TOKEN=abcd
```

```
#.env.mapbox
SERVER=mapbox.com
ANALYTICS=sentry.com
```

The final output of the code built with `DEPLOY_ENV=mapbox npx underreact build`, notice that `SERVER` value was overridden and a new value `ANALYTICS` was set:

```javascript
console.log(process.env.SERVER) // mapbox.com
console.log(process.env.TOKEN) // abcd
console.log(process.env.ANALYTICS) // sentry.com
```

However, if the code is built with just `npx underreact build`, Underreact would not load `.env.mapbox` as no explicit `DEPLOY_ENV` is set and it would default to `DEPLOY_ENV=production` as the mode is production.

```javascript
console.log(process.env.SERVER) // example.com
console.log(process.env.TOKEN) // abcd
console.log(process.env.ANALYTICS) // undefined
```

### Why not use `NODE_ENV`?

Underreact discourages setting of `NODE_ENV` manually, as a number of libraries depend on its value and a wrong value could result in unoptimized builds. You should instead use the cli `mode` option to signal optimization of your bundle. (Internally it would set `NODE_ENV` for your app.)

**If you are used to using `NODE_ENV` to target different deployment environments, you should instead use `DEPLOY_ENV`.**

### Using environment variables inside `underreact.config.js`

You can also use env variables in your `underreact.config.js`. This can allow you to have different config options for different deployment targets.

```js
// underreact.config.js
module.exports = {
    siteBasePath: process.env.SITE_BASE_PATH
};
```

## Underreact configuration file

Underreact expects a `underreact.config.js` file to exist at the root of your project. Please note that **No configuration is necessary to get started.** On most production projects you'll want to set at least a few of the [configuration object](#configuration-object-properties) properties.

Your `underreact.config.js` can look like either of the below:

- **Exporting a Function (Preferred)**: You can export a function which would then be used as a factory method for your [configuration object](#configuration-object-properties). This function is called the following parameter properties of an object:

```javascript
// underreact.config.js
/**
 * @param {Object} opts 
 * @param {Webpack} opts.webpack - The Webpack object.
 * @param {'start'|'build'|'serve-static'} opts.command - The current command Underreact is following.
 * @param {'production'|'development'} opts.mode - The current mode of Underreact.
 */
module.exports = function({ webpack, command, mode }) {
  return {/*Underreact configuration object*/}
}
```

- **Exporting an Object**: You can also directly export the [configuration object](#configuration-object-properties). This is a great way to start experimenting with Underreact's configuration. For example in the code below we simply want to modify the `siteBasePath`:

```javascript
// underreact.config.js
module.exports = {
   siteBasePath: 'fancy'
}
```

## Configuration Object Properties

### browserslist

Type: `Array<string>` \| `Object`. A valid [Browserslist](https://github.com/browserslist/browserslist) value. Default:`['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead']`.

This value is used by Autoprefixer to set vendor prefixes in the CSS of your stylesheets, and is used to determine Babel compilation via [babel-preset-env](#babel).

The default value uses Browserslist's default, which is `> 0.5%, last 2 versions, Firefox ESR, not dead`.

You can also target different settings for different Underreact modes, by sending an object:

```javascript
// underreact.config.js
{
module.exports = {
browserslist: {
production: [
'> 1%',
'ie 10'
],
development: [
'last 1 chrome version',
'last 1 firefox version'
]
}
}
}
```

### devServerHistoryFallback

Type: `boolean`. Default: `false`.

Set to `true` if you want to use HTML5 History for client-side routing (as opposed to hash routing). This configures the development server to fall back to `index.html` when you request nested routes.

This is `false` by default because it should only be *intentionally* turned on, when you know you're going to configure your server to allow for HTML5 History—powered client-side routing.

### htmlSource

Type: `string`. Absolute path, please. Default: `${project-directory}/src/html.js`.

The path to your HTML source file. For more information, read [Defining your HTML](#defining-your-html).

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

Any files you put into this directory will be copied, without processing, into the [outputDirectory](#outputdirectory).
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

### postcssPlugins

Type: `Array<Function>`. Default: [Autoprefixer](https://github.com/postcss/autoprefixer).

All of the CSS you load via [`stylesheets`](#stylesheets) is run through [PostCSS](http://postcss.org/), so you can apply any [PostCSS plugins](https://github.com/postcss/postcss/blob/master/docs/plugins.md) to it.
By default, only [Autoprefixer](https://github.com/postcss/autoprefixer) is applied.

### siteBasePath

Type: `string`. Default: `''`.

Root-relative path to the base directory on the domain where the site will be deployed.

There's a good chance your app isn't at the root of your domain. So this option represents the path of your site *within* that domain.

For example, if your app is at `https://www.special.com/ketchup/*`, you should set `siteBasePath: ketchup`.

### stylesheets

Type: `Array<string>`. Absolute paths, please. Default: `[]`.

An array of filenames pointing to stylesheets that you want to include in your site.

These will be processed by PostCSS with [Autoprefixer](https://github.com/postcss/autoprefixer) and any other [postcssPlugins](#postcssplugins) that you specify; concatenated in the order specified; and added to the `<head>` of your document.

Assets referenced by your stylesheets will be hashed and copied to the [outputDirectory](#outputdirectory), unless they are absolute URLs.

### webpackLoaders

Type: `Array<Rule>`.

[Webpack `Rule`s](https://webpack.js.org/configuration/module/#rule) specifying additional loaders that you'd like to add your Webpack configuration.

If you need more fine-grained control over the Webpack configuration, use [webpackConfigTransform](#webpackconfigtransform).

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

Type: `config => transformedConfig`. Default `x => x` (identify function).

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

Any files you put into this directory will be copied, without processing, into the [outputDirectory](#outputdirectory).
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

### browserslist

Type: `Array<string>` \| `Object`. A valid [Browserslist](https://github.com/browserslist/browserslist) value. Default:`['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead']`.

This value is used by Autoprefixer to set vendor prefixes in the CSS of your stylesheets, and is used to determine Babel compilation via [babel-preset-env](#babel).

The default value uses Browserslist's default, which is `> 0.5%, last 2 versions, Firefox ESR, not dead`.

You can also target different settings for different Underreact modes, by sending an object:

```javascript
// underreact.config.js
{
  module.exports = {
    browserslist: {
      production: [
        '> 1%',
        'ie 10'
      ],
      development: [
        'last 1 chrome version',
        'last 1 firefox version'
      ]
    }
  }
}
```

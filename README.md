# @mapbox/underreact

🚨🚨 **WORK IN PROGRESS!** 🚨🚨

Minimal, extensible React app build system that you won't need to eject when things get weird.

It's a pretty thin wrapper around Babel, Webpack, and PostCSS, and will never accumulate an ecosystem of its own. And it aims to be just as useful for production applications with idiosyncratic demands as for simple prototypes.

## Table of contents

- [Installation](#installation)
  - [Getting started](#getting-started)
- [Usage](#usage)
  - [Defining your HTML](#defining-your-html)
- [Deployment environments](#deployment-environments)
  - [Using environment variables](#using-environment-variables)
  - [Targeting multiple deployment environments](#targeting-multiple-deployment-environments)
  - [Why not use NODE_ENV?](#why-not-use-node_env)
  - [Using environment variables inside underreact.config.js](#using-environment-variables-inside-underreactconfigjs)
  - [Configuration](#configuration)

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

Add `_underreact*` to your `.gitignore`, and maybe other ignore files (e.g. `.eslintignore`). That way you'll ignore files that Underreact generates. (If you set the [`outputDirectory`] option, you'll want to do this for your custom value.)

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

- **Preferred:** Write a JS module exporting a function that returns an HTML string or a Promise that resolves with an HTML string. Put it at `src/html.js` (the default) or point to it with the [`htmlSource`] configuration option.
- Provide no HTML-rendering module and let Underreact create a default document. *You should only do this for prototyping and early development*: for production projects, you'll definitely want to define your own HTML at some point, if only for the `<title>`.

In your JS module, you can use JS template literals to interpolate expressions, and you can use any async I/O you need to put together the page. For example, you could read JS files and inject their code directly into `<script>` tags, or inject CSS into `<style>` tags. Or you could make an HTTP call to fetch dynamic data and inject it into the page with a `<script>` tag, so it's available to your React app.

The function exported by your JS module will be passed a context object with the following properties:

- `renderJsBundles`: **You must use this function to add JS to the page.** Typically you'll invoke it at the end of your `<body>`. It adds the `<script>` tags that pull in Webpack bundles.
- `renderCssLinks`: **You must use this function to add CSS to the page,** unless your only sources of CSS are `<link>`s and `<style>`s that you write directly into your HTML. It will add CSS compiled from the [`stylesheets`] option and also any CSS that was created through other Webpack plugins you added.
- `siteBasePath`: The [`siteBasePath`] you set in your configuration (or the default).
- `publicAssetsPath`: The [`publicAssetsPath`] you set in your configuration (or the default).
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

### Configuration

See [`docs/configuration.md`](docs/configuration.md).

[`htmlsource`]: ./docs/configuration.md#htmlsource

[`sitebasepath`]: ./docs/configuration.md#sitebasepath

[`publicassetspath`]: ./docs/configuration.md#publicassetspath

[`outputdirectory`]: ./docs/configuration.md#outputdirectory

[`stylesheets`]: ./docs/configuration.md#stylesheets

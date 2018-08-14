#!/usr/bin/env node
'use strict';

const yargs = require('yargs');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');

const getCliOpts = require('../lib/utils/get-cli-opts');
// DO NOT REQUIRE anything here as env vars would not be set yet

// Sets up the config path and env variable as
// yargs middlewares are run right after parsing the argv
// https://github.com/yargs/yargs/blob/master/docs/advanced.md#middleware
const middlewares = [
  argv => {
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = argv.mode || 'production';
    }
    if (!process.env.DEPLOY_ENV) {
      process.env.DEPLOY_ENV = argv.mode || 'production';
    }

    // if the user specified a nonexistent path, tell them if it doesn't exist
    if (argv.config !== undefined && !fs.existsSync(argv.config)) {
      errorOut(
        new Error(
          `Failed to find the config file at ${chalk.underline(argv.config)}`
        )
      );
    }

    // if the user didn't specify a path use a default
    if (argv.config === undefined) {
      const { DEFAULT_CONFIG_NAME } = require('../lib/constants');
      // Make sure that including paths.js after setting env will read .env variables.
      delete require.cache[require.resolve('../lib/constants')];

      argv.config = path.join(process.cwd(), DEFAULT_CONFIG_NAME);
    }

    const setEnv = require('../lib/utils/set-env');
    const rootDir = path.dirname(path.resolve(argv.config));
    setEnv(rootDir);
  }
];

const configOption = [
  'config',
  {
    description: 'Path to your configuration module',
    alias: 'c',
    type: 'string',
    normalize: true
  }
];

const portOption = [
  'port',
  {
    description: 'Port',
    alias: 'p',
    type: 'number',
    default: 8080
  }
];

const statsOption = [
  'stats',
  {
    description:
      'Directory where Webpack stats should be written, for bundle analysis',
    alias: 's',
    type: 'string',
    normalize: true
  }
];

const modeOption = defaultMode => [
  'mode',
  {
    description: 'The optimization option for the build.',
    alias: 'm',
    choices: ['development', 'production'],
    default: defaultMode
  }
];

yargs
  .middleware(middlewares)
  .usage('$0 <command>')
  .command(
    'start [options]',
    'Start a development server.',
    defineStart,
    runStart
  )
  .command('build [options]', 'Build for deployment.', defineBuild, runBuild)
  .command(
    'serve-static [options]',
    'Serve the files you built for deployment.',
    defineServeStatic,
    runServeStatic
  )
  .demand(1, 'You must specify a command')
  .example('underreact start')
  .example('underreact build -c conf/clf.js')
  .example('underreact serve-static --port 3000')
  .help().argv;

function defineStart(y) {
  y.version(false)
    .option(...configOption)
    .option(...portOption)
    .option(...modeOption('development'))
    .option(...statsOption)
    .help();
}

function runStart(argv) {
  const start = require('../commands/start');
  const config = require('../lib/config');

  config(getCliOpts('start', argv))
    .then(urc => start(urc))
    .catch(errorOut);
}

function defineBuild(y) {
  y.version(false)
    .option(...configOption)
    .option(...modeOption('production'))
    .option(...statsOption)
    .help();
}

function runBuild(argv) {
  const build = require('../commands/build');
  const config = require('../lib/config');

  config(getCliOpts('build', argv))
    .then(urc => build(urc))
    .catch(errorOut);
}

function defineServeStatic(y) {
  y.version(false)
    .option(...configOption)
    .option(...portOption)
    .help();
}

function runServeStatic(argv) {
  const serveStatic = require('../commands/serve-static');
  const config = require('../lib/config');

  config(getCliOpts('serve-static', argv))
    .then(urc => serveStatic(urc))
    .catch(errorOut);
}

function errorOut(error) {
  const logger = require('../lib/logger');
  logger.error(error);
  process.exit(1);
}

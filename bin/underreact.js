#!/usr/bin/env node
'use strict';

const yargs = require('yargs');
const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');

const start = require('../commands/start');
const build = require('../commands/build');
const serveStatic = require('../commands/serve-static');
const logger = require('../lib/logger');
const { DEFAULT_CONFIG_NAME } = require('../lib/constants');
const normalizeConfig = require('../lib/normalize-config');
const getDefaultConfig = require('../lib/default-underreact.config');

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

yargs
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
    .option('production', {
      description: 'Build as though for production.',
      alias: 'r',
      type: 'boolean'
    })
    .option(...statsOption)
    .help();
}

function runStart(argv) {
  getConfig('start', argv)
    .then(urc => start(urc))
    .catch(errorOut);
}

function defineBuild(y) {
  y.version(false)
    .option(...configOption)
    .option('debug', {
      description: 'Build for debugging, not for production.',
      alias: 'd',
      type: 'boolean'
    })
    .option(...statsOption)
    .help();
}

function runBuild(argv) {
  getConfig('build', argv)
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
  getConfig('serve-static', argv)
    .then(urc => serveStatic(urc))
    .catch(errorOut);
}

function getConfig(command, argv) {
  const configIsNotSpecified = argv.config === undefined;
  let configPath;

  if (configIsNotSpecified) {
    configPath = path.join(process.cwd(), DEFAULT_CONFIG_NAME);
  } else {
    configPath = path.resolve(argv.config);
  }

  return userConfigReader(configPath)
    .catch(() => {
      // If the user didn't use --config, it's fine if the underreact.config.js
      // does not exist at the default path.
      if (configIsNotSpecified) {
        return () => {};
      }
      // But if they did specify a path, tell them it didn't work.
      throw new Error(
        `Failed to load underreact configuration module from ${chalk.underline(
          configPath
        )}`
      );
    })
    .then(getUserConfig => {
      let production = true;
      if (command === 'build') {
        production = !argv.debug;
      } else if (command === 'start') {
        production = argv.production;
      } else if (argv.env === 'prod') {
        production = true;
      }

      // This object is passed as the argument to the config module, if it's a
      // function.
      const configModuleContext = {
        webpack,
        command,
        production
      };

      const userConfig = getUserConfig(configModuleContext);
      const defaultConfig = getDefaultConfig(
        Object.assign({}, configModuleContext, {
          argv,
          configDir: path.dirname(configPath),
          stats: argv.stats,
          port: argv.port
        })
      );
      return normalizeConfig(userConfig, defaultConfig);
    });
}

function userConfigReader(configPath) {
  return Promise.resolve().then(() => {
    const configModule = require(configPath);
    return typeof configModule === 'function'
      ? configModule
      : () => configModule;
  });
}

function errorOut(error) {
  logger.error(error);
  process.exit(1);
}

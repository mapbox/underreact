#!/usr/bin/env node
'use strict';

const yargs = require('yargs');
const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');
const start = require('../commands/start');
const build = require('../commands/build');
const serveStatic = require('../commands/serve-static');
const logger = require('../lib/chunk-light-logger');

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
  .example('chunk-light start')
  .example('chunk-light build -c conf/clf.js')
  .example('chunk-light serve-static --port 3000')
  .help().argv;

function defineStart(y) {
  y.version(false)
    .option('config', {
      description: 'Path to your configuration module',
      alias: 'c',
      type: 'string',
      normalize: true
    })
    .option('port', {
      description: 'Port',
      alias: 'p',
      type: 'number',
      default: 8080
    })
    .option('production', {
      description: 'Build as though for production.',
      alias: 'r',
      type: 'boolean'
    })
    .option('stats', {
      description:
        'Directory where Webpack stats should be written, for bundle analysis',
      alias: 's',
      type: 'string',
      normalize: true
    })
    .help();
}

function runStart(argv) {
  const { config, configDir } = getConfigDetails('start', argv);
  try {
    start(config, configDir);
  } catch (error) {
    handleError(error);
  }
}

function defineBuild(y) {
  y.version(false)
    .option('config', {
      description: 'Path to your configuration module',
      alias: 'c',
      type: 'string',
      normalize: true
    })
    .option('debug', {
      description: 'Build for debugging, not for production.',
      alias: 'd',
      type: 'boolean'
    })
    .option('stats', {
      description:
        'Directory where Webpack stats should be written, for bundle analysis',
      alias: 's',
      type: 'string',
      normalize: true
    })
    .help();
}

function runBuild(argv) {
  const { config, configDir } = getConfigDetails('build', argv);
  try {
    build(config, configDir).catch(handleError);
  } catch (error) {
    handleError(error);
  }
}

function defineServeStatic(y) {
  y.version(false)
    .option('config', {
      description: 'Path to your configuration module',
      alias: 'c',
      type: 'string',
      normalize: true
    })
    .option('port', {
      description: 'Port',
      alias: 'p',
      type: 'number',
      default: 8080
    })
    .help();
}

function runServeStatic(argv) {
  const { config, configDir } = getConfigDetails('serve-static', argv);
  try {
    serveStatic(config, configDir);
  } catch (error) {
    handleError(error);
  }
}

function getConfigDetails(command, argv) {
  const configIsNotSpecified = argv.config === undefined;
  let configPath;
  if (configIsNotSpecified) {
    configPath = path.join(process.cwd(), 'chunk-light.config.js');
  } else {
    configPath = path.isAbsolute(argv.config)
      ? argv.config
      : path.join(process.cwd(), argv.config);
  }
  let production = true;
  if (command === 'build') {
    production = !argv.debug;
  } else if (command === 'start') {
    production = argv.production;
  }

  // This object is passed as the argument to the config module, if it's a
  // function.
  const configModuleContext = {
    webpack,
    command,
    production,
    argv
  };

  let config = {};
  // If the user didn't use --config, it's fine if the default does not exist.
  // But if they did specify a path, tell them if it doesn't work.
  try {
    const configModule = require(configPath);
    config =
      typeof configModule === 'function'
        ? configModule(configModuleContext)
        : configModule;
  } catch (error) {
    if (!configIsNotSpecified) {
      logger.log(
        `Failed to load configuration module from ${chalk.underline(
          configPath
        )}`
      );
    }
  }

  return {
    config: Object.assign({}, config, {
      production,
      stats: argv.stats,
      port: argv.port
    }),
    configDir: path.dirname(configPath)
  };
}

function handleError(error) {
  logger.error(error);
}

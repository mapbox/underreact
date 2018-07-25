#!/usr/bin/env node
'use strict';

const yargs = require('yargs');
const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');
const start = require('../commands/start');
const build = require('../commands/build');
const serveStatic = require('../commands/serve-static');
const writeBabelrc = require('../commands/write-babelrc');
const logger = require('../lib/logger');
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
  .command(
    'write-babelrc [options]',
    'Write a .babelrc file.',
    defineWriteBabelrc,
    runWriteBabelrc
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
  try {
    start(getConfig('start', argv));
  } catch (error) {
    errorOut(error);
  }
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
  try {
    build(getConfig('build', argv));
  } catch (error) {
    errorOut(error);
  }
}

function defineServeStatic(y) {
  y.version(false)
    .option(...configOption)
    .option(...portOption)
    .help();
}

function runServeStatic(argv) {
  try {
    serveStatic(getConfig('serve-static', argv));
  } catch (error) {
    errorOut(error);
  }
}

function defineWriteBabelrc(y) {
  y.version(false)
    .option(...configOption)
    .option('output', {
      description: 'Directory where .babelrc should be written',
      alias: 'o',
      type: 'string',
      normalize: true,
      default: '.'
    })
    .help();
}

function runWriteBabelrc(argv) {
  try {
    writeBabelrc(getConfig('write-babelrc', argv), argv.output, argv.env);
  } catch (error) {
    errorOut(error);
  }
}

function getConfig(command, argv) {
  const configIsNotSpecified = argv.config === undefined;
  let configPath;
  if (configIsNotSpecified) {
    configPath = path.join(process.cwd(), 'underreact.config.js');
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
  } else if (command === 'write-babelrc' && argv.env === 'prod') {
    production = true;
  }

  // This object is passed as the argument to the config module, if it's a
  // function.
  const configModuleContext = {
    webpack,
    command,
    production,
    argv,
    configDir: path.dirname(configPath),
    stats: argv.stats,
    port: argv.port
  };

  const defaultConfig = getDefaultConfig(configModuleContext);

  let userConfig = {};
  // If the user didn't use --config, it's fine if the default does not exist.
  // But if they did specify a path, tell them if it doesn't work.
  try {
    const configModule = require(configPath);
    userConfig =
      typeof configModule === 'function'
        ? configModule(configModuleContext)
        : configModule;
  } catch (error) {
    if (!configIsNotSpecified) {
      logger.error(
        `Failed to load configuration module from ${chalk.underline(
          configPath
        )}`
      );
    }
  }

  return normalizeConfig(userConfig, defaultConfig);
}

function errorOut(error) {
  logger.error(error);
  process.exit(1);
}

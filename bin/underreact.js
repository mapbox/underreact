#!/usr/bin/env node
'use strict';

const yargs = require('yargs');

const start = require('../commands/start');
const build = require('../commands/build');
const serveStatic = require('../commands/serve-static');
const logger = require('../lib/logger');
const config = require('../lib/config');

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
  config('start', argv)
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
  config('build', argv)
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
  config('serve-static', argv)
    .then(urc => serveStatic(urc))
    .catch(errorOut);
}

function errorOut(error) {
  logger.error(error);
  process.exit(1);
}

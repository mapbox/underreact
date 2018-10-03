'use strict';

const chalk = require('chalk');
const timestamp = require('time-stamp');
const { WebpackCompileError } = require('./webpack-helpers');

function stampedMessage(message) {
  const stamp = `[${chalk.grey(timestamp('HH:mm:ss'))} ${chalk.cyan(
    'underreact'
  )}]`;
  return `${stamp} ${message}`;
}

function log(message) {
  console.log(stampedMessage(message));
}

function error(err) {
  console.error(
    stampedMessage(`${chalk.bold.red('ERROR:')} ${err.message || err}`)
  );

  // If the error is thrown due to Webpack compilation error,
  // the `err.stack` is of no use to the users.
  if (err.stack && !(err instanceof WebpackCompileError)) {
    console.error(`\n${err.stack}`);
  }
}

module.exports = {
  log,
  error
};

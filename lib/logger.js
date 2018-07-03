'use strict';

const chalk = require('chalk');
const timestamp = require('time-stamp');

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
  if (err.stack) {
    console.error(`\n${err.stack}`);
  }
}

module.exports = {
  log,
  error
};

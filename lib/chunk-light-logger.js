'use strict';

const chalk = require('chalk');
const timestamp = require('time-stamp');

function stampedMessage(message) {
  const stamp = `[${chalk.grey(timestamp('HH:mm:ss'))} ${chalk.cyan(
    'chunk-light'
  )}]`;
  return `${stamp} ${message}`;
}

function log(message) {
  console.log(stampedMessage(message));
}

function error(message) {
  console.error(stampedMessage(message));
}

module.exports = {
  log,
  error
};

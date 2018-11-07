'use strict';

const urlJoin = require('url-join');
const chalk = require('chalk');

module.exports = function getReadyMessage(urc) {
  const localUrl = urlJoin(`http://localhost:${urc.port}`, urc.siteBasePath);
  const chevron = chalk.green.bold('>');
  let startMsg = chalk.green.bold('Ready!');
  startMsg += `\n  ${chevron} Access your site at ${chalk.bold.magenta.underline(
    localUrl
  )}`;
  return startMsg;
};

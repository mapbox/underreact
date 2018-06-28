'use strict';

const chalk = require('chalk');
const webpackFormatMessages = require('webpack-format-messages');

function renderWebpackErrors(stats) {
  if (!stats.hasErrors()) return;
  let result = `${chalk.red.bold('Error:')} Webpack compilation error.\n\n`;
  const formattedMessages = webpackFormatMessages(stats);
  formattedMessages.errors.forEach(errorMessage => {
    result += `${errorMessage}\n`;
  });
  return result;
}

module.exports = renderWebpackErrors;

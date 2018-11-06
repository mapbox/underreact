'use strict';

const webpackFormatMessages = require('webpack-format-messages');
const WebpackCompileError = require('./webpack-compile-error');

module.exports = normalizeWebpackError;

// This function normalizes errors thrown by Webpack
// into two categories:
// 1. WebpackCompilerError - As the name suggests, this is
//     due to some error in users code
// 2. Other errors - These are the errors which are not due to
//     the users code, but could be due to faulty configuration or
//     a bug.
function normalizeWebpackError({ error, stats }) {
  if (error) {
    if (error.name === 'ModuleNotFoundError') {
      return new WebpackCompileError(error);
    }
    return error;
  }
  const renderedErrors = renderWebpackErrors(stats);

  if (renderedErrors) {
    return new WebpackCompileError(renderedErrors);
  }
}

function renderWebpackErrors(stats) {
  if (!stats.hasErrors()) return;
  let result = `Compilation error.\n\n`;
  const formattedMessages = webpackFormatMessages(stats);
  formattedMessages.errors.forEach(errorMessage => {
    result += `${errorMessage}\n`;
  });
  return result;
}

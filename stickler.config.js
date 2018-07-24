'use strict';
// _underreact-site
// examples

module.exports = {
  ignore: ['_underreact-site', 'examples'],
  jsLint: {
    node: true,
    overrides: [
      {
        files: ['forward-event-client/**'],
        es5: true,
        browser: true
      },
      {
        files: ['test/**'],
        jest: true
      }
    ]
  }
};

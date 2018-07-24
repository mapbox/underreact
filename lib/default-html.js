'use strict';

module.exports = ({ renderCssLinks, renderJsBundles }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Underreact app</title>
      ${renderCssLinks()}
    </head>
    <body>
      <div id="app"></div>
      ${renderJsBundles()}
    </body>
    </html>
  `;
};
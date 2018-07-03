'use strict';

module.exports = ({ renderBundledScripts, renderCssLinks }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>fancy underreact features</title>
      ${renderCssLinks()}
    </head>
    <body>
      ${renderBundledScripts()}
    </body>
    </html>
  `;
};

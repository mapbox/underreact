'use strict';

module.exports = () => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>basic underreact app</title>
  <link href="https://api.mapbox.com/mapbox-assembly/v0.21.2/assembly.min.css" rel="stylesheet">
  <script async defer src="https://api.mapbox.com/mapbox-assembly/v0.21.2/assembly.js"></script>
  <script>console.log('inline JS worked just fine');</script>
</head>
<body>
  <div id="app"></div>
</body>
</html>`;
};

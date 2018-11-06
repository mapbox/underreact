'use strict';

const delay = t => new Promise(res => setTimeout(res, t));

function startServer() {
  // Give a slight delay to let build tasks settle
  return delay(400);
}

module.exports = startServer;

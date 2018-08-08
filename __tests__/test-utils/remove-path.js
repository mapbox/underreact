'use strict';

module.exports = function({ object, path, replaceWith }) {
  const newString = JSON.stringify(object).replace(
    new RegExp(path, 'g'),
    replaceWith
  );

  return JSON.parse(newString);
};

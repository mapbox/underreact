'use strict';

jest.mock('../utils/dynamic-require', () => jest.fn());

const dynamicRequire = require('../utils/dynamic-require');
const getUserConfig = require('./get-user-config');

test('Calls user config function with correct params', () => {
  const userConfigFunc = jest.fn();

  dynamicRequire.mockImplementationOnce(() => userConfigFunc);

  return getUserConfig({
    command: 'start',
    mode: 'development'
  }).then(() => {
    expect(userConfigFunc).toBeCalledWith({
      command: 'start',
      mode: 'development',
      webpack: require('webpack')
    });
  });
});

test('Returns an object if user exports an object', () => {
  const userConfig = {};
  dynamicRequire.mockImplementationOnce(() => userConfig);

  expect(
    getUserConfig({
      command: 'start',
      mode: 'development'
    })
  ).resolves.toBe(userConfig);
});

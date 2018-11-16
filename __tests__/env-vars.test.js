'use strict';

const path = require('path');
const fs = require('fs');
const dirTree = require('directory-tree');

const commandBuild = require('./test-utils/command-build');
const generateFixture = require('./test-utils/generate-fixture');

jest.setTimeout(15 * 1000);

describe('Env vars set in production mode', () => {
  let mainFileContent;
  const fixture = generateFixture({
    'underreact.config.js': `
      'use strict';
      module.exports = () => ({
          environmentVariables: {
            UNDERREACT_APP_TOKEN: 'a12f8298fe359b16032ae337a49e0c52b22d7d82'
          },

      });
    `,
    src: {
      'index.js': `
        console.log(process.env.UNDERREACT_APP_TOKEN);
      `
    }
  });

  beforeAll(() =>
    fixture
      .then(dirPath => commandBuild({ cwd: dirPath }).then(() => dirPath))
      .then(dirPath => {
        const tree = dirTree(path.join(dirPath, '_site', 'underreact-assets'));

        const mainFilename = tree.children
          .find(t => t.name === 'js')
          .children.find(t => t.name.startsWith('main')).path;

        mainFileContent = fs.readFileSync(mainFilename, 'utf-8');
      }));

  test('Includes the UNDERREACT_APP_TOKEN', () => {
    expect(
      mainFileContent.includes('a12f8298fe359b16032ae337a49e0c52b22d7d82')
    ).toBe(true);
  });
});

describe('Env vars set in development mode', () => {
  let mainFileContent;
  const fixture = generateFixture({
    'underreact.config.js': `
      'use strict';
      module.exports = () => ({
          environmentVariables: {
            UNDERREACT_APP_TOKEN: 'a12f8298fe359b16032ae337a49e0c52b22d7d82'
          },

      });
    `,
    src: {
      'index.js': `
        console.log(process.env.UNDERREACT_APP_TOKEN);
      `
    }
  });

  beforeAll(() =>
    fixture
      .then(dirPath =>
        commandBuild({ cwd: dirPath, args: ['-m=development'] }).then(
          () => dirPath
        )
      )
      .then(dirPath => {
        const tree = dirTree(path.join(dirPath, '_site', 'underreact-assets'));

        const mainFilename = tree.children
          .find(t => t.name === 'js')
          .children.find(t => t.name.startsWith('main')).path;

        mainFileContent = fs.readFileSync(mainFilename, 'utf-8');
      }));

  test('Includes the UNDERREACT_APP_TOKEN', () => {
    expect(
      mainFileContent.includes('a12f8298fe359b16032ae337a49e0c52b22d7d82')
    ).toBe(true);
  });
});

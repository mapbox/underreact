'use strict';

const path = require('path');
const fs = require('fs');
const dirTree = require('directory-tree');
const dotenv = require('dotenv');

const commandBuild = require('./test-utils/command-build');
const generateFixture = require('./test-utils/generate-fixture');

jest.setTimeout(15 * 1000);

describe('Env vars with clientEnvPrefix set', () => {
  let mainFileContent;
  let envObj;
  const fixture = generateFixture({
    'underreact.config.js': `
      'use strict';
      module.exports = () => ({
          clientEnvPrefix: 'UNDERREACT_APP_'
      });
    `,
    '.env': `
      SUPER_SECRET=45f23c279542d5884795c763bbaa01f554d09516
      UNDERREACT_APP_TOKEN=a12f8298fe359b16032ae337a49e0c52b22d7d82
    `,
    src: {
      'index.js': `
        console.log(process.env.SUPER_SECRET);
        console.log(process.env.UNDERREACT_APP_TOKEN);
      `
    }
  });

  beforeAll(() =>
    fixture
      .then(dirPath => commandBuild({ cwd: dirPath }).then(() => dirPath))
      .then(dirPath => {
        envObj = dotenv.parse(
          fs.readFileSync(path.join(dirPath, '.env'), 'utf-8')
        );

        const tree = dirTree(
          path.join(dirPath, '_underreact-site', 'underreact-assets')
        );

        const mainFilename = tree.children
          .find(t => t.name === 'js')
          .children.find(t => t.name.startsWith('main')).path;

        mainFileContent = fs.readFileSync(mainFilename, 'utf-8');
      }));

  test('Includes the UNDERREACT_APP_TOKEN', () => {
    expect(mainFileContent.includes(envObj.UNDERREACT_APP_TOKEN)).toBe(true);
  });

  test("Doesn't include the SUPER_SECRET", () => {
    expect(mainFileContent.includes(envObj.SUPER_SECRET)).toBe(false);
  });
});

describe('Setting DEPLOY_ENV should read the correct .env files', () => {
  const fixture = generateFixture({
    src: {
      'index.js': `
        console.log(process.env.TOKEN_A);
        console.log(process.env.TOKEN_B);
        console.log(process.env.TOKEN_C);
      `
    },
    '.env': `
      TOKEN_A=c4500a20f11e7d55778a5a167f0f7f506cd9ed9e
      TOKEN_B=5cddec57ac3c37f2dda0033f1c6c5f89d4271256
    `,
    '.env.abc': `
      TOKEN_B=5ed763209ffedc6a2ea566a0f47e416784251aec
      TOKEN_C=d7c74021aec43dac050d1d141bcb9027ab91ce5e
    `
  });
  let mainFileContent;
  let dotenvObj;
  let dotenvAbcObj;
  beforeAll(() =>
    fixture
      .then(dirPath => {
        return commandBuild({
          cwd: dirPath,
          env: { DEPLOY_ENV: 'abc' }
        }).then(() => dirPath);
      })
      .then(dirPath => {
        dotenvObj = dotenv.parse(
          fs.readFileSync(path.join(dirPath, '.env'), 'utf-8')
        );
        dotenvAbcObj = dotenv.parse(
          fs.readFileSync(path.join(dirPath, '.env.abc'), 'utf-8')
        );

        const tree = dirTree(
          path.join(dirPath, '_underreact-site', 'underreact-assets')
        );

        const mainFilename = tree.children
          .find(t => t.name === 'js')
          .children.find(t => t.name.startsWith('main')).path;

        mainFileContent = fs.readFileSync(mainFilename, 'utf-8');
      }));

  test('.env.abc overrides .env file vars', () => {
    expect(mainFileContent.includes(dotenvObj.TOKEN_B)).toBe(false);
    expect(mainFileContent.includes(dotenvAbcObj.TOKEN_B)).toBe(true);
  });

  test('.env vars not in .env.abc are set correctly ', () => {
    expect(mainFileContent.includes(dotenvObj.TOKEN_A)).toBe(true);
  });

  test('.env.abc vars not in .env are set correctly ', () => {
    expect(mainFileContent.includes(dotenvAbcObj.TOKEN_C)).toBe(true);
  });
});

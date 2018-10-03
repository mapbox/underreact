'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');
const dirTree = require('directory-tree');
const promisify = require('util.promisify');
const dotenv = require('dotenv');

const { copy } = require('../lib/utils/auto-copy');
const bootstrapReactRepo = require('./test-utils/bootstrap-react-repo');
const commandBuild = require('./test-utils/command-build');

jest.setTimeout(15 * 1000);

describe('Env vars with clientEnvPrefix set', () => {
  const tempDir = tempy.directory();
  const dirPath = path.join(tempDir, 'test');

  let mainFileContent;
  let envObj;
  beforeAll(() =>
    promisify(fs.mkdir)(dirPath)
      .then(() => bootstrapReactRepo(dirPath))
      .then(() =>
        copy({
          sourceDir: path.join(
            __dirname,
            'fixtures',
            'env-vars/client-env-prefix'
          ),
          destDir: dirPath,
          sourceGlob: ['**/*', '.env*'] // need to add `.env*` to include dotfiles.
        })
      )
      .then(() => {
        commandBuild([], { cwd: dirPath });

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
  const tempDir = tempy.directory();
  const dirPath = path.join(tempDir, 'test');

  let mainFileContent;
  let dotenvObj;
  let dotenvAbcObj;
  beforeAll(() =>
    promisify(fs.mkdir)(dirPath)
      .then(() => bootstrapReactRepo(dirPath))
      .then(() =>
        copy({
          sourceDir: path.join(__dirname, 'fixtures', 'env-vars/deploy-env'),
          destDir: dirPath,
          sourceGlob: ['**/*', '.env*'] // need to add `.env*` to include dotfiles.
        })
      )
      .then(() => {
        commandBuild([], { cwd: dirPath, env: { DEPLOY_ENV: 'abc' } });

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

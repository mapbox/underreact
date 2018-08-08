'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');
const dirTree = require('directory-tree');
const promisify = require('util.promisify');

const { copy } = require('../lib/utils/auto-copy');
const bootstrapReactRepo = require('./test-utils/bootstrap-react-repo');
const commandBuild = require('./test-utils/command-build');

jest.setTimeout(15 * 1000);

describe('env vars', () => {
  const tempDir = tempy.directory();

  // give `urc.rootDirectory` a stable value
  const dirPath = path.join(tempDir, 'test');

  beforeAll(() =>
    promisify(fs.mkdir)(dirPath)
      .then(() => bootstrapReactRepo(dirPath))
      .then(() =>
        copy({
          sourceDir: path.join(__dirname, 'fixtures', 'env-vars'),
          destDir: dirPath,
          sourceGlob: ['**/*', '.env*'] // need to add `.env*` to include dotfiles.
        })
      ));

  test('Includes the right env token', () => {
    commandBuild([`--config=${path.join(dirPath, 'underreact.config.js')}`]);

    const tree = dirTree(
      path.join(dirPath, '_underreact-site', 'underreact-assets')
    );

    const mainFilename = tree.children.find(t => t.name.startsWith('main'))
      .path;

    const mainFileContent = fs.readFileSync(mainFilename, 'utf-8');

    // doesn't include UNDERREACT_APP_TOKEN
    expect(
      mainFileContent.includes('a12f8298fe359b16032ae337a49e0c52b22d7d82')
    ).toBe(true);

    // doesn't include SUPER_SECRET
    expect(
      mainFileContent.includes('45f23c279542d5884795c763bbaa01f554d09516')
    ).toBe(false);
  });
});

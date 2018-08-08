'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');
const dirTree = require('directory-tree');
const promisify = require('util.promisify');

const { copy } = require('../lib/utils/auto-copy');
const removePath = require('./test-utils/remove-path');
const bootstrapReactRepo = require('./test-utils/bootstrap-react-repo');
const commandBuild = require('./test-utils/command-build');

jest.setTimeout(15 * 1000);

describe('No Config Test', () => {
  const tempDir = tempy.directory();

  // give `urc.rootDirectory` a stable value
  const dirPath = path.join(tempDir, 'test');

  beforeAll(() =>
    promisify(fs.mkdir)(dirPath)
      .then(() => bootstrapReactRepo(dirPath))
      .then(() =>
        copy({
          sourceDir: path.join(__dirname, 'fixtures', 'no-config'),
          destDir: dirPath,
          sourceGlob: ['**/*', '.env*'] // need to add `.env*` to include dotfiles.
        })
      ));

  test('builds the correct output', () => {
    const result = commandBuild([
      `--config=${path.join(dirPath, 'underreact.config.js')}`
    ]);

    const tree = removePath({
      object: dirTree(path.join(dirPath, '_underreact-site')),
      path: dirPath,
      replaceWith: '<TEMP_DIR>'
    });

    expect(tree).toMatchSnapshot();
    expect(result.status).toBe(0);
  });

  test('exits with statusCode 1 when config is not found', () => {
    const result = commandBuild(
      [`--config=${path.join(dirPath, 'not-exists.config.js')}`],
      {
        // ignore the stdio as it is expected it console.error and
        // it might look like this is failing
        stdio: 'ignore'
      }
    );
    expect(result.status).toBe(1);
  });
});

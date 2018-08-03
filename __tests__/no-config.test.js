'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');

const hijackDel = require('./test-utils/hijack-del');
const removePath = require('./test-utils/remove-path');
const bootstrapReactRepo = require('./test-utils/bootstrap-react-repo');
const dirTree = require('directory-tree');

// The default behavior of `del` module doesn't allow modifying
// of files outside <rootDir>, which is something we want for the users
// but not in testing as the temp directory is outside.
// `hijackDel` modifies `del` to override this behavior for testing.
jest.mock('del', hijackDel);

const { copy } = require('../lib/packageable/auto-copy');
const config = require('../lib/config');
const build = require('../commands/build');

jest.setTimeout(15 * 1000);

describe('No Config Test', () => {
  const tempDir = tempy.directory();

  // give `urc.rootDirectory` a stable value
  const dirPath = path.join(tempDir, 'test');

  fs.mkdirSync(dirPath);

  beforeAll(async () => {
    await bootstrapReactRepo(dirPath);
    await copy({
      sourceDir: path.join(__dirname, 'fixtures', 'no-config'),
      destDir: dirPath
    });
  });

  test('builds the correct output', async () => {
    const buildOutput = await build(
      await config('build', {
        config: path.join(dirPath, 'underreact.config.js')
      })
    );
    expect(buildOutput).toBe(true);

    let tree = dirTree(dirPath);

    // Makes the snapshot stable by replacing the random dirPath
    // with the string `<TEMP_DIR>`
    tree = removePath({
      object: dirTree(dirPath),
      path: dirPath,
      replaceWith: '<TEMP_DIR>'
    });

    expect(tree).toMatchSnapshot();
  });
});

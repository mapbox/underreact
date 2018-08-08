'use strict';

const path = require('path');
const tempy = require('tempy');
const fs = require('fs');
const dirTree = require('directory-tree');
const promisify = require('util.promisify');

const { copy } = require('../lib/utils/auto-copy');
const config = require('../lib/config');
const buildCommand = require('../commands/build');
const removePath = require('./test-utils/remove-path');
const bootstrapReactRepo = require('./test-utils/bootstrap-react-repo');

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
          destDir: dirPath
        })
      ));

  test('builds the correct output', () => {
    return config('build', {
      config: path.join(dirPath, 'underreact.config.js')
    }).then(urc =>
      buildCommand(urc).then(output => {
        expect(output).toBe(true);

        // Makes the snapshot stable by replacing the random dirPath
        // with the string `<TEMP_DIR>`
        const tree = removePath({
          object: dirTree(urc.outputDirectory),
          path: dirPath,
          replaceWith: '<TEMP_DIR>'
        });

        expect(tree).toMatchSnapshot();
      })
    );
  });
});

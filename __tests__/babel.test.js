'use strict';

const path = require('path');
const fs = require('fs');
const dirTree = require('directory-tree');

const commandBuild = require('./test-utils/command-build');
const generateFixture = require('./test-utils/generate-fixture');
const stubNodeModule = require('./test-utils/create-stub-node-module');

jest.setTimeout(15 * 1000);

const tap = prom =>
  prom.then(res => {
    return res;
  });
const getChunkContent = (tree, type = 'main') => {
  const filename = tree.children
    .find(t => t.name === 'js')
    .children.find(t => t.name.startsWith(type)).path;
  return fs.readFileSync(filename, 'utf-8');
};

test("Doesn't transpile arrow function for newer browser values", () => {
  const fixture = generateFixture({
    src: {
      'entry.js': `
          window.foo = ()=>'UNDERREACT_TEST_RETURN_VALUE';
      `
    },
    'underreact.config.js': `
          module.exports = {browserslist: ['chrome 67']}
    `
  });
  return fixture
    .then(dirPath => {
      return commandBuild({ cwd: dirPath }).then(() => dirPath);
    })
    .then(dirPath => {
      const tree = dirTree(
        path.join(dirPath, '_underreact-site', 'underreact-assets')
      );
      const mainFileContent = getChunkContent(tree, 'main');
      expect(mainFileContent).toMatch(/=>"UNDERREACT_TEST_RETURN_VALUE"/);
    });
});

test('Transpiles arrow function for older browsers by default', () => {
  const fixture = generateFixture({
    src: {
      'entry.js': `
          window.foo = () => 'UNDERREACT_TEST_RETURN_VALUE';
      `
    }
  });
  return fixture
    .then(dirPath => {
      return commandBuild({ cwd: dirPath }).then(() => dirPath);
    })
    .then(dirPath => {
      const tree = dirTree(
        path.join(dirPath, '_underreact-site', 'underreact-assets')
      );
      const mainFileContent = getChunkContent(tree, 'main');
      expect(mainFileContent).toMatch(/return"UNDERREACT_TEST_RETURN_VALUE"/);
    });
});

test('Browserslist takes development env value', () => {
  const fixture = generateFixture({
    src: {
      'entry.js': `
        window.foo = ()=>'UNDERREACT_TEST_RETURN_VALUE';
      `
    },
    'underreact.config.js': `
        module.exports = { 
            browserslist: {
                production: ['ie 11'],
                development: ['chrome 67']
            }
        }
    `
  });
  return fixture
    .then(dirPath => {
      return tap(commandBuild({ cwd: dirPath, args: ['-m=development'] })).then(
        () => dirPath
      );
    })
    .then(dirPath => {
      const tree = dirTree(
        path.join(dirPath, '_underreact-site', 'underreact-assets')
      );
      const mainFileContent = getChunkContent(tree, 'main');
      expect(mainFileContent).toMatch(/=> 'UNDERREACT_TEST_RETURN_VALUE'/);
    });
});

test('Reads browserslist from package.json', () => {
  const fixture = generateFixture({
    src: {
      'entry.js': `
            window.foo = () => 'UNDERREACT_TEST_RETURN_VALUE';
          `
    },
    'package.json': `{
            "browserslist": [
                "chrome 67"
            ]
        }`
  });
  return fixture
    .then(dirPath => {
      return tap(commandBuild({ cwd: dirPath })).then(() => dirPath);
    })
    .then(dirPath => {
      const tree = dirTree(
        path.join(dirPath, '_underreact-site', 'underreact-assets')
      );
      const mainFileContent = getChunkContent(tree, 'main');
      expect(mainFileContent).toMatch(/=>"UNDERREACT_TEST_RETURN_VALUE"/);
    });
});

test('Throws an error when using flow without flow plugin', () => {
  const build = generateFixture({
    src: {
      'entry.js': `
        // @flow
        var t: number = 5;
      `
    },
    'babel.config.js': `
        module.exports = {
            presets: []
        }
      `
  }).then(dirPath => commandBuild({ cwd: dirPath }));

  expect(build).rejects.toMatch(/SyntaxError:/);
  return expect(build).rejects.toMatch(/ERROR: Compilation error./);
});

test('Parses flow when using correct plugin', () => {
  const babelPresetMapbox = require.resolve('../packages/babel-preset-mapbox');
  const babelPluginFlowStrip = require.resolve(
    '@babel/plugin-transform-flow-strip-types'
  );
  const build = generateFixture({
    src: {
      'entry.js': `
        // @flow
        var t: number = 5;
      `
    },
    'babel.config.js': `
        module.exports = {
            presets: ['${babelPresetMapbox}'],
            plugins: ['${babelPluginFlowStrip}']
        }
      `
  }).then(dirPath => commandBuild({ cwd: dirPath }));

  expect(build).resolves.toMatch(/Using an external Babel config/);

  return expect(build).resolves.toMatch(/Finished/);
});

test('Converts es6 in node_modules by default', () => {
  const build = generateFixture({
    node_modules: {
      react: stubNodeModule({
        moduleName: 'react',
        content: `
            window.foo = () => 'UNDERREACT_TEST_RETURN_VALUE';
          `
      })
    },
    src: {
      'entry.js': `
          window.react = require('react');
      `
    }
  }).then(dirPath => commandBuild({ cwd: dirPath }).then(() => dirPath));

  return build.then(dirPath => {
    const tree = dirTree(
      path.join(dirPath, '_underreact-site', 'underreact-assets')
    );
    const vendorContent = getChunkContent(tree, 'vendor');
    expect(vendorContent).toMatch(/return"UNDERREACT_TEST_RETURN_VALUE"/);
  });
});

test("Doesn't convert es6 in node_modules when disabled", () => {
  const build = generateFixture({
    node_modules: {
      react: stubNodeModule({
        moduleName: 'react',
        content: `
            window.foo = () => 'UNDERREACT_TEST_RETURN_VALUE';
          `
      })
    },
    src: {
      'entry.js': `
          window.react = require('react');
      `
    },
    'underreact.config.js': `
        module.exports = { 
          compileNodeModules: false
        }
    `
  }).then(dirPath => commandBuild({ cwd: dirPath }).then(() => dirPath));

  return build.then(dirPath => {
    const tree = dirTree(
      path.join(dirPath, '_underreact-site', 'underreact-assets')
    );
    const vendorContent = getChunkContent(tree, 'vendor');
    expect(vendorContent).toMatch(/=>"UNDERREACT_TEST_RETURN_VALUE"/);
  });
});

test('Selectively converts es6 in node_modules when using compileNodeModules', () => {
  const babelPresetMapbox = require.resolve('../packages/babel-preset-mapbox');
  const build = generateFixture({
    node_modules: {
      react: stubNodeModule({
        moduleName: 'react',
        content: `
            window.react = () => 'UNDERREACT_TEST_RETURN_VALUE';
          `
      }),
      redux: stubNodeModule({
        moduleName: 'redux',
        content: `
            window.redux = () => 'UNDERREACT_TEST_RETURN_VALUE';
          `
      })
    },
    'underreact.config.js': `
            module.exports = { 
              compileNodeModules: ['redux']
            }
      `,
    src: {
      'entry.js': `
            require('react');
            require('redux');
        `
    },
    'babel.config.js': `
        module.exports = {
            presets: ['${babelPresetMapbox}'],
        }
      `
  }).then(dirPath => commandBuild({ cwd: dirPath }).then(() => dirPath));

  return build.then(dirPath => {
    const tree = dirTree(
      path.join(dirPath, '_underreact-site', 'underreact-assets')
    );
    // `react` would go into vendor chunk, since we manually inject in `urc.vendorModules`
    // This would make it easier test stringing and asserting the correct behaviour.
    const vendorContent = getChunkContent(tree, 'vendor');
    expect(vendorContent).toMatch(/=>"UNDERREACT_TEST_RETURN_VALUE"/);

    // redux would go into main chunk, since it is not a part of `urc.vendorModules`
    const mainContent = getChunkContent(tree, 'main');
    expect(mainContent).toMatch(/return"UNDERREACT_TEST_RETURN_VALUE"/);
  });
});

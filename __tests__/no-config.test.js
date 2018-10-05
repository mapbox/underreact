'use strict';

const path = require('path');
const dirTree = require('directory-tree');

const removePath = require('./test-utils/remove-path');
const commandBuild = require('./test-utils/command-build');
const generateTree = require('./test-utils/generate-tree');
const stubNodeModule = require('./test-utils/create-stub-node-module');

jest.setTimeout(15 * 1000);

describe('No Config Test', () => {
  let dirPath;
  const fixture = generateTree({
    src: {
      'entry.js': `
        import React from 'react';
        import ReactDOM from 'react-dom';
        import App from './app';
          
        ReactDOM.render(<App />, document.getElementById('app'));
      `,
      'app.js': `
        import React from 'react';
        export default class App extends React.Component {
          render() {
            return (
              <div>
                Hello world
              </div>
            );
          }
        }
      `
    },
    node_modules: {
      react: stubNodeModule({
        moduleName: 'react',
        content: `console.log('react');`
      }),
      'react-dom': stubNodeModule({
        moduleName: 'react-dom',
        content: `console.log('react-dom');`
      })
    }
  });
  beforeAll(() =>
    fixture.then(path => {
      dirPath = path;
    }));

  test('builds the correct output without any configuration', () => {
    return commandBuild({ cwd: dirPath }).then(result => {
      const tree = removePath({
        object: dirTree(path.join(dirPath, '_underreact-site')),
        path: dirPath,
        replaceWith: '<TEMP_DIR>'
      });

      expect(tree).toMatchSnapshot();
      expect(result).toMatch(/Building your site in production mode/);
      expect(result).toMatch(/Finished/);
    });
  });

  test('builds the correct output with development mode', () => {
    return commandBuild({
      cwd: dirPath,
      args: ['--mode=development']
    }).then(result => {
      const tree = removePath({
        object: dirTree(path.join(dirPath, '_underreact-site')),
        path: dirPath,
        replaceWith: '<TEMP_DIR>'
      });

      expect(tree).toMatchSnapshot();
      expect(result).toMatch(/development mode/);
      expect(result).toMatch(/Finished/);
    });
  });

  test('exits with statusCode 1 when config is not found', () => {
    expect(
      commandBuild({
        args: [`--config=${path.join(dirPath, 'not-exists.config.js')}`],
        cwd: dirPath
      })
    ).rejects.toMatch(/ERROR: Failed to find the config file/);
  });
});

'use strict';

jest.mock('got', () => jest.fn());

const fs = require('fs');
const path = require('path');
const tempy = require('tempy');
const del = require('del');
const fastGlob = require('fast-glob');
const got = require('got');
const PostcssConcatenator = require('..');

const DIR_FIXTURES = path.join(__dirname, 'fixtures');
const fixture = x => path.join(DIR_FIXTURES, x);

const cache = new Map();

afterEach(() => {
  cache.clear();
});

describe('with inline source map', () => {
  let tmp;
  let outputPath;
  beforeAll(() => {
    tmp = tempy.directory();
    outputPath = path.join(tmp, 'output.css');
    return PostcssConcatenator.concatToFile({
      urlCache: cache,
      stylesheets: [
        fixture('a.css'),
        fixture('nested/c.css'),
        fixture('b.css')
      ],
      output: outputPath
    });
  });

  afterAll(() => {
    return del(tmp, { force: true });
  });

  test('output contains each CSS file in order, with an inline source map', () => {
    const output = fs.readFileSync(outputPath, 'utf8');
    // Check the source map independent of the snapshot because it will contain
    // (encoded) file-system-specific paths that the PROJECT_ROOT Jest
    // serializer will not find (because they're encoded).
    expect(output.replace(/\/\*#[\s\S]+\*\//, '')).toMatchSnapshot();
    expect(output).toContain(
      '/*# sourceMappingURL=data:application/json;base64'
    );
  });

  test('source map not written', () => {
    expect(() => {
      fs.readFileSync(path.join(tmp, 'output.css.map'));
    }).toThrow();
  });

  test('image is copied and hashed', () => {
    const pngFilename = fastGlob.sync([path.join(tmp, 'something_*.png')])[0];
    expect(pngFilename).toBeTruthy();
  });

  test('CSS references hashed image relativized to output directory', () => {
    const pngFilename = fastGlob.sync([path.join(tmp, 'something_*.png')])[0];
    const pngBasename = path.basename(pngFilename);
    expect(fs.readFileSync(outputPath, 'utf8')).toMatch(
      `background-image: url('${pngBasename}')`
    );
  });

  test('nice error when PostCSS fails to parse', () => {
    expect(
      PostcssConcatenator.concatToFile({
        urlCache: cache,
        stylesheets: [fixture('invalid.css')],
        output: path.join(tmp, 'output.css')
      })
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe('with external source map', () => {
  let tmp;
  let outputPath;
  beforeAll(() => {
    tmp = tempy.directory();
    outputPath = path.join(tmp, 'output.css');
    return PostcssConcatenator.concatToFile({
      urlCache: cache,
      stylesheets: [
        fixture('a.css'),
        fixture('nested/c.css'),
        fixture('b.css')
      ],
      output: outputPath,
      sourceMap: 'file'
    });
  });

  afterAll(() => {
    return del(tmp, { force: true });
  });

  test('output contains each CSS file in order, with an external source map', () => {
    expect(fs.readFileSync(outputPath, 'utf8')).toMatchSnapshot();
  });

  test('source map written', () => {
    expect(
      fs.readFileSync(path.join(tmp, 'output.css.map'), 'utf8')
    ).toMatchSnapshot();
  });
});

describe('with a URL', () => {
  let tmp;
  let outputPath;
  beforeAll(() => {
    tmp = tempy.directory();
    outputPath = path.join(tmp, 'output.css');

    got.mockImplementation(getUrl => {
      if (getUrl === 'https://www.foo.com/bar.css') {
        return Promise.resolve({ body: '#bar { color: yellow; }' });
      }
      if (getUrl === 'https://www.foo.com/baz.css') {
        return Promise.resolve({ body: '#baz { color: pink; }' });
      }
      throw new Error(`Unexpected URL ${getUrl}`);
    });

    return PostcssConcatenator.concatToFile({
      urlCache: cache,
      stylesheets: [
        'https://www.foo.com/bar.css',
        fixture('a.css'),
        'https://www.foo.com/baz.css'
      ],
      output: outputPath,
      sourceMap: 'file'
    });
  });

  afterAll(() => {
    return del(tmp, { force: true });
  });

  test('output contains each CSS file in order', () => {
    expect(fs.readFileSync(outputPath, 'utf8')).toMatchSnapshot();
  });

  test('URLs are cached in memory so not fetched again', () => {
    const options = {
      stylesheets: [
        'https://www.foo.com/bar.css',
        fixture('a.css'),
        'https://www.foo.com/baz.css'
      ],
      output: outputPath
    };
    expect(got).toHaveBeenCalledTimes(0);
    return PostcssConcatenator.concatToFile(options)
      .then(() => {
        expect(got).toHaveBeenCalledTimes(2);
        return PostcssConcatenator.concatToFile(options);
      })
      .then(() => {
        expect(got).toHaveBeenCalledTimes(2);
      });
  });
});

test('errors if no stylesheets are provided', () => {
  expect(
    PostcssConcatenator.concatToFile({
      urlCache: cache,
      stylesheets: [],
      output: 'output.css'
    })
  ).rejects.toThrow('No stylesheets');
});

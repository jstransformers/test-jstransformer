'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const testit = require('testit');

function assertEqual(output, expected) {
  try {
    assert.strictEqual(output, expected);
  } catch (error) {
    console.log('   Output:\t' + JSON.stringify(output));
    console.log('   Expected:\t' + JSON.stringify(expected));
    throw error;
  }
}

function assertDeepEqual(output, expected) {
  try {
    assert.deepStrictEqual(output, expected);
  } catch (error) {
    console.log('   Output:\t' + JSON.stringify(output));
    console.log('   Expected:\t' + JSON.stringify(expected));
    throw error;
  }
}

function getFilename(filename) {
  if (/\.\*$/.test(filename)) {
    const files = fs.readdirSync(path.dirname(filename));
    let result;
    let gotResult = false;
    for (const file of files) {
      const p = filename.replace(/\.\*$/, path.extname(file));
      if (file === path.basename(p)) {
        if (gotResult) {
          throw new Error('Multiple files were found matching ' + filename);
        }

        gotResult = true;
        result = p;
      }
    }

    if (gotResult) {
      return path.resolve(result);
    }

    throw new Error('Could not find a file matching ' + filename);
  }

  return path.resolve(filename);
}

function read(filename) {
  filename = getFilename(filename);
  return fs.readFileSync(filename, 'utf8').trim();
}

module.exports = addTests;
function addTests(transform, testDirectory, test) {
  test = test || testit;

  function addTestCases(directory) {
    const inputFile = getFilename(path.join(directory, 'input.*'));
    const input = read(inputFile);
    const options = require(path.join(directory, 'options'));
    const locals = require(path.join(directory, 'locals'));
    const dependencies = require(path.join(directory, 'dependencies')).map(dep => {
      return path.resolve(directory, dep);
    });
    const expected = read(path.join(directory, 'expected.*'));

    async function checkFunctionOutput(template) {
      if ((dependencies && dependencies.length > 0) || (typeof template === 'object' && template)) {
        assert(typeof template === 'object' && template, ' template should be an object because this module tracks dependencies');
        assert(typeof template.fn === 'function', 'template.fn should be a function');
        const result = await Promise.resolve(template.fn(locals)).then(rendered => rendered.trim());
        assertEqual(result, expected);
        assert(Array.isArray(template.dependencies), ' template.dependencies should be an array');
        assert(template.dependencies.every(dependency => {
          return typeof dependency === 'string';
        }), ' template.dependencies should all be strings');
        assertDeepEqual(template.dependencies.map(dependency => {
          return path.resolve(dependency);
        }), dependencies || []);
      } else {
        assert(typeof template === 'function', 'template should be a function, or an object with an "fn" property of type function and a "dependencies" property that is an array.');
        const result = await Promise.resolve(template(locals)).then(rendered => rendered.trim());
        assertEqual(result, expected);
      }
    }

    function checkOutput(output) {
      if ((dependencies && dependencies.length > 0) || (typeof output === 'object' && output)) {
        assert(typeof output === 'object' && output, ' output should be an object because this module tracks dependencies');
        assert(typeof output.body === 'string', 'output.body should be a string');
        assertEqual(output.body.trim(), expected);
        assert(Array.isArray(output.dependencies), ' output.dependencies should be an array');
        assertDeepEqual(output.dependencies.map(dependency => {
          return path.resolve(dependency);
        }), dependencies || []);
      } else {
        assert(typeof output === 'string', 'output should be a string, or an object with a "body" property of type string and a "dependencies" property that is an array.');
        assertEqual(output.trim(), expected);
      }
    }

    if (transform.compile && !directory.includes('_async')) {
      test(transform.name + '.compile()', () => {
        const template = transform.compile(input, options);
        checkFunctionOutput(template);
      });
    }

    if (transform.compileAsync) {
      test(transform.name + '.compileAsync()', () => {
        return transform.compileAsync(input, options).then(template => {
          checkFunctionOutput(template);
        });
      });
    }

    if (transform.compileFile && !directory.includes('_async')) {
      test(transform.name + '.compileFile()', () => {
        const template = transform.compileFile(inputFile, options);
        checkFunctionOutput(template);
      });
    }

    if (transform.compileFileAsync) {
      test(transform.name + '.compileFileAsync()', () => {
        return transform.compileFileAsync(inputFile, options).then(template => {
          checkFunctionOutput(template);
        });
      });
    }

    if (transform.render && !directory.includes('_async')) {
      test(transform.name + '.render()', () => {
        const output = transform.render(input, options, locals);
        checkOutput(output);
      });
    }

    if (transform.renderAsync) {
      test(transform.name + '.renderAsync()', () => {
        return transform.renderAsync(input, options, locals).then(output => {
          checkOutput(output);
        });
      });
    }

    if (transform.renderFile && !directory.includes('_async')) {
      test(transform.name + '.renderFile()', () => {
        const output = transform.renderFile(inputFile, options, locals);
        checkOutput(output);
      });
    }

    if (transform.renderFileAsync) {
      test(transform.name + '.renderFileAsync()', () => {
        transform.renderFileAsync(inputFile, options, locals).then(output => {
          checkOutput(output);
        });
      });
    }
  }

  assert(transform && typeof transform === 'object', 'Transform must be an object');
  assert(typeof transform.name === 'string' && transform.name, 'Transform must have a name');
  assert(typeof testDirectory === 'string', 'Must specify a testDirectory');

  test(transform.name, () => {
    test('transform has an output format', () => {
      assert(typeof transform.outputFormat === 'string' && transform.outputFormat);
    });
    if (transform.inputFormats) {
      test('transform has input formats', () => {
        assert(Array.isArray(transform.inputFormats), 'Expected transform.inputFormats to be an array');
        assert(transform.inputFormats.every(format => {
          return typeof format === 'string' && format;
        }), 'Expected all inputFormats to be non-empty strings');
      });
    }

    const dir = fs.readdirSync(testDirectory).filter(filename => {
      return filename[0] !== '.';
    });
    const isMultiTest = dir.length > 0 && dir.every(file => {
      return fs.statSync(path.join(testDirectory, file)).isDirectory();
    });
    if (isMultiTest) {
      for (const subdir of dir) {
        test(subdir, () => {
          addTestCases(path.join(testDirectory, subdir));
        });
      }
    } else {
      addTestCases(testDirectory);
    }
  });
}

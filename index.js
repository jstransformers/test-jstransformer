'use strict';

var assert = require('assert');
var fs = require('fs');
var join = require('path').join;
var dirname = require('path').dirname;
var extname = require('path').extname;
var basename = require('path').basename;
var resolve = require('path').resolve;
var testit = require('testit');

function assertEqual(output, expected) {
  try {
    assert.equal(output, expected);
  } catch (ex) {
    console.log('   Output:\t'   + JSON.stringify(output));
    console.log('   Expected:\t' + JSON.stringify(expected));
    throw ex;
  }
}
function assertDeepEqual(output, expected) {
  try {
    assert.deepEqual(output, expected);
  } catch (ex) {
    console.log('   Output:\t'   + JSON.stringify(output));
    console.log('   Expected:\t' + JSON.stringify(expected));
    throw ex;
  }
}
function getFilename(filename) {
  if (/\.\*$/.test(filename)) {
    var dir = fs.readdirSync(dirname(filename));
    var result, gotResult = false;
    for (var i = 0; i < dir.length; i++) {
      var p = filename.replace(/\.\*$/, extname(dir[i]));
      if (dir[i] === basename(p)){
        if (gotResult) {
          throw new Error('Multiple files were found matching ' + filename);
        }
        gotResult = true;
        result = p;
      }
    }
    if (gotResult) {
      return resolve(result);
    } else {
      throw new Error('Could not find a file matching ' + filename);
    }
  } else {
    return resolve(filename);
  }
}
function read(filename) {
  filename = getFilename(filename);
  return fs.readFileSync(filename, 'utf8');
}

module.exports = addTests;
function addTests(transform, testDirectory, test) {
  test = test || testit;

  function addTestCases(directory) {
    var inputFile = getFilename(join(directory, 'input.*'));
    var input = read(inputFile);
    var options = require(join(directory, 'options'));
    var locals = require(join(directory, 'locals'));
    var dependencies = require(join(directory, 'dependencies')).map(function (dep) { return resolve(directory, dep); });
    var expected = read(join(directory, 'expected.*')).trim();

    function checkFunctionOutput(template) {
      if ((dependencies && dependencies.length) || (typeof template === 'object' && template)) {
        assert(typeof template === 'object' && template, ' template should be an object because this module tracks dependencies');
        assert(typeof template.fn === 'function', 'template.fn should be a function');
        assertEqual(template.fn(locals).trim(), expected);
        assert(Array.isArray(template.dependencies), ' template.dependencies should be an array');
        assert(template.dependencies.every(function (path) { return typeof path === 'string'; }), ' template.dependencies should all be strings');
        assertDeepEqual(template.dependencies.map(function (path) {
          return resolve(path);
        }), dependencies || []);
      } else {
        assert(typeof template === 'function', 'template should be a function, or an object with an "fn" property of type function and a "dependencies" property that is an array.');
        assertEqual(template(locals).trim(), expected);
      }
    }
    function checkOutput(output) {
      if ((dependencies && dependencies.length) || (typeof output === 'object' && output)) {
        assert(typeof output === 'object' && output, ' output should be an object because this module tracks dependencies');
        assert(typeof output.body === 'string', 'output.body should be a string');
        assertEqual(output.body.trim(), expected);
        assert(Array.isArray(output.dependencies), ' output.dependencies should be an array');
        assertDeepEqual(output.dependencies, dependencies || []);
      } else {
        assert(typeof output === 'string', 'output should be a string, or an object with a "body" property of type string and a "dependencies" property that is an array.');
        assertEqual(output.trim(), expected);
      }
    }

    function syncTest(funcName, input, check) {
      var renderTest = /^render/.test(funcName);
      if (!transform[funcName]) return;

      test(transform.name + '.' + funcName + '()', function () {
        if (renderTest) {
          var output = transform[funcname](input, options, locals);
          checkOutput(output);
        } else {
          var template = transform[funcName](input, options);
          checkFunctionOutput(template);
        }
      });
    }
    syncTest('compile', input);
    syncTest('compileFile', inputFile);
    syncTest('render', input);
    syncTest('renderFile', inputFile);

    function asyncTest(funcName, input) {
      var renderTest = /^render/.test(funcName);
      funcName = funcName + 'Async';
      if (!transform[funcName]) return;

      test(transform.name + '.' + funcName + '()', function () {
        if (renderTest) {
          transform[funcName](input, options, locals).then(checkOutput);
        } else {
          transform[funcName](input, options).then(checkFunctionOutput);
        }
      });
    }
    asyncTest('compile', input);
    asyncTest('compileFile', inputFile);
    asyncTest('render', input);
    asyncTest('renderFile', inputFile);
  }

  assert(transform  && typeof transform === 'object', 'Transform must be an object');
  assert(typeof transform.name === 'string' && transform.name, 'Transform must have a name');
  assert(typeof testDirectory === 'string', 'Must specify a testDirectory');

  test(transform.name, function () {
    test('transform has an output format', function () {
      assert(typeof transform.outputFormat === 'string' && transform.outputFormat);
    });
    if (transform.inputFormats) {
      test('transform has input formats', function () {
        assert(Array.isArray(transform.inputFormats), 'Expected transform.inputFormats to be an array');
        assert(transform.inputFormats.every(function (format) {
          return typeof format === 'string' && format;
        }), 'Expected all inputFormats to be non-empty strings');
      });
    }
    var dir = fs.readdirSync(testDirectory).filter(function (filename) {
      return filename[0] !== '.';
    });
    var isMultiTest = dir.length && dir.every(function (file) {
      return fs.statSync(join(testDirectory, file)).isDirectory();
    });
    if (isMultiTest) {
      dir.forEach(function (subdir) {
        test(subdir, function () {
          addTestCases(join(testDirectory, subdir));
        });
      });
    } else {
      addTestCases(testDirectory);
    }
  });
}

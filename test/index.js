'use strict';

var fs = require('fs');
var assert = require('assert');
var cp = require('child_process');
var resolve = require('path').resolve;
var test = require('testit');
var testJStransformer = require('../');
var Promise = require('promise');

testJStransformer({
  name: 'simple',
  outputFormat: 'txt',
  inputFormats: ['txt'],
  compile: function (str, options) {
    return function (locals) { return 'output text'; }
  }
}, resolve(__dirname + '/../example/simple'));

testJStransformer({
  name: 'multi',
  outputFormat: 'txt',
  inputFormats: ['txt'],
  compile: function (str, options) {
    return {
      fn: function (locals) { return 'output text'; },
      dependencies: /load foo.js/.test(str) ? [resolve(__dirname + '/../example/multi/second-case/', './foo.js')] : []
    };
  }
}, resolve(__dirname + '/../example/multi'));

testJStransformer({
  name: 'render',
  outputFormat: 'txt',
  inputFormats: ['txt'],
  render: function (str, options, locals) {
    return 'output text';
  }
}, resolve(__dirname + '/../example/simple'));

testJStransformer({
  name: 'renderAsync',
  outputFormat: 'txt',
  inputFormats: ['txt'],
  renderAsync: function (str, options, locals) {
    return new Promise(function(fulfill, reject) {
      fulfill('output text');
    });
  }
}, resolve(__dirname + '/../example/simple'));

testJStransformer({
  name: 'renderFile',
  outputFormat: 'txt',
  inputFormats: ['txt'],
  renderFile: function (file, options, locals) {
    return 'output text';
  }
}, resolve(__dirname + '/../example/simple'));

testJStransformer({
  name: 'renderFileAsync',
  outputFormat: 'txt',
  inputFormats: ['txt'],
  renderFileAsync: function (file, options, locals) {
    return new Promise(function(fulfill, reject) {
      fulfill('output text');
    });
  }
}, resolve(__dirname + '/../example/simple'));

test('failures', function () {
  fs.readdirSync(resolve(__dirname + '/failures')).forEach(function (testCase) {
    if (!/\.js$/.test(testCase)) return;
    test(testCase, function () {
      return new Promise(function (resolve, reject) {
        var stdout = '';
        var stderr = '';
        var child = cp.fork(require.resolve('./failures/' + testCase), {silent: true});
        child.stdout.on('data', function (data) {
          stdout += data;
        });
        child.stderr.on('data', function (data) {
          stderr += data;
        });
        child.on('exit', function (code) {
          resolve(
            'code: ' + code +
            '\n\nstdout:\n\n' + stdout.replace(/\d+[a-z]+/g, '#ms').replace(/\r\n/g, '\n') +
            '\n\nstderr:\n\n' + stderr.replace(/\r\n/g, '\n')
          );
        });
      }).then(function (result) {
        var expected;
        try {
          expected = fs.readFileSync(resolve(__dirname + '/failures/' + testCase.replace(/\.js$/, '.txt')), 'utf8');
        } catch (ex) {
          if (ex.code === 'ENOENT') {
            fs.writeFileSync(resolve(__dirname + '/failures/' + testCase.replace(/\.js$/, '.txt')), result);
          }
          throw ex;
        }
        assert.strictEqual(result, expected);
      });
    });
  });
});
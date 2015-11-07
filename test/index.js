'use strict';

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

testJStransformer({
  name: 'compileAsync - Promise',
  outputFormat: 'txt',
  inputFormats: ['txt'],
  compileAsync: function (file, options) {
    return new Promise(function (fulfill, reject) {
      fulfill(function (locals) {
        return new Promise(function (resolve, fail) {
          resolve('output text');
        });
      });
    });
  }
}, resolve(__dirname + '/../example/simple'));

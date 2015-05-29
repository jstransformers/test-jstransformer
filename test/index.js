'use strict';

var resolve = require('path').resolve;
var test = require('testit');
var testJStransformer = require('../');

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

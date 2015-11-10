'use strict';

var resolve = require('path').resolve;
var testJStransformer = require('../../');
var Promise = require('promise');

/**
 * Failure test: Remove this!
 */
testJStransformer({
  name: 'renderAsync: This used to pass despite returning a rejected promise',
  outputFormat: 'txt',
  inputFormats: ['txt'],
  renderAsync: function (str, options, locals) {
    return new Promise(function(fulfill, reject) {
      // Call reject to test a failed run.
      reject('FAILURE!');
    });
  }
}, resolve(__dirname + '/../../example/simple'));

'use strict';

const path = require('path');
const testJStransformer = require('../../');

const simplePath = path.join(__dirname, '..', '..', 'example', 'simple');
const resolve = path.resolve;

/**
 * Failure test: Remove this!
 */
testJStransformer({
  name: 'renderAsync: This used to pass despite returning a rejected promise',
  outputFormat: 'txt',
  inputFormats: ['txt'],
  renderAsync: () => {
    return new Promise((resolve, reject) => {
      // Call reject to test a failed run.
      reject('FAILURE!'); // eslint-disable-line prefer-promise-reject-errors
    });
  }
}, resolve(simplePath));

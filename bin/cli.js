#!/usr/bin/env node

'use strict';

const foreground = require('foreground-child');
const test = require('../');

if (process.argv[2] === 'cover' || process.argv[2] === 'coverage') {
  foreground(process.argv[0], [require.resolve('istanbul/lib/cli'), 'cover', __filename]);
} else {
  test(require(process.cwd()), process.cwd() + '/test');
}

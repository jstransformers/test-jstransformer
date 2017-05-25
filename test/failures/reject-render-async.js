'use strict';

const resolve = require('path').resolve;
const testJStransformer = require('../../');
const simplePath = path.join(__dirname, '..', '..', 'example', 'simple')

/**
 * Failure test: Remove this!
 */
testJStransformer({
	name: 'renderAsync: This used to pass despite returning a rejected promise',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	renderAsync: (str, options, locals) => {
		return new Promise((resolve, reject) => {
			// Call reject to test a failed run.
			reject('FAILURE!');
		});
	}
}, resolve(simplePath));

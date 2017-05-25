'use strict';

const path = require('path')
const fs = require('fs');
const assert = require('assert');
const cp = require('child_process');
const resolve = require('path').resolve;
const test = require('testit');
const testJStransformer = require('../');
const simplePath = path.join(__dirname, '..', 'example', 'simple')
const multiPath = path.join(__dirname, '..', 'example', 'multi')

testJStransformer({
	name: 'simple',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	compile: function (str, options) {
		return function (locals) { return 'output text'; }
	}
}, resolve(simplePath));

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
}, resolve(multiPath));

testJStransformer({
	name: 'render',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	render: function (str, options, locals) {
		return 'output text';
	}
}, resolve(simplePath));

testJStransformer({
	name: 'renderAsync',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	renderAsync: function (str, options, locals) {
		return new Promise(function(fulfill, reject) {
			fulfill('output text');
		});
	}
}, resolve(simplePath));

testJStransformer({
	name: 'renderFile',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	renderFile: function (file, options, locals) {
		return 'output text';
	}
}, resolve(simplePath));

testJStransformer({
	name: 'renderFileAsync',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	renderFileAsync: (file, options, locals) => {
		return new Promise(function(fulfill, reject) {
			fulfill('output text');
		});
	}
}, resolve(simplePath));

test('failures', () => {
	const failuresPath = path.join(__dirname, 'failures')
	fs.readdirSync(resolve(failuresPath)).forEach(testCase => {
		if (!/\.js$/.test(testCase)) return;
		test(testCase, () => {
			return new Promise((resolve, reject) => {
				var stdout = '';
				var stderr = '';
				const failPath = path.join('failures', testCase);
				console.log(failPath)
				var child = cp.fork(require.resolve('./' + failPath), {silent: true});
				child.stdout.on('data', (data) => {
					stdout += data;
				});
				child.stderr.on('data', (data) => {
					stderr += data;
				});
				child.on('exit', function (code) {
					resolve(
						'code: ' + code +
						'\n\nstdout:\n\n' + stdout.replace(/\d+[a-z]+/g, '#ms').replace(/\r\n/g, '\n') +
						'\n\nstderr:\n\n' + stderr.replace(/\r\n/g, '\n')
					);
				});
			}).then((result) => {
				var expected;
				const testCasePath = path.join(__dirname, 'failures', testCase.replace(/\.js$/, '.txt'));
				try {
					expected = fs.readFileSync(resolve(testCasePath), 'utf8');
				} catch (err) {
					if (err.code === 'ENOENT') {
						fs.writeFileSync(resolve(testCasePath), result);
					}
					throw err;
				}
				assert.strictEqual(result, expected);
			});
		});
	});
});

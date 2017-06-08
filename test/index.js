'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const cp = require('child_process');
const test = require('testit');
const testJStransformer = require('../');

const resolve = path.resolve;
const simplePath = path.join(__dirname, '..', 'example', 'simple');
const multiPath = path.join(__dirname, '..', 'example', 'multi');

testJStransformer({
	name: 'simple',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	compile: () => {
		return () => {
			return 'output text';
		};
	}
}, resolve(simplePath));

testJStransformer({
	name: 'multi',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	compile: str => {
		const secondCase = path.join(__dirname, '..', 'example', 'multi', 'second-case');
		return {
			fn: () => {
				return 'output text';
			},
			dependencies: /load foo.js/.test(str) ? [resolve(secondCase, './foo.js')] : []
		};
	}
}, resolve(multiPath));

testJStransformer({
	name: 'render',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	render: () => {
		return 'output text';
	}
}, resolve(simplePath));

testJStransformer({
	name: 'renderAsync',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	renderAsync: () => {
		return new Promise(resolve => {
			resolve('output text');
		});
	}
}, resolve(simplePath));

testJStransformer({
	name: 'renderFile',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	renderFile: () => {
		return 'output text';
	}
}, resolve(simplePath));

testJStransformer({
	name: 'renderFileAsync',
	outputFormat: 'txt',
	inputFormats: ['txt'],
	renderFileAsync: () => {
		return new Promise(resolve => {
			resolve('output text');
		});
	}
}, resolve(simplePath));

test('failures', () => {
	const failuresPath = path.join(__dirname, 'failures');
	fs.readdirSync(resolve(failuresPath)).forEach(testCase => {
		if (!/\.js$/.test(testCase)) {
			return;
		}
		test(testCase, () => {
			return new Promise(resolve => {
				let stdout = '';
				let stderr = '';
				const failPath = path.join('failures', testCase);
				console.log(failPath);
				const child = cp.fork(require.resolve('./' + failPath), {
					silent: true
				});
				child.stdout.on('data', data => {
					stdout += data;
				});
				child.stderr.on('data', data => {
					stderr += data;
				});
				child.on('exit', code => {
					resolve(
						'code: ' + code +
						'\n\nstdout:\n\n' + stdout.replace(/\d+[a-z]+/g, '#ms').replace(/\r\n/g, '\n') +
						'\n\nstderr:\n\n' + stderr.replace(/\r\n/g, '\n')
					);
				});
			}).then(result => {
				let expected;
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

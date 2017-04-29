# test-jstransformer

[![Greenkeeper badge](https://badges.greenkeeper.io/jstransformers/test-jstransformer.svg)](https://greenkeeper.io/)

A CLI for testing jstransformer implementations.

[![Build Status](https://img.shields.io/travis/jstransformers/test-jstransformer/master.svg)](https://travis-ci.org/jstransformers/test-jstransformer)
[![Coverage Status](https://img.shields.io/coveralls/jstransformers/test-jstransformer/master.svg)](https://coveralls.io/r/jstransformers/test-jstransformer?branch=master)
[![NPM version](https://img.shields.io/npm/v/test-jstransformer.svg)](https://www.npmjs.org/package/test-jstransformer)

## Installation

    npm install test-jstransformer --save-dev

## Usage

In your package.json add:

```js
{
  "scripts": {
    "coverage": "test-jstransformer coverage",
    "test": "test-jstransformer"
  }
}
```

Then copy either example/simple or example/multi into a folder called "test" in your jstransformer's repo.

You can then run tests using:

```
npm test
```

and generate coverage using:

```
npm run coverage
```

## License

MIT

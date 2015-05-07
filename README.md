# msgpack-javascript

[![NPM](https://nodei.co/npm/msgpack-javascript.png)](https://nodei.co/npm/msgpack-javascript/)

[![Build Status](https://travis-ci.org/polyglotted/msgpack-javascript.svg?branch=master)](https://travis-ci.org/polyglotted/msgpack-javascript)
[![Code Climate](https://codeclimate.com/github/polyglotted/msgpack-javascript/badges/gpa.svg)](https://codeclimate.com/github/polyglotted/msgpack-javascript)
[![Test Coverage](https://codeclimate.com/github/polyglotted/msgpack-javascript/badges/coverage.svg)](https://codeclimate.com/github/polyglotted/msgpack-javascript/coverage)
[![Dependency Status](https://david-dm.org/polyglotted/msgpack-javascript.svg)](https://david-dm.org/polyglotted/msgpack-javascript)
[![devDependency Status](https://david-dm.org/polyglotted/msgpack-javascript/dev-status.svg?branch=master)](https://david-dm.org/polyglotted/msgpack-javascript#info=devDependencies)

JavaScript ES6 implementation of the [MessagePack](https://github.com/msgpack/msgpack/blob/master/spec.md) protocol.

## Design Goals
* Isomorphic
  * Single codebase to serve both Browser and Node environments
* Future Ready
  * Source and tests written in ES6

## Installation
```
npm i msgpack-javascript
```

## Basic Usage

```javascript
import {Packer, Unpacker} from 'msgpack-javascript';
import {assert} from 'chai';

let packer,
    unpacker,
    expected,
    actual = {};

expected = {
  'boolean': true,
  'fixnum': 0,
  'byte': 255,
  'short': 65535,
  'int': -2147483648,
  'long': Date.now(),
  'float': 3.14,
  'double': 0.1234,
  'string': 'yo polynut',
  'array': [0, true, 'p'],
  'map': new Map([[0, 'foo'], [1, 'bar']])
};

packer = new Packer();
packer
  .packBoolean(expected.boolean)
  .packInt(expected.fixnum)
  .packInt(expected.byte)
  .packInt(expected.short)
  .packInt(expected.int)
  .packInt(expected.long)
  .packFloat(expected.float)
  .packDouble(expected.double)
  .packString(expected.string)
  .packArray(expected.array)
  .packMap(expected.map);

unpacker = new Unpacker(packer.getBytes());
actual.boolean = unpacker.unpackBoolean();
actual.fixnum = unpacker.unpackInt();
actual.byte = unpacker.unpackInt();
actual.short = unpacker.unpackInt();
actual.int = unpacker.unpackInt();
actual.long = unpacker.unpackInt();
actual.float = unpacker.unpackFloat();
actual.double = unpacker.unpackDouble();
actual.string = unpacker.unpackString();
actual.array = unpacker.unpackArray();
actual.map = unpacker.unpackMap();

Object.keys(expected).forEach((key) => {
  if (key === 'float') {
    assert.equal(expected.float.toFixed(2), actual.float.toFixed(2));
  } else if (key === 'array') {
    assert.equal(expected.array.length, actual.array.length);
    expected.array.forEach((element, idx) => {
      assert.equal(element, actual.array[idx]);
    });
  } else if (key === 'map') {
    assert.equal(expected.map.size, actual.map.size);
    expected.map.forEach((v, k) => {
      assert.equal(v, actual.map.get(k));
    });
  } else {
    assert.equal(expected[key], actual[key]);
  }
});
```

## Type Mapping

<table>
  <tr><th>Source Format</th><th>JavaScript Type</th></tr>
  <tr><td>positive fixint, negative fixint, int 8/16/32 and uint 8/16/32</td><td>Number</td></tr>
  <tr><td>int 64 and uint 64</td><td>Long</td></tr>
  <tr><td>nil</td><td>undefined</td></tr>
  <tr><td>false and true</td><td>Boolean</td></tr>
  <tr><td>float 32/64</td><td>Number</td></tr>
  <tr><td>fixstr and str 8/16/32</td><td>String</td></tr>
  <tr><td>bin 8/16/32</td><td>Array (of bytes)</td></tr>
  <tr><td>fixarray and array 16/32</td><td>Array</td></tr>
  <tr><td>fixmap map 16/32</td><td>Map</td></tr>
  <tr><td>fixext and ext 8/16/32</td><td>Extended</td></tr>
</table>

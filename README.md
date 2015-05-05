# msgpack-javascript

JavaScript implementation of the [MessagePack](https://github.com/msgpack/msgpack/blob/master/spec.md) protocol

## Getting Started

Make sure you have the latest packages installed

```
npm install
```

Note: If you don't have `npm` installed, make sure you have
[node](http://nodejs.com) installed. If you don't have bower,
`npm install -g bower`.

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

Object.keys(expected).forEach(function (key) {
  if (key === 'float') {
    assert.equal(expected.float.toFixed(2), actual.float.toFixed(2));
  } else if (key === 'array') {
    assert.equal(expected.array.length, actual.array.length);
    expected.array.forEach(function (element, idx) {
      assert.equal(element, actual.array[idx]);
    });
  } else if (key === 'map') {
    assert.equal(expected.map.size, actual.map.size);
    expected.map.forEach(function (v, k) {
      assert.equal(v, actual.map.get(k));
    });
  } else {
    assert.equal(expected[key], actual[key]);
  }
});
```
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

### Import
```javascript
import {Packer, Unpacker} from 'msgpack-javascript';
```

### Pack
```javascript
let packer = new Packer();

packer.packNil();
packer.packBoolean(true);
packer.packInt(0);
packer.packInt(255);
packer.packInt(65535);
packer.packInt(-2147483648);
packer.packInt(Date.now());
packer.packFloat(3.4028234 * Math.pow(10, 38));
packer.packDouble(1.7976931348623157 * Math.pow(10, 308));
packer.packString('yo fibre');
packer.packArray([0, true, 'p']);
packer.packBinary([0, 10, 255]);
packer.packMap(new Map([[0, 'foo'], [1, 'bar']]));
```

### Unpack
```javascript
let unpacker = new Unpacker(packer.getBytes()),
    actual = {};

unpacker = new Unpacker(packer.getBytes());
actual.nil = unpacker.unpackNil();
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
actual.binary = unpacker.unpackBinary();
actual.map = unpacker.unpackMap();
```

### Reflect
Packer.packValue allows packing of any value that may be identified as one of the standard value types 
(excluding Extended).

```javascript
let packer = new Packer();

packer.packValue(); // packs nil
packer.packValue(true); // packs bool
packer.packValue(0); // packs pos fixint
packer.packValue(255); // packs uint8
packer.packValue(65535); // packs uint16
packer.packValue(-2147483648); // packs int32
packer.packValue(Date.now()); // packs uint64
packer.packValue(3.4028234 * Math.pow(10, 38)); // packs float32
packer.packValue(1.7976931348623157 * Math.pow(10, 308)); // packs float64
packer.packValue('yo fibre'); // packs fixed string
packer.packValue([0, true, 'p']); // packs fixed array
packer.packValue([0, 10, 255]); // packs bin8
packer.packValue(new Map([[0, 'foo'], [1, 'bar']])); // packs fixed map
packer.packValue({foo: 'bar'}); // throws error
```

Unpacker.unpackValue unpacks the next value by evaluating the prefix of the next byte to be read.

## Type Mapping

### Source Format => JavaScript Type

<table>
  <tr><th>Source Format</th><th>JavaScript Type</th></tr>
  <tr><td>pos fixint, neg fixint, int 8/16/32 and uint 8/16/32</td><td>Number</td></tr>
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

### JavaScript Type => Output Format

<table>
  <tr><th>JavaScript Type</th><th>Output Format</th></tr>
  <tr><td>Number, Long</td><td>pos fixint, neg fixint, int 8/16/32/64, uint 8/16/32/64, float 32/64</td></tr>
  <tr><td>undefined, null</td><td>nil</td></tr>
  <tr><td>Boolean</td><td>false and true</td></tr>
  <tr><td>String</td><td>fixstr and str 8/16/32</td></tr>
  <tr><td>Array (of bytes)</td><td>bin 8/16/32</td></tr>
  <tr><td>Array</td><td>fixarray and array 16/32</td></tr>
  <tr><td>Map</td><td>fixmap map 16/32</td></tr>
</table>

### 64-bit Integers

Support for 64-bit integers is realised via npm package pg-long.

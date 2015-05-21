import {Packer, Unpacker} from '../../src/msgpack-javascript';
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

try {
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
} catch (e) {
  console.log('check usage.spec.es6', e.stack);
}

import Unpacker from '../../src/message-unpacker';
import Prefix from '../../src/message-prefix';
import JDataView from 'jdataview';
import NumberType from '../../src/number-type';
import {binariesEqual} from '../../src/value-type';
import Long from 'pg-long';
import {stringToByteArray} from 'pg-crypt';
import _ from 'lodash';
import {str8, str16, str32} from '../helper/big-string';

describe('Unpacker', () => {
  let apis = [{
    fn: 'unpackValue',
    tests: [
      {expected: Error, payload: [Prefix.NEVER_USED]}
    ]
  }, {
    fn: 'unpackArray',
    tests: [
      {expected: [NumberType.FIXNUM.minValue, NumberType.FIXNUM.maxValue], pos: 3,
        payload: [Prefix.FIXARRAY_PREFIX | 2, 224, 127]}
    ]
  }, {
    fn: 'unpackMap',
    tests: [
      {expected: new Map([[NumberType.FIXNUM.minValue, NumberType.FIXNUM.maxValue]]), pos: 3,
        payload: [Prefix.FIXMAP_PREFIX | 1, 224, 127]}
    ]
  }, {
    fn: 'unpackBinary',
    equals: binariesEqual,
    tests: [
      {expected: new JDataView([NumberType.FIXNUM.minValue, NumberType.FIXNUM.maxValue]).getBytes(),
            pos: 4,
        payload: [Prefix.BIN8, 2, 224, 127]}
    ]
  }, {
    fn: 'unpackNil',
    tests: [
      {expected: undefined, pos: 1, payload: [Prefix.NIL]}
    ]
  }, {
    fn: 'unpackBoolean',
    tests: [
      {expected: true, pos: 1, payload: [Prefix.TRUE]},
      {expected: false, pos: 1, payload: [Prefix.FALSE]},
      {expected: Error, payload: [Prefix.FIXSTR_PREFIX | 'foo'.length, 102, 111, 111]},
      {expected: Error}
    ]
  }, {
    fn: 'unpackInt',
    tests: [
      {expected: NumberType.FIXNUM.minValue, pos: 1, payload: [224]},
      {expected: NumberType.FIXNUM.maxValue, pos: 1, payload: [NumberType.FIXNUM.maxValue]},
      {expected: NumberType.BYTE.minValue, pos: 2, payload: [Prefix.INT8, 128]},
      {expected: NumberType.BYTE.maxValue, pos: 2, payload: [Prefix.UINT8, NumberType.BYTE.maxValue]},
      {expected: NumberType.SHORT.minValue, pos: 3, payload: [Prefix.INT16, 128, 0]},
      {expected: NumberType.SHORT.maxValue, pos: 3, payload: [Prefix.UINT16, 255, 255]},
      {expected: NumberType.INTEGER.minValue, pos: 5, payload: [Prefix.INT32, 128, 0, 0, 0]},
      {expected: NumberType.INTEGER.maxValue, pos: 5, payload: [Prefix.UINT32, 255, 255, 255, 255]},
      {expected: Long.MIN_VALUE, pos: 9, payload: [Prefix.INT64, 128, 0, 0, 0, 0, 0, 0, 0]},
      {expected: Long.MAX_VALUE, pos: 9, payload: [Prefix.UINT64, 127, 255, 255, 255, 255, 255, 255, 255]},
      {expected: Error, payload: [Prefix.FIXSTR_PREFIX | 'foo'.length, 102, 111, 111]},
      {expected: Error}
    ]
  }, {
    fn: 'unpackFloat',
    equals: NumberType.floatsEqual,
    tests: [
      {expected: 3.14, pos: 5, payload: [Prefix.FLOAT32, 64, 72, 245, 195]},
      {expected: Error, payload: [Prefix.FIXSTR_PREFIX | 'foo'.length, 102, 111, 111]},
      {expected: Error}
    ]
  }, {
    fn: 'unpackDouble',
    tests: [
      {expected: 3.14, pos: 9, payload: [Prefix.FLOAT64, 64, 9, 30, 184, 81, 235, 133, 31]},
      {expected: Error, payload: [Prefix.FIXSTR_PREFIX | 'foo'.length, 102, 111, 111]},
      {expected: Error}
    ]
  }, {
    fn: 'unpackString',
    tests: [
      {expected: 'foo', pos: 4, payload: [Prefix.FIXSTR_PREFIX | 'foo'.length, 102, 111, 111]},
      {expected: str8, pos: NumberType.BYTE.maxValue + 2,
        payload: [Prefix.STR8, 255].concat(stringToByteArray(str8))},
      {expected: str16, pos: NumberType.SHORT.maxValue + 4,
        payload: [Prefix.STR16, Prefix.UINT16, 255, 255].concat(stringToByteArray(str16))},
      {expected: str32, pos: NumberType.SHORT.maxValue + 7,
        payload: [Prefix.STR32, Prefix.UINT32, 0, 1, 0, 0].concat(stringToByteArray(str32))},
      {expected: Error}
    ]
  }, {
    fn: 'unpackArrayHeader',
    tests: [
      {expected: 15, pos: 1, payload: [Prefix.FIXARRAY_PREFIX | 15]},
      {expected: NumberType.SHORT.maxValue, pos: 4, payload: [Prefix.ARRAY16, Prefix.UINT16, 255, 255]},
      {expected: NumberType.INTEGER.maxValue, pos: 6, payload: [Prefix.ARRAY32, Prefix.UINT32, 255, 255, 255, 255]},
      {expected: Error, payload: [Prefix.FIXSTR_PREFIX | 'foo'.length, 102, 111, 111]},
      {expected: Error}
    ]
  }, {
    fn: 'unpackMapHeader',
    tests: [
      {expected: 15, pos: 1, payload: [Prefix.FIXMAP_PREFIX | 15]},
      {expected: NumberType.SHORT.maxValue, pos: 4, payload: [Prefix.MAP16, Prefix.UINT16, 255, 255]},
      {expected: NumberType.INTEGER.maxValue, pos: 6, payload: [Prefix.MAP32, Prefix.UINT32, 255, 255, 255, 255]},
      {expected: Error, payload: [Prefix.FIXSTR_PREFIX | 'foo'.length, 102, 111, 111]},
      {expected: Error}
    ]
  }, {
    fn: 'unpackBinaryHeader',
    tests: [
      {expected: NumberType.BYTE.maxValue, pos: 2, payload: [Prefix.BIN8, NumberType.BYTE.maxValue]},
      {expected: NumberType.SHORT.maxValue, pos: 4, payload: [Prefix.BIN16, Prefix.UINT16, 255, 255]},
      {expected: NumberType.INTEGER.maxValue, pos: 6, payload: [Prefix.BIN32, Prefix.UINT32, 255, 255, 255, 255]},
      {expected: Error, payload: [Prefix.FIXSTR_PREFIX | 'foo'.length, 102, 111, 111]},
      {expected: Error}
    ]
  }, {
    fn: 'unpackRawStringHeader',
    tests: [
      {expected: 15, pos: 1, payload: [Prefix.FIXSTR_PREFIX | 15]},
      {expected: NumberType.BYTE.maxValue, pos: 2, payload: [Prefix.STR8, NumberType.BYTE.maxValue]},
      {expected: NumberType.SHORT.maxValue, pos: 4, payload: [Prefix.STR16, Prefix.UINT16, 255, 255]},
      {expected: NumberType.INTEGER.maxValue, pos: 6, payload: [Prefix.STR32, Prefix.UINT32, 255, 255, 255, 255]},
      {expected: Error, payload: [Prefix.UINT16 | 'foo'.length, 102, 111, 111]},
      {expected: Error}
    ]
  }, {
    fn: 'unpackExtendedTypeHeader',
    tests: [
      {expected: {type: 0, length: 1}, pos: 2, payload: [Prefix.FIXEXT1, 0]},
      {expected: {type: 0, length: 2}, pos: 2, payload: [Prefix.FIXEXT2, 0]},
      {expected: {type: 0, length: 3}, pos: 3, payload: [Prefix.EXT8, 3, 0]},
      {expected: {type: 0, length: 4}, pos: 2, payload: [Prefix.FIXEXT4, 0]},
      {expected: {type: 0, length: 8}, pos: 2, payload: [Prefix.FIXEXT8, 0]},
      {expected: {type: 0, length: 16}, pos: 2, payload: [Prefix.FIXEXT16, 0]},
      {expected: {type: 0, length: 32}, pos: 3, payload: [Prefix.EXT8, 32, 0]},
      {expected: {type: 0, length: NumberType.SHORT.maxValue}, pos: 5,
        payload: [Prefix.EXT16, Prefix.UINT16, 255, 255, 0]},
      {expected: {type: 0, length: NumberType.INTEGER.maxValue}, pos: 7,
        payload: [Prefix.EXT32, Prefix.UINT32, 255, 255, 255, 255, 0]},
      {expected: Error, payload: [Prefix.NEVER_USED]},
      {expected: Error}
    ]
  }, {
    fn: 'readByte',
    privileged: true,
    tests: [
      {expected: NumberType.BYTE.minValue * -1, pos: 1, payload: [128]},
      {expected: NumberType.BYTE.maxValue, pos: 1, payload: [NumberType.BYTE.maxValue]},
      {expected: Error}
    ]
  }, {
    fn: 'getBytes',
    equals: binariesEqual,
    tests: [
      {expected: new JDataView([128]).getBytes(), pos: 0, payload: [128]}
    ]
  }];

  function doTest (api, test) {
    let unpacker = new Unpacker(test.payload || []),
        actual;

    if (test.expected === Error) {
      expect(function () {
        unpacker[api.fn].call(unpacker);
      }).toThrowError();
    } else {
      actual = unpacker[api.fn].call(unpacker);
      expect(unpacker.position).toEqual(test.pos);
      if (api.equals) {
        expect(api.equals(actual, test.expected)).toBeTruthy();
      } else if (test.equals) {
        expect(test.equals(actual, test.expected)).toBeTruthy();
      } else {
        expect(actual).toEqual(test.expected);
      }
    }
  }

  apis.forEach(function (api) {
    if (api.privileged) {
      it('should define privileged method ' + api.fn, () => {
        expect(new Unpacker([])[api.fn]).toBeDefined();
      });
    } else {
      it('should define public method ' + api.fn, () => {
        expect(Unpacker.prototype[api.fn]).toBeDefined();
      });
    }
    api.tests.forEach(function (test) {
      let expectedDesc;
      if (test.expected && test.expected === Error) {
        expectedDesc = 'Error';
      } else {
        expectedDesc = test.payload &&
          test.payload.length > 20 ? 'of length ' + test.payload.length : test.payload;
      }
      it(api.fn + ' should handle payload ' + expectedDesc, () => {
        doTest(api, test);
      });

      if (test.expected !== Error && _.startsWith(api.fn, 'unpack') && !_.endsWith(api.fn, 'Header') &&
          !_.endsWith(api.fn, 'Value')) {
        it('unpackValue should handle payload ' + expectedDesc, () => {
          doTest({fn: 'unpackValue', equals: api.equals}, test);
        });
      }
    });
  });
});

import Prefix from '../../src/message-prefix';
import Packer from '../../src/message-packer';
import NumberType from '../../src/number-type';
import Long from 'pg-long';
import _ from 'lodash';
import {str8, str16, str32} from '../helper/big-string';

describe('Packer', () => {
  let apis = [{
    fn: 'packNil',
    tests: [{pos: 1, expected: [Prefix.NIL]}]
  }, {
    fn: 'packValue',
    tests: [
      {arg: new Map([[0, 1]]), pos: 3, expected: [Prefix.FIXMAP_PREFIX | 1, 0, 1]},
      {arg: {}, pos: 5, expected: Error}
    ]
  }, {
    fn: 'packBoolean',
    tests: [
      {arg: true, pos: 1, expected: [Prefix.TRUE]},
      {arg: false, pos: 1, expected: [Prefix.FALSE]},
      {arg: 'foo', expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packInt',
    tests: [
      {arg: NumberType.FIXNUM.minValue, pos: 1, expected: [224]},
      {arg: NumberType.FIXNUM.maxValue, pos: 1, expected: [NumberType.FIXNUM.maxValue]},
      {arg: NumberType.BYTE.minValue, pos: 2, expected: [Prefix.INT8, 128]},
      {arg: NumberType.BYTE.maxValue, pos: 2, expected: [Prefix.UINT8, NumberType.BYTE.maxValue]},
      {arg: NumberType.SHORT.minValue, pos: 3, expected: [Prefix.INT16, 128, 0]},
      {arg: NumberType.SHORT.maxValue, pos: 3, expected: [Prefix.UINT16, 255, 255]},
      {arg: NumberType.INTEGER.minValue, pos: 5, expected: [Prefix.INT32, 128, 0, 0, 0]},
      {arg: NumberType.INTEGER.maxValue, pos: 5, expected: [Prefix.UINT32, 255, 255, 255, 255]},
      {arg: Date.UTC(2015, 0, 1, 0, 0, 0, 0), pos: 9, expected: [Prefix.UINT64, 0, 0, 1, 74, 162, 202, 176, 0]},
      {arg: Long.MIN_VALUE, pos: 9, expected: [Prefix.INT64, 128, 0, 0, 0, 0, 0, 0, 0]},
      {arg: Long.MAX_VALUE, pos: 9, expected: [Prefix.UINT64, 127, 255, 255, 255, 255, 255, 255, 255]},
      {arg: Long.MAX_UNSIGNED_VALUE, pos: 9, expected: [Prefix.UINT64, 255, 255, 255, 255, 255, 255, 255, 255]},
      {arg: 1.23, expected: Error},
      {arg: 'foo', expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packFloat',
    tests: [
      {arg: NumberType.FLOAT.minValue, pos: 5, expected: [Prefix.FLOAT32, 0, 0, 0, 1]},
      {arg: NumberType.FLOAT.maxValue, pos: 5, expected: [Prefix.FLOAT32, 127, 127, 255, 255]},
      {arg: 'foo', expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packDouble',
    tests: [
      {arg: NumberType.DOUBLE.minValue, pos: 9, expected: [Prefix.FLOAT64, 0, 0, 0, 0, 0, 0, 0, 1]},
      {arg: NumberType.DOUBLE.maxValue, pos: 9, expected: [Prefix.FLOAT64, 127, 239, 255, 255, 255, 255, 255, 255]},
      {arg: 'foo', expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packString',
    tests: [
      {arg: 'foo', pos: 4, expected: [Prefix.FIXSTR_PREFIX | 'foo'.length, 102, 111, 111]},
      {arg: str8, pos: NumberType.BYTE.maxValue + 2, expected: [Prefix.STR8, 255]},
      {arg: str16, pos: NumberType.SHORT.maxValue + 3, expected: [Prefix.STR16, 255, 255]},
      {arg: str32, pos: NumberType.SHORT.maxValue + 6, expected: [Prefix.STR32, 0, 1, 0, 0, 98]},
      {arg: 1, expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packArray',
    tests: [
      {arg: [], pos: 1,
        expected: [Prefix.FIXARRAY_PREFIX]},
      {arg: [NumberType.FIXNUM.minValue, NumberType.FIXNUM.maxValue], pos: 4,
        expected: [Prefix.BIN8, 2, 224, 127]},
      {arg: [NumberType.BYTE.minValue, NumberType.BYTE.maxValue], pos: 4,
        expected: [Prefix.BIN8, 2, 128, 255]},
      {arg: ['foo', 'bar'], pos: 9,
        expected: [Prefix.FIXARRAY_PREFIX | 2, 163, 102, 111, 111, 163, 98, 97, 114]},
      {arg: [false, true], pos: 3,
        expected: [Prefix.FIXARRAY_PREFIX | 2, Prefix.FALSE, Prefix.TRUE]},
      {arg: [[false, true]], pos: 4,
        expected: [Prefix.FIXARRAY_PREFIX | 1, Prefix.FIXARRAY_PREFIX | 2, Prefix.FALSE, Prefix.TRUE]},
      {arg: [0.1, 3.14], pos: 11,
        expected: [Prefix.FIXARRAY_PREFIX | 2, 202, 61, 204, 204, 205, 202, 64, 72, 245, 195]},
      {arg: [undefined, null], pos: 3,
        expected: [Prefix.FIXARRAY_PREFIX | 2, Prefix.NIL, Prefix.NIL]},
      {arg: [new Date()], expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packBinary',
    tests: [
      {arg: [NumberType.FIXNUM.minValue, NumberType.FIXNUM.maxValue], pos: 4,
        expected: [Prefix.BIN8, 2, 224, 127]},
      {arg: [NumberType.BYTE.minValue, NumberType.BYTE.maxValue], pos: 4,
        expected: [Prefix.BIN8, 2, 128, 255]},
      {expected: Error}
    ]
  }, {
    fn: 'packArrayHeader',
    tests: [
      {arg: 15, pos: 1, expected: [Prefix.FIXARRAY_PREFIX | 15]},
      {arg: NumberType.SHORT.maxValue, pos: 3, expected: [Prefix.ARRAY16, 255, 255]},
      {arg: NumberType.INTEGER.maxValue, pos: 5, expected: [Prefix.ARRAY32, 255, 255, 255, 255]},
      {arg: 'foo', expected: Error},
      {arg: -1, expected: Error},
      {arg: NumberType.INTEGER.maxValue + 1, expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packMapHeader',
    tests: [
      {arg: 15, pos: 1, expected: [Prefix.FIXMAP_PREFIX | 15]},
      {arg: NumberType.SHORT.maxValue, pos: 3, expected: [Prefix.MAP16, 255, 255]},
      {arg: NumberType.INTEGER.maxValue, pos: 5, expected: [Prefix.MAP32, 255, 255, 255, 255]},
      {arg: 'foo', expected: Error},
      {arg: -1, expected: Error},
      {arg: NumberType.INTEGER.maxValue + 1, expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packBinaryHeader',
    tests: [
      {arg: NumberType.BYTE.maxValue, pos: 2, expected: [Prefix.BIN8, NumberType.BYTE.maxValue]},
      {arg: NumberType.SHORT.maxValue, pos: 3, expected: [Prefix.BIN16, 255, 255]},
      {arg: NumberType.INTEGER.maxValue, pos: 5, expected: [Prefix.BIN32, 255, 255, 255, 255]},
      {arg: 'foo', expected: Error},
      {arg: -1, expected: Error},
      {arg: NumberType.INTEGER.maxValue + 1, expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packRawStringHeader',
    tests: [
      {arg: 15, pos: 1, expected: [Prefix.FIXSTR_PREFIX | 15]},
      {arg: NumberType.BYTE.maxValue, pos: 2, expected: [Prefix.STR8, NumberType.BYTE.maxValue]},
      {arg: NumberType.SHORT.maxValue, pos: 3, expected: [Prefix.STR16, 255, 255]},
      {arg: NumberType.INTEGER.maxValue, pos: 5, expected: [Prefix.STR32, 255, 255, 255, 255]},
      {arg: 'foo', expected: Error},
      {arg: -1, expected: Error},
      {arg: NumberType.INTEGER.maxValue + 1, expected: Error},
      {expected: Error}
    ]
  }, {
    fn: 'packExtendedTypeHeader',
    tests: [
      {args: [0, 1], pos: 2, expected: [Prefix.FIXEXT1, 0]},
      {args: [0, 2], pos: 2, expected: [Prefix.FIXEXT2, 0]},
      {args: [0, 3], pos: 3, expected: [Prefix.EXT8, 3, 0]},
      {args: [0, 4], pos: 2, expected: [Prefix.FIXEXT4, 0]},
      {args: [0, 8], pos: 2, expected: [Prefix.FIXEXT8, 0]},
      {args: [0, 16], pos: 2, expected: [Prefix.FIXEXT16, 0]},
      {args: [0, 32], pos: 3, expected: [Prefix.EXT8, 32, 0]},
      {args: [0, NumberType.SHORT.maxValue], pos: 4, expected: [Prefix.EXT16, 255, 255, 0]},
      {args: [0, NumberType.INTEGER.maxValue], pos: 6,
        expected: [Prefix.EXT32, 255, 255, 255, 255, 0]},
      {expected: Error}
    ]
  }, {
    fn: 'writeByte',
    privileged: true,
    tests: [
      {arg: NumberType.BYTE.minValue, pos: 1, expected: [128]},
      {arg: NumberType.BYTE.maxValue, pos: 1, expected: [NumberType.BYTE.maxValue]}
    ]
  }];

  function doTest (api, test) {
    let packer = new Packer(512 * 1024);
    if (test.expected === Error) {
      expect(function () {
        packer[api.fn].call(packer, test.arg);
      }).toThrowError();
    } else {
      if (test.args) {
        packer[api.fn].apply(packer, test.args);
      } else {
        packer[api.fn].call(packer, test.arg);
      }
      expect(packer.position).toEqual(test.pos);
      test.expected.forEach(function (byte, idx) {
        expect(packer.getBytes()[idx]).toEqual(byte);
      });
    }
  }

  apis.forEach((api) => {
    if (api.privileged) {
      it('should define privileged method ' + api.fn, () => {
        expect(new Packer()[api.fn]).toBeDefined();
      });
    } else {
      it('should define public method ' + api.fn, () => {
        expect(Packer.prototype[api.fn]).toBeDefined();
      });
    }
    api.tests.forEach((test) => {
      let argDesc;

      if (test.args) {
        argDesc = test.args;
      } else {
        argDesc = test.arg && test.arg.length > 20 ? 'of length ' + test.arg.length : test.arg;
      }

      it(api.fn + ' should handle arg ' + argDesc, () => {
        doTest(api, test);
      });

      if (test.expected !== Error && _.startsWith(api.fn, 'pack') && !_.endsWith(api.fn, 'Header') &&
          !_.endsWith(api.fn, 'Value')) {
        it('packValue should handle payload ' + argDesc + ' [' + api.fn + ']', () => {
          doTest({fn: 'packValue', equals: api.equals}, test);
        });
      }
    });
  });
});

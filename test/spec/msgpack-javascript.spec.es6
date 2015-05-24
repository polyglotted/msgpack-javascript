import msgpack from '../../src/msgpack-javascript';
import NumberType from '../../src/number-type';
import {string} from '../helper/big-string';
import Long from 'pg-long';

describe('msgpack', () => {
  let Packer = msgpack.Packer,
      Unpacker = msgpack.Unpacker,
      Scale = msgpack.Scale,
      members = ['Prefix', 'Packer', 'Unpacker', 'Scale'],
      apis;

  members.forEach((member) => {
    it('should define member ' + member, () => {
      expect(msgpack[member]).toBeDefined();
    });
  });

  apis = [{
    fnSuffix: 'Nil',
    tests: [
      {value: undefined}
    ]
  }, {
    fnSuffix: 'Boolean',
    tests: [
      {value: true},
      {value: false}
    ]
  }, {
    fnSuffix: 'Int',
    tests: [
      {value: NumberType.FIXNUM.minValue},
      {value: NumberType.FIXNUM.maxValue},
      {value: NumberType.BYTE.minValue},
      {value: NumberType.BYTE.maxValue},
      {value: NumberType.SHORT.minValue},
      {value: NumberType.SHORT.maxValue},
      {value: NumberType.INTEGER.minValue},
      {value: NumberType.INTEGER.maxValue},
      {value: Long.MIN_VALUE},
      {value: Long.fromBits(-1, 2147483647, true)},
      {value: Long.MAX_UNSIGNED_VALUE}
    ]
  }, {
    fnSuffix: 'Float',
    equals: NumberType.floatsEqual,
    tests: [
      {value: 3.14}
    ]
  }, {
    fnSuffix: 'Double',
    tests: [
      {value: 3.14}
    ]
  }, {
    fnSuffix: 'String',
    tests: [
      {value: 'foo'},
      {value: string(NumberType.BYTE.maxValue)},
      {value: string(NumberType.SHORT.maxValue)}
    ]
  }, {
    fnSuffix: 'ArrayHeader',
    tests: [
      {value: 15},
      {value: NumberType.SHORT.maxValue},
      {value: NumberType.INTEGER.maxValue}
    ]
  }, {
    fnSuffix: 'MapHeader',
    tests: [
      {value: 15},
      {value: NumberType.SHORT.maxValue},
      {value: NumberType.INTEGER.maxValue}
    ]
  }, {
    fnSuffix: 'BinaryHeader',
    tests: [
      {value: NumberType.BYTE.maxValue},
      {value: NumberType.SHORT.maxValue},
      {value: NumberType.INTEGER.maxValue}
    ]
  }, {
    fnSuffix: 'RawStringHeader',
    tests: [
      {value: 15},
      {value: NumberType.BYTE.maxValue},
      {value: NumberType.SHORT.maxValue},
      {value: NumberType.INTEGER.maxValue}
    ]
  }, {
    fnSuffix: 'ExtendedTypeHeader',
    tests: [
      {values: [0, 1]},
      {values: [0, 2]},
      {values: [0, 3]},
      {values: [0, 4]},
      {values: [0, 8]},
      {values: [0, 16]},
      {values: [0, 32]},
      {values: [0, NumberType.SHORT.maxValue]},
      {values: [0, NumberType.INTEGER.maxValue]}
    ]
  }];

  apis.forEach((api) => {
    api.tests.forEach((test) => {
      let valueDesc = test.value && test.value.length > 20 ? 'of length ' + test.value.length : test.value;
      it('should pack and unpack ' + api.fnSuffix + ' for value ' + valueDesc, () => {
        let scale = new Scale(),
            packer,
            unpacker,
            actual;
        if (api.fnSuffix !== 'ExtendedTypeHeader') {
          scale['pack' + api.fnSuffix].call(scale, test.value);
          packer = new Packer(scale.position);
          packer['pack' + api.fnSuffix].call(packer, test.value);
          unpacker = new Unpacker(packer.getBytes());
          actual = unpacker['unpack' + api.fnSuffix].call(unpacker);
          if (api.equals) {
            expect(api.equals(actual, test.value)).toBeTruthy();
          } else {
            expect(actual).toEqual(test.value);
          }
        } else {
          scale['pack' + api.fnSuffix].apply(scale, test.values);
          packer = new Packer(scale.position);
          packer['pack' + api.fnSuffix].apply(packer, test.values);
          unpacker = new Unpacker(packer.getBytes());
          actual = unpacker['unpack' + api.fnSuffix].call(unpacker);
          expect(actual).toEqual({type: test.values[0], length: test.values[1]});
        }
      });
    });
  });
});

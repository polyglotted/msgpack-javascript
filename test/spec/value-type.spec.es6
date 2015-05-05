import Prefix from '../../src/message-prefix';
import ValueType from '../../src/value-type';
import NumberType from '../../src/number-type';

describe('ValueType', () => {
  let members,
      methods,
      types;

  members = ['NIL', 'BOOLEAN', 'INTEGER', 'FLOAT', 'STRING', 'BINARY', 'ARRAY', 'MAP', 'EXTENDED'];

  methods = ['getBitMask', 'isTypeOf', 'isNilType', 'isBooleanType', 'isNumberType',
    'isIntegerType', 'isFloatType', 'isRawType', 'isStringType', 'isBinaryType',
    'isArrayType', 'isMapType', 'isExtendedType'];

  members.forEach(function (member) {
    it('should define member ' + member, () => {
      expect(ValueType[member]).toBeDefined();
    });

    methods.forEach(function (method) {
      it(member + ' should define method ' + method, () => {
        expect(ValueType[member][method]).toBeDefined();
        spyOn(ValueType[member], method).and.callThrough();
        ValueType[member][method].call();
        expect(ValueType[member][method]).toHaveBeenCalled();
      });
    });
  });

  it('binariesEqual should handle non-binary arguments', function () {
    expect(ValueType.binariesEqual('foo', 'bar')).toBeFalsy();
    expect(ValueType.binariesEqual([0, 256], [0, 256])).toBeFalsy();
  });

  types = [{
    name: 'NIL',
    tests: [undefined, null],
    prefixes: [Prefix.NIL],
    contains: []
  }, {
    name: 'BOOLEAN',
    tests: [true, false],
    prefixes: [Prefix.TRUE, Prefix.FALSE],
    contains: []
  }, {
    name: 'STRING',
    tests: ['poly'],
    prefixes: [Prefix.STR8, Prefix.STR16, Prefix.STR32],
    contains: []
  }, {
    name: 'INTEGER',
    tests: [NumberType.FIXNUM.minValue, NumberType.FIXNUM.maxValue - 1],
    prefixes: [Prefix.INT8],
    contains: []
  }, {
    name: 'FLOAT',
    tests: [0.123],
    prefixes: [Prefix.FLOAT32, Prefix.FLOAT64],
    contains: []
  }, {
    name: 'ARRAY',
    tests: [[0.1, 1, 2]],
    prefixes: [Prefix.FIXARRAY_PREFIX, Prefix.ARRAY16, Prefix.ARRAY32],
    contains: []
  }, {
    name: 'BINARY',
    tests: [[0, 1, 2], [NumberType.FIXNUM.minValue, NumberType.FIXNUM.maxValue],
      [NumberType.BYTE.minValue, NumberType.BYTE.maxValue]],
    prefixes: [Prefix.BIN8, Prefix.BIN16, Prefix.BIN32],
    contains: []
  }, {
    name: 'MAP',
    tests: [],
    prefixes: [Prefix.FIXMAP_PREFIX, Prefix.MAP16, Prefix.MAP32],
    contains: [new Map([[0, 1]])]
  }, {
    name: 'EXTENDED',
    tests: [],
    prefixes: [Prefix.FIXEXT1, Prefix.EXT8, Prefix.EXT16, Prefix.EXT32],
    contains: ['foo']
  }];

  types.forEach(function (type) {
    type.tests.forEach(function (test) {
      it('valueOf should evaluate ' + test + ' as ' + type.name, () => {
        expect(ValueType.valueOf(test)).toEqual(ValueType[type.name]);
      });
    });
    type.prefixes.forEach(function (prefix) {
      it('typeOf should evaluate ' + prefix + ' as ' + type.name, () => {
        expect(ValueType.typeOf(prefix)).toEqual(ValueType[type.name]);
      });
    });
    type.contains.forEach(function (contained) {
      it(type.name + ' should include ' + contained, () => {
        expect(ValueType[type.name].contains(contained)).toBeTruthy();
      });
    });
  });
});

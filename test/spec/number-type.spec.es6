import NumberType from '../../src/number-type';
import Long from 'pg-long';

describe('NumberType', () => {
  let members,
      methods,
      staticMethods,
      types;

  members = ['FIXNUM', 'BYTE', 'SHORT', 'INTEGER', 'LONG', 'FLOAT', 'DOUBLE'];

  methods = ['contains'];

  members.forEach((member) => {
    it('should define member ' + member, () => {
      expect(NumberType[member]).toBeDefined();
    });

    methods.forEach((method) => {
      it(member + ' should define method ' + method, () => {
        expect(NumberType[member][method]).toBeDefined();
        spyOn(NumberType[member], method).and.callThrough();
        NumberType[member][method].call();
        expect(NumberType[member][method]).toHaveBeenCalled();
      });
    });
  });

  staticMethods = ['isInteger', 'isFloat', 'isDouble', 'floatsEqual'];

  staticMethods.forEach((method) => {
    it('should define static method ' + method, () => {
      expect(NumberType[method]).toBeDefined();
      spyOn(NumberType, method).and.callThrough();
      NumberType[method].call();
      expect(NumberType[method]).toHaveBeenCalled();
    });
  });

  types = [{
    name: 'FIXNUM',
    tests: [NumberType.FIXNUM.minValue, NumberType.FIXNUM.maxValue],
    contains: [NumberType.FIXNUM.minValue, NumberType.FIXNUM.maxValue]
  }, {
    name: 'BYTE',
    tests: [NumberType.BYTE.minValue, NumberType.BYTE.maxValue],
    contains: [NumberType.BYTE.minValue, NumberType.BYTE.maxValue]
  }, {
    name: 'SHORT',
    tests: [NumberType.SHORT.minValue, NumberType.SHORT.maxValue],
    contains: [NumberType.SHORT.minValue, NumberType.SHORT.maxValue]
  }, {
    name: 'INTEGER',
    tests: [NumberType.INTEGER.minValue, NumberType.INTEGER.maxValue],
    contains: [NumberType.INTEGER.minValue, NumberType.INTEGER.maxValue, Long.fromString('-99999')]
  }, {
    name: 'LONG',
    tests: [Long.MIN_VALUE, Long.MAX_VALUE, Long.MAX_UNSIGNED_VALUE],
    contains: [Long.MIN_VALUE, Long.MAX_VALUE, Long.MAX_UNSIGNED_VALUE, NumberType.BYTE.maxValue]
  }, {
    name: 'FLOAT',
    tests: [NumberType.FLOAT.minValue, NumberType.FLOAT.maxValue],
    contains: [NumberType.FLOAT.minValue, NumberType.FLOAT.maxValue]
  }, {
    name: 'DOUBLE',
    tests: [NumberType.DOUBLE.minValue, NumberType.DOUBLE.maxValue],
    contains: [NumberType.DOUBLE.minValue, NumberType.DOUBLE.maxValue]
  }];

  types.forEach((type) => {
    type.tests.forEach((test) => {
      it('valueOf should evaluate ' + test + ' as ' + type.name, () => {
        expect(NumberType.valueOf(test)).toEqual(NumberType[type.name]);
      });
    });
    type.contains.forEach((contained) => {
      it(type.name + ' should include ' + contained, () => {
        expect(NumberType[type.name].contains(contained)).toBeTruthy();
      });
    });
  });
});

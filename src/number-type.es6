import _ from 'lodash';
import Long from 'long';

function isInteger (n) {
  return +n === n && n % 1 === 0;
}

function isFloat (n) {
  return +n === n && Math.abs(n) <= (3.4028234 * Math.pow(10, 38));
}

function isDouble (n) {
  return +n === n && Math.abs(n) <= (1.7976931348623157 * Math.pow(10, 308));
}

function floatsEqual (a, b, p) {
  let precision = p || 3;
  return isDouble(a) && isDouble(b) && a.toFixed(precision) === b.toFixed(precision);
}

class NumberType {
  constructor (minValue, maxValue, containsFn) {
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.containsFn = containsFn;
  }
  contains (value) {
    return this.containsFn ? this.containsFn.call(this, value) :
      (isInteger(value) || value instanceof Long) && value >= this.minValue && value <= this.maxValue;
  }
}

let FIXNUM = new NumberType(-0x20, 0x7F),
    BYTE = new NumberType(-0x80, 0xFF),
    SHORT = new NumberType(-0x8000, 0xFFFF),
    INTEGER = new NumberType(-0x80000000, 0xFFFFFFFF),
    LONG = new NumberType(-0x8000000000000000, 0x7FFFFFFFFFFFFFFF),
    FLOAT = new NumberType(-3.4028234e+38, 3.4028234e+38, isFloat),
    DOUBLE = new NumberType(-1.7976931348623157e+308, 1.7976931348623157e+308, isDouble);

function valueOf (n) {
  return _.find([FIXNUM, BYTE, SHORT, INTEGER, LONG, FLOAT, DOUBLE], function (type) {
    return type.contains(n);
  });
}

export default {FIXNUM, BYTE, SHORT, INTEGER, LONG, FLOAT, DOUBLE, valueOf, isInteger, isFloat, isDouble, floatsEqual};

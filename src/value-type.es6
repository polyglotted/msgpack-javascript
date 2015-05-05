import Long from 'long';
import Prefix from './message-prefix';
import NumberType from './number-type';
import _ from 'lodash';

function isArray (x) {
  return _.isArray(x) || x instanceof Uint8Array || x instanceof Buffer;
}

let NIL, BOOLEAN, INTEGER, FLOAT, STRING, BINARY, ARRAY, MAP, EXTENDED;

class ValueType {
  constructor (ordinal, numberType, rawType, contains) {
    this.ordinal = ordinal;
    this.numberType = numberType;
    this.rawType = rawType;
    this.bitMask = 1 << this.ordinal;
    this.contains = contains;
  }

  getBitMask () {
    return this.bitMask;
  }

  isTypeOf (bitMask) {
    return (this.bitMask & bitMask) !== 0;
  }

  isNilType () {
    return this === NIL;
  }

  isBooleanType () {
    return this === BOOLEAN;
  }

  isNumberType () {
    return this.numberType;
  }

  isIntegerType () {
    return this === INTEGER;
  }

  isFloatType () {
    return this === FLOAT;
  }

  isRawType () {
    return this.rawType;
  }

  isStringType () {
    return this === STRING;
  }

  isBinaryType () {
    return this === BINARY;
  }

  isArrayType () {
    return this === ARRAY;
  }

  isMapType () {
    return this === MAP;
  }

  isExtendedType () {
    return this === EXTENDED;
  }
}

NIL = new ValueType(0, false, false, function (x) {
  return _.isNull(x) || _.isUndefined(x);
});
BOOLEAN = new ValueType(1, false, false, _.isBoolean);
INTEGER = new ValueType(2, true, false, function (x) {
  return NumberType.isInteger(x) || x instanceof Long;
});
FLOAT = new ValueType(3, true, false, function (x) {
  return NumberType.isFloat(x) || NumberType.isDouble(x);
});
STRING = new ValueType(4, false, true, _.isString);
BINARY = new ValueType(5, false, true, function (x) {
  return isArray(x) && _.every(x, function (e) {
    return NumberType.isInteger(e) && NumberType.BYTE.contains(e);
  });
});
ARRAY = new ValueType(6, false, false, _.isArray);
MAP = new ValueType(7, false, false, function (x) {
  return x instanceof Map;
});
EXTENDED = new ValueType(8, false, true, function () {
  return true;
});

function valueOf (x) {
  return _.find([NIL, BOOLEAN, INTEGER, FLOAT, STRING, BINARY, ARRAY, MAP, EXTENDED], function (type) {
    return type.contains(x);
  });
}

function typeOf (prefix) {
  if (Prefix.isFixInt(prefix)) {
    return INTEGER;
  } else if (Prefix.isFixedArray(prefix)) {
    return ARRAY;
  } else if (Prefix.isFixedMap(prefix)) {
    return MAP;
  } else if (Prefix.isFixStr(prefix)) {
    return STRING;
  }

  let type;

  switch (prefix) {
    case Prefix.TRUE:
    case Prefix.FALSE:
      type = BOOLEAN;
      break;
    case Prefix.NIL:
      type = NIL;
      break;
    case Prefix.STR8:
    case Prefix.STR16:
    case Prefix.STR32:
      type = STRING;
      break;
    case Prefix.ARRAY16:
    case Prefix.ARRAY32:
      type = ARRAY;
      break;
    case Prefix.MAP16:
    case Prefix.MAP32:
      type = MAP;
      break;
    case Prefix.INT8:
    case Prefix.UINT8:
    case Prefix.INT16:
    case Prefix.UINT16:
    case Prefix.INT32:
    case Prefix.UINT32:
    case Prefix.INT64:
    case Prefix.UINT64:
      type = INTEGER;
      break;
    case Prefix.FLOAT32:
    case Prefix.FLOAT64:
      type = FLOAT;
      break;
    case Prefix.FIXEXT1:
    case Prefix.FIXEXT2:
    case Prefix.FIXEXT4:
    case Prefix.FIXEXT8:
    case Prefix.FIXEXT16:
    case Prefix.EXT8:
    case Prefix.EXT16:
    case Prefix.EXT32:
      type = EXTENDED;
      break;
    case Prefix.BIN8:
    case Prefix.BIN16:
    case Prefix.BIN32:
      type = BINARY;
      break;
    default:
      type = undefined;
  }
  return type;
}

function binariesEqual (thisB, thatB) {
  if (!BINARY.contains(thisB) || !BINARY.contains(thatB)) {
    return false;
  }
  return thisB.length === thatB.length && _.every(thisB, function (element, index) {
    return element === thatB[index];
  });
}

export default {NIL, BOOLEAN, INTEGER, FLOAT, STRING, BINARY, ARRAY, MAP, EXTENDED, valueOf, typeOf, binariesEqual};

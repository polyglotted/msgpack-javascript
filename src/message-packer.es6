import JDataView from 'jdataview';
import Long from 'pg-long';
import Prefix from './message-prefix';
import NumberType from './number-type';
import ValueType from './value-type';
import _ from 'lodash';
import {stringToUtf8ByteArray} from 'pg-crypt';

let isArrayLike = (value) => {
  return _.isArray(value) || value instanceof Buffer || value instanceof Uint8Array;
};

class MessagePacker {
  constructor (length) {
    this.$dv = new JDataView(length || 512);
    this.$position = 0;

    this.writeByte = (byte) => {
      this.$dv[byte < 0 ? 'setInt8' : 'setUint8'](this.$position++, byte);
    };

    this.writeShort = (short, prefix) => {
      if (_.isUndefined(prefix)) {
        this.writeByte(short < 0 ? Prefix.INT16 : Prefix.UINT16);
      }
      this.$dv[short < 0 ? 'setInt16' : 'setUint16'](this.$position, short);
      this.$position += 2;
    };

    this.writeInt = (int, prefix) => {
      if (_.isUndefined(prefix)) {
        this.writeByte(int < 0 ? Prefix.INT32 : Prefix.UINT32);
      }
      this.$dv[int < 0 ? 'setInt32' : 'setUint32'](this.$position, int);
      this.$position += 4;
    };

    this.writeLong = (value) => {
      let long = value;
      if (!Long.isLong(long)) {
        long = Long.fromNumber(long);
      }
      this.writeByte(long.lessThan(Long.ZERO) ? Prefix.INT64 : Prefix.UINT64);
      this.$dv.setInt32(this.$position, long.getHighBits());
      this.$dv.setInt32(this.$position + 4, long.getLowBits());
      this.$position += 8;
    };

    this.writeFloat = (float) => {
      this.writeByte(Prefix.FLOAT32);
      this.$dv.setFloat32(this.$position, float);
      this.$position += 4;
    };

    this.writeDouble = (double) => {
      this.writeByte(Prefix.FLOAT64);
      this.$dv.setFloat64(this.$position, double);
      this.$position += 8;
    };

    this.writePayload = (source, offset, len) => {
      if (!isArrayLike(source)) {
        throw Error('expect array-like source');
      }
      let o = offset || 0,
          l = len || source.length,
          i;
      for (i = o; i < l; i++) {
        this.writeByte(source[i]);
      }
    };
  }

  getBytes () {
    return this.$dv.getBytes(this.$position, 0);
  }

  get position () {
    return this.$position;
  }

  packNil () {
    this.writeByte(Prefix.NIL);
    return this;
  }

  packBoolean (value) {
    if (!_.isBoolean(value)) {
      throw Error('packBoolean expects a boolean');
    }
    this.writeByte(value ? Prefix.TRUE : Prefix.FALSE);
    return this;
  }

  packInt (value) {
    if (!NumberType.LONG.contains(value)) {
      throw Error('packInt expects a value within Long range');
    }
    switch (NumberType.valueOf(value)) {
      case NumberType.FIXNUM:
        this.writeByte(value);
        break;
      case NumberType.BYTE:
        this.writeByte(value < 0 ? Prefix.INT8 : Prefix.UINT8);
        this.writeByte(value);
        break;
      case NumberType.SHORT:
        this.writeShort(value);
        break;
      case NumberType.INTEGER:
        this.writeInt(value);
        break;
      default:
        this.writeLong(value);
    }
    return this;
  }

  packFloat (value) {
    if (!NumberType.isFloat(value)) {
      throw Error('packFloat expects a float');
    }
    this.writeFloat(value);
    return this;
  }

  packDouble (value) {
    if (!NumberType.isDouble(value)) {
      throw Error('packDouble expects a double');
    }
    this.writeDouble(value);
    return this;
  }

  packString (value) {
    if (!_.isString(value)) {
      throw Error('packString expects a string');
    }
    let v = stringToUtf8ByteArray(value);
    this.packRawStringHeader(v.length);
    this.writePayload(v);
    return this;
  }

  packValue (value) {
    let type = ValueType.valueOf(value),
        method;
    switch (type) {
      case ValueType.NIL:
        method = 'Nil';
        break;
      case ValueType.BOOLEAN:
        method = 'Boolean';
        break;
      case ValueType.INTEGER:
        method = 'Int';
        break;
      case ValueType.FLOAT:
        method = NumberType.isFloat(value) ? 'Float' : 'Double';
        break;
      case ValueType.STRING:
        method = 'String';
        break;
      case ValueType.BINARY:
        method = 'Binary';
        break;
      case ValueType.ARRAY:
        method = 'Array';
        break;
      case ValueType.MAP:
        method = 'Map';
        break;
      default:
        throw new Error('unhandled value type for value ' + value);
    }
    this['pack' + method].call(this, value);
  }

  packArray (array) {
    if (!_.isArrayLike(array)) {
      throw Error('packArray expects an array');
    }

    if (array.length > 0 && ValueType.BINARY.contains(array)) {
      return this.packBinary(array);
    }

    this.packArrayHeader(array.length);

    array.forEach(function (item) {
      this.packValue(item);
    }, this);

    return this;
  }

  packArrayHeader (size) {
    if (!_.isNumber(size)) {
      throw Error('packArrayHeader expects size to be a number');
    }
    if (size < 0) {
      throw Error('packArrayHeader expects size >= 0');
    }
    if (size > NumberType.INTEGER.maxValue) {
      throw Error('packArrayHeader expects size <= ' + NumberType.INTEGER.maxValue);
    }

    if (size < (1 << 4)) {
      this.writeByte(Prefix.FIXARRAY_PREFIX | size);
    } else if (size < (1 << 16)) {
      this.writeByte(Prefix.ARRAY16);
      this.writeShort(size, Prefix.UINT16);
    } else {
      this.writeByte(Prefix.ARRAY32);
      this.writeInt(size, Prefix.UINT32);
    }
    return this;
  }

  packMap (map) {
    if (!(map instanceof Map)) {
      throw Error('packMap expects a Map');
    }

    this.packMapHeader(map.size);

    map.forEach(function (value, key) {
      this.packValue(key);
      this.packValue(value);
    }, this);

    return this;
  }

  packMapHeader (size) {
    if (!_.isNumber(size)) {
      throw Error('packMapHeader expects size to be a number');
    }
    if (size < 0) {
      throw Error('packMapHeader expects size >= 0');
    }
    if (size > NumberType.INTEGER.maxValue) {
      throw Error('packMapHeader expects size <= ' + NumberType.INTEGER.maxValue);
    }

    if (size < (1 << 4)) {
      this.writeByte(Prefix.FIXMAP_PREFIX | size);
    } else if (size < (1 << 16)) {
      this.writeByte(Prefix.MAP16);
      this.writeShort(size, Prefix.UINT16);
    } else {
      this.writeByte(Prefix.MAP32);
      this.writeInt(size, Prefix.UINT32);
    }
    return this;
  }

  packBinary (array) {
    if (!ValueType.BINARY.contains(array)) {
      throw Error('packBinary expects a byte array');
    }

    this.packBinaryHeader(array.length);
    this.writePayload(array);

    return this;
  }

  packBinaryHeader (length) {
    if (!_.isNumber(length)) {
      throw Error('packBinaryHeader expects length to be a number');
    }
    if (length < 0) {
      throw Error('packBinaryHeader expects length >= 0');
    }
    if (length > NumberType.INTEGER.maxValue) {
      throw Error('packBinaryHeader expects length <= ' + NumberType.INTEGER.maxValue);
    }

    if (length < (1 << 8)) {
      this.writeByte(Prefix.BIN8);
      this.writeByte(length);
    } else if (length < (1 << 16)) {
      this.writeByte(Prefix.BIN16);
      this.writeShort(length, Prefix.UINT16);
    } else {
      this.writeByte(Prefix.BIN32);
      this.writeInt(length, Prefix.UINT32);
    }
    return this;
  }

  packRawStringHeader (length) {
    if (!_.isNumber(length)) {
      throw Error('packRawStringHeader expects length to be a number');
    }
    if (length < 0) {
      throw Error('packRawStringHeader expects length >= 0');
    }
    if (length > NumberType.INTEGER.maxValue) {
      throw Error('packRawStringHeader expects length <= ' + NumberType.INTEGER.maxValue);
    }

    if (length < (1 << 5)) {
      this.writeByte(Prefix.FIXSTR_PREFIX | length);
    } else if (length < (1 << 8)) {
      this.writeByte(Prefix.STR8);
      this.writeByte(length);
    } else if (length < (1 << 16)) {
      this.writeByte(Prefix.STR16);
      this.writeShort(length, Prefix.UINT16);
    } else {
      this.writeByte(Prefix.STR32);
      this.writeInt(length, Prefix.UINT32);
    }
    return this;
  }

  packExtendedTypeHeader (extType, payloadLength) {
    if (!_.isNumber(extType)) {
      throw Error('packExtendedTypeHeader expects extType to be a number');
    }
    if (!_.isNumber(payloadLength)) {
      throw Error('packExtendedTypeHeader expects payloadLength to be a number');
    }
    if (payloadLength < 0) {
      throw Error('packExtendedTypeHeader expects payloadLength >= 0');
    }
    if (payloadLength > NumberType.INTEGER.maxValue) {
      throw Error('packExtendedTypeHeader expects payloadLength <= ' + NumberType.INTEGER.maxValue);
    }

    if (payloadLength < (1 << 8)) {
      switch (payloadLength) {
        case 1:
          this.writeByte(Prefix.FIXEXT1);
          this.writeByte(extType);
          break;
        case 2:
          this.writeByte(Prefix.FIXEXT2);
          this.writeByte(extType);
          break;
        case 4:
          this.writeByte(Prefix.FIXEXT4);
          this.writeByte(extType);
          break;
        case 8:
          this.writeByte(Prefix.FIXEXT8);
          this.writeByte(extType);
          break;
        case 16:
          this.writeByte(Prefix.FIXEXT16);
          this.writeByte(extType);
          break;
        default:
          this.writeByte(Prefix.EXT8);
          this.writeByte(payloadLength);
          this.writeByte(extType);
      }
    } else if (payloadLength < (1 << 16)) {
      this.writeByte(Prefix.EXT16);
      this.writeShort(payloadLength, Prefix.UINT16);
      this.writeByte(extType);
    } else {
      this.writeByte(Prefix.EXT32);
      this.writeInt(payloadLength, Prefix.UINT32);
      this.writeByte(extType);
    }
    return this;
  }
}

export default MessagePacker;

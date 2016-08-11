import JDataView from 'jdataview';
import Long from 'pg-long';
import Prefix from './message-prefix';
import ValueType from './value-type';
import {utf8ByteArrayToString} from 'pg-crypt';
import _ from 'lodash';

class MessageUnpacker {
  constructor (bytesOrBuffer) {
    this.$dv = new JDataView(bytesOrBuffer);
    this.$position = 0;

    this.readByte = function () {
      return this.$dv.getUint8(this.$position++);
    };

    this.readSignedByte = function () {
      return this.$dv.getInt8(this.$position++);
    };

    this.readShort = function (pre) {
      let prefix = _.isUndefined(pre) ? this.readByte() : pre,
          value;
      if (!_.includes([Prefix.INT16, Prefix.UINT16], prefix)) {
        throw Error('readShort expects to read Prefix.INT16 or Prefix.UINT16');
      }
      value = this.$dv[prefix === Prefix.INT16 ? 'getInt16' : 'getUint16'](this.$position);
      this.$position += 2;
      return value;
    };

    this.readInt = function (pre) {
      let prefix = _.isUndefined(pre) ? this.readByte() : pre,
          value;
      if (!_.includes([Prefix.INT32, Prefix.UINT32], prefix)) {
        throw Error('readInt expects to read Prefix.INT32 or Prefix.UINT32');
      }
      value = this.$dv[prefix === Prefix.INT32 ? 'getInt32' : 'getUint32'](this.$position);
      this.$position += 4;
      return value;
    };

    this.readLong = function () {
      let prefix = this.readByte(),
          highBits,
          lowBits;
      if (!_.includes([Prefix.INT64, Prefix.UINT64], prefix)) {
        throw Error('readLong expects to read Prefix.INT64 or Prefix.UINT64');
      }
      highBits = this.$dv.getInt32(this.$position);
      lowBits = this.$dv.getInt32(this.$position + 4);
      this.$position += 8;
      return Long.fromBits(lowBits, highBits, prefix === Prefix.UINT64);
    };

    this.readFloat = function () {
      if (Prefix.FLOAT32 !== this.readByte()) {
        throw Error('readFloat expects to read Prefix.FLOAT32');
      }
      let value = this.$dv.getFloat32(this.$position);
      this.$position += 4;
      return value;
    };

    this.readDouble = function () {
      if (Prefix.FLOAT64 !== this.readByte()) {
        throw Error('readDouble expects to read Prefix.FLOAT64');
      }
      let value = this.$dv.getFloat64(this.$position);
      this.$position += 8;
      return value;
    };

    this.readPayload = function (length) {
      let value = this.$dv.getBytes(length, this.$position);
      this.$position += length;
      return value;
    };

    this.peek = function () {
      return this.$dv.getUint8(this.$position);
    };
  }

  get position () {
    return this.$position;
  }

  getBytes () {
    return this.$dv.getBytes();
  }

  unpackNil () {
    if (Prefix.NIL !== this.readByte()) {
      throw Error('unpackNil expects to read Prefix.NIL');
    }
  }

  unpackBoolean () {
    let prefix = this.readByte();
    if (!_.includes([Prefix.TRUE, Prefix.FALSE], prefix)) {
      throw Error('unpackBoolean expects to read Prefix.TRUE or Prefix.FALSE');
    }
    return prefix === Prefix.TRUE;
  }

  unpackInt () {
    let prefix = this.peek();

    if (Prefix.isFixInt(prefix)) {
      return Prefix.isPosFixInt(prefix) ? this.readByte() : this.readSignedByte();
    }
    switch (prefix) {
      case Prefix.INT8:
        this.readByte();
        return this.readSignedByte();
      case Prefix.UINT8:
        this.readByte();
        return this.readByte();
      case Prefix.INT16:
      case Prefix.UINT16:
        return this.readShort();
      case Prefix.INT32:
      case Prefix.UINT32:
        return this.readInt();
      case Prefix.INT64:
      case Prefix.UINT64:
        return this.readLong();
      default:
        throw new Error('Unexpected int prefix: ' + prefix);
    }
  }

  unpackFloat () {
    return this.readFloat();
  }

  unpackDouble () {
    return this.readDouble();
  }

  unpackString () {
    return utf8ByteArrayToString(this.readPayload(this.unpackRawStringHeader()));
  }

  unpackValue () {
    let prefix = this.peek();
    switch (ValueType.typeOf(prefix)) {
      case ValueType.NIL:
        return this.unpackNil();
      case ValueType.BOOLEAN:
        return this.unpackBoolean();
      case ValueType.INTEGER:
        return this.unpackInt();
      case ValueType.FLOAT:
        return prefix === Prefix.FLOAT32 ? this.unpackFloat() : this.unpackDouble();
      case ValueType.STRING:
        return this.unpackString();
      case ValueType.ARRAY:
        return this.unpackArray();
      case ValueType.BINARY:
        return this.unpackBinary();
      case ValueType.MAP:
        return this.unpackMap();
      default:
        throw new Error('unknown prefix ' + prefix);
    }
  }

  unpackArray () {
    let size = this.unpackArrayHeader(),
        array = [],
        i;

    for (i = 0; i < size; i++) {
      array.push(this.unpackValue());
    }

    return array;
  }

  unpackArrayHeader () {
    let prefix = this.readByte();

    if (Prefix.isFixedArray(prefix)) {
      return prefix & 0x0f;
    }

    switch (prefix) {
      case Prefix.ARRAY16:
        return this.readShort(Prefix.UINT16);
      case Prefix.ARRAY32:
        return this.readInt(Prefix.UINT32);
      default:
        throw new Error('Unexpected array header prefix: ' + prefix);
    }
  }

  unpackMap () {
    let size = this.unpackMapHeader(),
        map = new Map(),
        i;

    for (i = 0; i < size; i++) {
      map.set(this.unpackValue(), this.unpackValue());
    }

    return map;
  }

  unpackMapHeader () {
    let prefix = this.readByte();

    if (Prefix.isFixedMap(prefix)) {
      return prefix & 0x1f;
    }

    switch (prefix) {
      case Prefix.MAP16:
        return this.readShort(Prefix.UINT16);
      case Prefix.MAP32:
        return this.readInt(Prefix.UINT32);
      default:
        throw new Error('Unexpected map header prefix: ' + prefix);
    }
  }

  unpackBinary () {
    return this.readPayload(this.unpackBinaryHeader());
  }

  unpackBinaryHeader () {
    let prefix = this.readByte();

    switch (prefix) {
      case Prefix.BIN8:
        return this.readByte();
      case Prefix.BIN16:
        return this.readShort(Prefix.UINT16);
      case Prefix.BIN32:
        return this.readInt(Prefix.UINT32);
      default:
        throw new Error('Unexpected binary header prefix: ' + prefix);
    }
  }

  unpackRawStringHeader () {
    let prefix = this.readByte();

    if (Prefix.isFixedRaw(prefix)) {
      return prefix & 0x1f;
    }

    switch (prefix) {
      case Prefix.STR8:
        return this.readByte();
      case Prefix.STR16:
        return this.readShort(Prefix.UINT16);
      case Prefix.STR32:
        return this.readInt(Prefix.UINT32);
      default:
        throw new Error('Unexpected raw string header prefix: ' + prefix);
    }
  }

  unpackExtendedTypeHeader () {
    let prefix = this.readByte();
    switch (prefix) {
      case Prefix.FIXEXT1:
        return {length: 1, type: this.readByte()};
      case Prefix.FIXEXT2:
        return {length: 2, type: this.readByte()};
      case Prefix.FIXEXT4:
        return {length: 4, type: this.readByte()};
      case Prefix.FIXEXT8:
        return {length: 8, type: this.readByte()};
      case Prefix.FIXEXT16:
        return {length: 16, type: this.readByte()};
      case Prefix.EXT8:
        return {length: this.readByte(), type: this.readByte()};
      case Prefix.EXT16:
        return {length: this.readShort(Prefix.UINT16), type: this.readByte()};
      case Prefix.EXT32:
        return {length: this.readInt(Prefix.UINT32), type: this.readByte()};
      default:
        throw new Error('Unexpected extended type header prefix: ' + prefix);
    }
  }
}

export default MessageUnpacker;

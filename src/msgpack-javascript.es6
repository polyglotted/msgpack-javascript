import Prefix from './message-prefix';
import Scale from './message-scale';
import Packer from './message-packer';
import Unpacker from './message-unpacker';
import ValueType from './value-type';
import NumberType from './number-type';

function createPacker (length) {
  return new Packer(length);
}

function createUnpacker (bytesOrBuffer) {
  return new Unpacker(bytesOrBuffer);
}

export default {Prefix, Packer, Unpacker, Scale, ValueType, NumberType, createUnpacker, createPacker};

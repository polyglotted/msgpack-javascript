class Prefix {
  static isFixInt (b) {
    let v = b & 0xFF;
    return v <= 0x7f || v >= 0xe0;
  }

  static isPosFixInt (b) {
    return (b & Prefix.POSFIXINT_MASK) === 0;
  }

  static isNegFixInt (b) {
    return (b & Prefix.NEGFIXINT_PREFIX) === Prefix.NEGFIXINT_PREFIX;
  }

  static isFixStr (b) {
    return (b & 0xe0) === Prefix.FIXSTR_PREFIX;
  }

  static isFixedArray (b) {
    return (b & 0xf0) === Prefix.FIXARRAY_PREFIX;
  }

  static isFixedMap (b) {
    return (b & 0xe0) === Prefix.FIXMAP_PREFIX;
  }

  static isFixedRaw (b) {
    return (b & 0xe0) === Prefix.FIXSTR_PREFIX;
  }

  static get POSFIXINT_MASK () {
    return 0x80;
  }

  static get FIXMAP_PREFIX () {
    return 0x80;
  }

  static get FIXARRAY_PREFIX () {
    return 0x90;
  }

  static get FIXSTR_PREFIX () {
    return 0xa0;
  }

  static get NIL () {
    return 0xc0;
  }

  static get NEVER_USED () {
    return 0xc1;
  }

  static get FALSE () {
    return 0xc2;
  }

  static get TRUE () {
    return 0xc3;
  }

  static get BIN8 () {
    return 0xc4;
  }

  static get BIN16 () {
    return 0xc5;
  }

  static get BIN32 () {
    return 0xc6;
  }

  static get EXT8 () {
    return 0xc7;
  }

  static get EXT16 () {
    return 0xc8;
  }

  static get EXT32 () {
    return 0xc9;
  }

  static get FLOAT32 () {
    return 0xca;
  }

  static get FLOAT64 () {
    return 0xcb;
  }

  static get UINT8 () {
    return 0xcc;
  }

  static get UINT16 () {
    return 0xcd;
  }

  static get UINT32 () {
    return 0xce;
  }

  static get UINT64 () {
    return 0xcf;
  }

  static get INT8 () {
    return 0xd0;
  }

  static get INT16 () {
    return 0xd1;
  }

  static get INT32 () {
    return 0xd2;
  }

  static get INT64 () {
    return 0xd3;
  }

  static get FIXEXT1 () {
    return 0xd4;
  }

  static get FIXEXT2 () {
    return 0xd5;
  }

  static get FIXEXT4 () {
    return 0xd6;
  }

  static get FIXEXT8 () {
    return 0xd7;
  }

  static get FIXEXT16 () {
    return 0xd8;
  }

  static get STR8 () {
    return 0xd9;
  }

  static get STR16 () {
    return 0xda;
  }

  static get STR32 () {
    return 0xdb;
  }

  static get ARRAY16 () {
    return 0xdc;
  }

  static get ARRAY32 () {
    return 0xdd;
  }

  static get MAP16 () {
    return 0xde;
  }

  static get MAP32 () {
    return 0xdf;
  }

  static get NEGFIXINT_PREFIX () {
    return 0xe0;
  }
}

export default Prefix;

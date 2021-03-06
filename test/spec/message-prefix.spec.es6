import Prefix from '../../src/message-prefix';

describe('Prefix', () => {
  let methods,
      prefixes;

  methods = ['isFixInt', 'isPosFixInt', 'isNegFixInt', 'isFixStr', 'isFixedArray', 'isFixedMap', 'isFixedRaw'];

  methods.forEach((method) => {
    it('should define method ' + method, () => {
      expect(Prefix[method]).toBeDefined();

      spyOn(Prefix, method).and.callThrough();
      Prefix[method].call();
      expect(Prefix[method]).toHaveBeenCalled();
    });
  });

  prefixes = {
    'POSFIXINT_MASK': 0x80,
    'FIXMAP_PREFIX': 0x80,
    'FIXARRAY_PREFIX': 0x90,
    'FIXSTR_PREFIX': 0xa0,
    'NIL': 0xc0,
    'NEVER_USED': 0xc1,
    'FALSE': 0xc2,
    'TRUE': 0xc3,
    'BIN8': 0xc4,
    'BIN16': 0xc5,
    'BIN32': 0xc6,
    'EXT8': 0xc7,
    'EXT16': 0xc8,
    'EXT32': 0xc9,
    'FLOAT32': 0xca,
    'FLOAT64': 0xcb,
    'UINT8': 0xcc,
    'UINT16': 0xcd,
    'UINT32': 0xce,
    'UINT64': 0xcf,
    'INT8': 0xd0,
    'INT16': 0xd1,
    'INT32': 0xd2,
    'INT64': 0xd3,
    'FIXEXT1': 0xd4,
    'FIXEXT2': 0xd5,
    'FIXEXT4': 0xd6,
    'FIXEXT8': 0xd7,
    'FIXEXT16': 0xd8,
    'STR8': 0xd9,
    'STR16': 0xda,
    'STR32': 0xdb,
    'ARRAY16': 0xdc,
    'ARRAY32': 0xdd,
    'MAP16': 0xde,
    'MAP32': 0xdf,
    'NEGFIXINT_PREFIX': 0xe0
  };

  Object.keys(prefixes).forEach((prefix) => {
    it('should define prefix ' + prefix, () => {
      expect(Prefix[prefix]).toBeDefined();
      expect(Prefix[prefix]).toEqual(prefixes[prefix]);
    });
  });

  it('should determine fix int', () => {
    expect(Prefix.isFixInt(0x7f)).toBeTruthy();
    expect(Prefix.isFixInt(0xe0)).toBeTruthy();
  });

  it('should allow construction', () => {
    let prefix = new Prefix();
    expect(prefix).toBeDefined();
  });
});

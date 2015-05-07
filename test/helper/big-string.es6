let str8, str16, str32;

function string (length) {
  let s = 'b',
      i;
  for (i = 0; i < length - 1; i++) {
    s += 'a';
  }
  return s;
}

str32 = string(65536);

str16 = str32.slice(0, str32.length - 1);

str8 = str32.slice(0, 255);

export default {str8, str16, str32, string};

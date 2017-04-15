import * as assert from 'assert';

const files = 'abcdefgh';
const ranks = '12345678';

export const pos = {
  fromPgn: (str: string) => {
    assert(str.length === 2);
    return 8 * (7 - ranks.indexOf(str[1])) + files.indexOf(str[0]);
  },
  toPgn: (idx: number) => {
    assert(0 <= idx && idx < 64);

    const rank = ranks[7 - Math.floor(idx / 8)];
    const file = files[idx % 8];

    return file + rank;
  },
};

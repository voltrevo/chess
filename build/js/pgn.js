"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const files = 'abcdefgh';
const ranks = '12345678';
exports.pos = {
    fromPgn: (str) => {
        assert(str.length === 2);
        return 8 * (7 - ranks.indexOf(str[1])) + files.indexOf(str[0]);
    },
    toPgn: (idx) => {
        assert(0 <= idx && idx < 64);
        const rank = ranks[7 - Math.floor(idx / 8)];
        const file = files[idx % 8];
        return file + rank;
    },
};

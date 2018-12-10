"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entries = function* (obj) {
    const keys = Object.keys(obj);
    const len = keys.length;
    for (let i = 0; i !== len; i++) {
        const key = keys[i];
        yield [key, obj[key]];
    }
};
exports.mapIter = function* (iter, fn) {
    for (const x of iter) {
        yield fn(x);
    }
};
exports.values = (obj) => exports.mapIter(exports.entries(obj), ([, v]) => v);
exports.emptyIter = function* () { return; };

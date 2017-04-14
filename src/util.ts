export const entries = function*<T>(obj: { [key: string]: T }): IterableIterator<[string, T]> {
  const keys = Object.keys(obj);
  const len = keys.length;

  for (let i = 0; i !== len; i++) {
    const key = keys[i];
    yield [key, obj[key]];
  }
};

export const mapIter = function*<X, Y>(iter: IterableIterator<X>, fn: (x: X) => Y) {
  for (const x of iter) {
    yield fn(x);
  }
};

export const values = <T>(obj: { [key: string]: T }) => mapIter(entries(obj), ([, v]) => v);

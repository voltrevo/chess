export declare const entries: <T>(obj: {
    [key: string]: T;
}) => IterableIterator<[string, T]>;
export declare const mapIter: <X, Y>(iter: IterableIterator<X>, fn: (x: X) => Y) => IterableIterator<Y>;
export declare const values: <T>(obj: {
    [key: string]: T;
}) => IterableIterator<T>;
export declare const emptyIter: <T>() => IterableIterator<T>;
//# sourceMappingURL=util.d.ts.map
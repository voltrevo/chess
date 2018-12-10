export declare const determineEndState: (board: Uint8Array) => "checkmate" | "stalemate";
export declare const applyDepth: (rateBoard: (board: Uint8Array) => number, depth: number) => (board: Uint8Array) => number;
export declare const pickMoveByRating: (board: Uint8Array, rateBoard: (board: Uint8Array) => number) => [number, number] | null;
export declare const applyPromise: (rateBoard: (board: Uint8Array) => number) => (board: Uint8Array) => Promise<number>;
export declare const applyDepthPromise: (rateBoard: (board: Uint8Array) => Promise<number>, depth: number) => (board: Uint8Array) => Promise<number>;
export declare const pickMoveByRatingPromise: (board: Uint8Array, rateBoard: (board: Uint8Array) => Promise<number>, rand: number) => Promise<[number, number] | null>;
//# sourceMappingURL=pickMoveByRating.d.ts.map
declare type RaterT = (board: Uint8Array) => Promise<number>;
export declare const runChessGame: (rate: RaterT, rateChallenger: RaterT) => Promise<boolean>;
export {};
//# sourceMappingURL=runChessGame.d.ts.map
declare type ChallengerType<ParamSet, ParamVector> = {
    vector: ParamVector;
    params: ParamSet;
    wins: number;
    losses: number;
};
declare type UpdateType<ParamSet, ParamVector> = {
    championParams: ParamSet;
    challengerPool: ChallengerType<ParamSet, ParamVector>[];
    testCount: number;
    challengerCount: number;
    acceptCount: number;
    min: string;
};
export declare const headToHeadSearch: <ParamSet, ParamVector>(testPair: (a: ParamSet, b: ParamSet) => Promise<boolean>, championParams: ParamSet, generateMutationVector: () => ParamVector, applyMutationVector: (p: ParamSet, v: ParamVector) => ParamSet, acceptThreshold: number, rejectThreshold: number, poolSize: number, updateHandler: (updates: UpdateType<ParamSet, ParamVector>) => void) => Promise<void>;
export {};
//# sourceMappingURL=headToHeadSearch.d.ts.map
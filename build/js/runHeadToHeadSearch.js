"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const BoardRater_1 = require("./BoardRater");
const headToHeadSearch_1 = require("./headToHeadSearch");
const range_1 = require("./range");
const runChessGame_1 = require("./runChessGame");
const scoreAndConfidence_1 = require("./scoreAndConfidence");
const pickMoveByRating_1 = require("./pickMoveByRating");
// Deliberately naive params to test learning algorithm
const championParams = [
    1,
    1,
    1,
    1,
    1,
    0.0001,
    1,
];
const applyDeep = (rate) => {
    const rateShallowSync = pickMoveByRating_1.applyDepth(rate, 1);
    const rateShallowAsync = pickMoveByRating_1.applyPromise(rateShallowSync);
    const rateDeep = pickMoveByRating_1.applyDepthPromise(rateShallowAsync, 0);
    return rateDeep;
};
const testPair = (params, challengerParams) => {
    const rate = applyDeep(BoardRater_1.BoardRater(params));
    const rateChallenger = applyDeep(BoardRater_1.BoardRater(challengerParams));
    return runChessGame_1.runChessGame(rate, rateChallenger);
};
const stdNormalRand = () => {
    const u = 1 - Math.random(); // Subtraction to flip [0, 1) to (0, 1].
    const v = 1 - Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const generateMutationVector = () => {
    // // TODO: Possible typescript bug is the reason for the number[] annotation below
    // const vec: number[] = championParams.map(() => 1);
    // const randomIdx = Math.floor(Math.random() * vec.length);
    // vec[randomIdx] = Math.exp(0.25 * stdNormalRand());
    // return vec;
    return range_1.range(championParams.length).map(() => Math.exp(0.08 * stdNormalRand()));
};
const applyMutationVector = (params, vec) => {
    assert.equal(params.length, vec.length);
    return range_1.range(params.length).map(i => params[i] * vec[i]);
};
headToHeadSearch_1.headToHeadSearch(testPair, championParams, generateMutationVector, applyMutationVector, 0.95, 0.51, 5, ({ championParams, challengerPool, testCount, challengerCount, acceptCount, min, }) => console.log({
    championParams,
    challengerPool: challengerPool.map(ch => {
        let copy = JSON.parse(JSON.stringify(ch));
        copy.vector = copy.vector.map((n) => n.toFixed(3)).join(',');
        copy.conf = scoreAndConfidence_1.scoreAndConfidence(copy.wins, copy.losses).confidence;
        return copy;
    }).sort((ch1, ch2) => ch2.conf - ch1.conf),
    testCount,
    challengerCount,
    acceptCount,
    min,
})).catch(err => console.error(err));

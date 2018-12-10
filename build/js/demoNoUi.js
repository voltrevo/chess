"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const headToHead_1 = require("./headToHead");
const pickMoveByRating_1 = require("./pickMoveByRating");
const BoardRater_1 = require("./BoardRater");
const runChessGame_1 = require("./runChessGame");
const params = [
    3.5,
    3.5,
    5,
    9,
    1.1,
    0.005,
    1.5,
];
// Just use the same params right now
const rateBoard = BoardRater_1.BoardRater(params);
const rateBoardChallenger = BoardRater_1.BoardRater(params);
const applyDeep = (rate) => {
    const rateShallowSync = pickMoveByRating_1.applyDepth(rate, 1);
    const rateShallowAsync = pickMoveByRating_1.applyPromise(rateShallowSync);
    const rateDeep = pickMoveByRating_1.applyDepthPromise(rateShallowAsync, 0);
    return rateDeep;
};
const rateBoardDeep = applyDeep(rateBoard);
const rateBoardChallengerDeep = applyDeep(rateBoardChallenger);
const startTime = Date.now();
headToHead_1.headToHead(() => runChessGame_1.runChessGame(rateBoardDeep, rateBoardChallengerDeep), update => console.log(JSON.stringify({
    wins: update.wins,
    losses: update.losses,
    score: `${(100 * update.score).toFixed(1)}%`,
    confidence: `${(100 * update.confidence).toFixed(1)}%`,
    time: `${Math.floor((Date.now() - startTime) / 60000)}min`,
}))).catch(err => console.error(err));

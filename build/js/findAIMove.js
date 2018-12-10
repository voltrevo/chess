"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BoardRater_1 = require("./BoardRater");
const championParams_1 = require("./championParams");
const pickMoveByRating_1 = require("./pickMoveByRating");
function findAIMove(board, depth = 2, rand = 0) {
    const rateBoard = BoardRater_1.BoardRater(championParams_1.championParams);
    if (depth === 0) {
        return pickMoveByRating_1.pickMoveByRatingPromise(board, pickMoveByRating_1.applyPromise(rateBoard), rand);
    }
    const rateShallowSync = pickMoveByRating_1.applyDepth(rateBoard, 1);
    const rateShallowAsync = pickMoveByRating_1.applyPromise(rateShallowSync);
    const rateDeep = pickMoveByRating_1.applyDepthPromise(rateShallowAsync, depth - 1);
    return pickMoveByRating_1.pickMoveByRatingPromise(board, rateDeep, rand);
}
exports.default = findAIMove;

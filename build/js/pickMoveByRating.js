"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Chess_1 = require("./Chess");
const util_1 = require("./util");
exports.determineEndState = (board) => {
    const isPlayerWhite = (board[64] === Chess_1.default.codes.sides.white);
    const kingPosArray = Array.from(Chess_1.default.findPieces(board, Uint8Array.from(isPlayerWhite ?
        [Chess_1.default.codes.pieces.white.king] :
        [Chess_1.default.codes.pieces.black.king])));
    if (kingPosArray.length === 0 || Chess_1.default.isKingInCheck(board, kingPosArray[0], isPlayerWhite)) {
        return 'checkmate';
    }
    return 'stalemate';
};
const findAllMoves = function* (board) {
    const pieceCodes = util_1.values(board[64] === Chess_1.default.codes.sides.white ? Chess_1.default.codes.pieces.white : Chess_1.default.codes.pieces.black);
    for (const piecePos of Chess_1.default.findPieces(board, Uint8Array.from(pieceCodes))) {
        for (const dest of Chess_1.default.findMoves(board, piecePos)) {
            yield [piecePos, dest];
        }
    }
};
const findBestMoveAndRating = (board, rate) => {
    let bestMove = null;
    let bestRating = -Infinity;
    const isPlayerWhite = (board[64] === Chess_1.default.codes.sides.white);
    const ratingMultiplier = isPlayerWhite ? 1 : -1;
    for (const move of findAllMoves(board)) {
        const rating = ratingMultiplier * rate(Chess_1.default.applyMove(board, move));
        if (rating > bestRating) {
            bestMove = move;
            bestRating = rating;
        }
    }
    if (bestMove === null) {
        return (exports.determineEndState(board) === 'checkmate' ?
            [null, ratingMultiplier * -Infinity] :
            [null, 1]);
    }
    return [bestMove, ratingMultiplier * bestRating];
};
exports.applyDepth = (rateBoard, depth) => {
    if (depth === 0) {
        return rateBoard;
    }
    const rate = exports.applyDepth(rateBoard, depth - 1);
    return (board) => findBestMoveAndRating(board, rate)[1];
};
exports.pickMoveByRating = (board, rateBoard) => {
    return findBestMoveAndRating(board, rateBoard)[0];
};
exports.applyPromise = (rateBoard) => {
    return (board) => new Promise(resolve => setTimeout(() => resolve(rateBoard(board))));
};
const findBestMoveAndRatingPromise = (board, rate, rand = 0) => {
    let bestMove = null;
    let bestRating = -Infinity;
    const ratingMultiplier = (board[64] === Chess_1.default.codes.sides.white) ? 1 : -1;
    const moves = Array.from(findAllMoves(board));
    const moveAndRatingsPromise = Promise
        .all(moves.map(move => rate(Chess_1.default.applyMove(board, move))
        .then(rating => [move, ratingMultiplier * rating])));
    return moveAndRatingsPromise
        .then((moveAndRatings) => {
        if (moveAndRatings.length === 0) {
            return (exports.determineEndState(board) === 'checkmate' ?
                [null, ratingMultiplier * -Infinity] :
                [null, 1]);
        }
        const [moves, rating] = moveAndRatings.reduce((state, el) => {
            if (state[1] > el[1]) {
                return state;
            }
            if (state[1] === el[1]) {
                state[0].push(el[0]);
                return state;
            }
            return [[el[0]], el[1]];
        }, [[], -Infinity]);
        // TODO: Inject rng
        const move = moves[Math.floor(rand * moves.length)];
        return [move, ratingMultiplier * rating];
    });
};
exports.applyDepthPromise = (rateBoard, depth) => {
    if (depth === 0) {
        return rateBoard;
    }
    const rate = exports.applyDepthPromise(rateBoard, depth - 1);
    return (board) => findBestMoveAndRatingPromise(board, rate)
        .then(moveAndRating => moveAndRating[1]);
};
exports.pickMoveByRatingPromise = (board, rateBoard, rand) => {
    return findBestMoveAndRatingPromise(board, rateBoard, rand).then(moveAndRating => moveAndRating[0]);
};

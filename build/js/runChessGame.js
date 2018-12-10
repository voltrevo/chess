"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Chess_1 = require("./Chess");
const pickMoveByRating_1 = require("./pickMoveByRating");
exports.runChessGame = (rate, rateChallenger) => {
    let board = Chess_1.default.Board();
    let moves = 0;
    // TODO: Better side alternation (should be A-B-B-A-A-B-B-...)
    const challengerSide = (Math.random() < 0.5 ? Chess_1.default.codes.sides.white : Chess_1.default.codes.sides.black);
    const getRater = () => {
        return (board[64] === challengerSide ? rateChallenger : rate);
    };
    const computerMove = () => {
        const rater = getRater();
        return pickMoveByRating_1.pickMoveByRatingPromise(board, getRater(), Math.random()).then((move) => {
            if (move !== null) {
                board = Chess_1.default.applyMove(board, move);
                return { gameOver: false };
            }
            return { gameOver: true };
        });
    };
    const loop = () => computerMove().then(({ gameOver }) => {
        moves++;
        if (moves > 500) {
            console.log('Restarting due to >500 moves');
            return exports.runChessGame(rate, rateChallenger);
        }
        if (!gameOver) {
            return loop();
        }
        if (pickMoveByRating_1.determineEndState(board) === 'stalemate') {
            return exports.runChessGame(rate, rateChallenger);
        }
        // If it's checkmate and non-challenger turn, then challenger won
        return board[64] !== challengerSide;
    });
    return loop();
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Chess_1 = require("./Chess");
exports.BoardRater = ([bishopVal, knightVal, rookVal, queenVal, centerBoost, pieceAdvancementBoost, pawnNearPromotionBoost,]) => {
    const material = {
        [Chess_1.default.codes.pieces.white.king]: Infinity,
        [Chess_1.default.codes.pieces.white.queen]: queenVal,
        [Chess_1.default.codes.pieces.white.rook]: rookVal,
        [Chess_1.default.codes.pieces.white.knight]: knightVal,
        [Chess_1.default.codes.pieces.white.bishop]: bishopVal,
        [Chess_1.default.codes.pieces.white.pawn]: 1,
        [Chess_1.default.codes.pieces.black.king]: -Infinity,
        [Chess_1.default.codes.pieces.black.queen]: -queenVal,
        [Chess_1.default.codes.pieces.black.rook]: -rookVal,
        [Chess_1.default.codes.pieces.black.knight]: -knightVal,
        [Chess_1.default.codes.pieces.black.bishop]: -bishopVal,
        [Chess_1.default.codes.pieces.black.pawn]: -1,
    };
    return (board) => {
        let valueMap = {
            white: {
                king: false,
                material: 0,
            },
            black: {
                king: false,
                material: 0,
            }
        };
        for (let i = 0; i !== 64; i++) {
            const value = material[board[i]] || 0;
            if (value === 0) {
                continue;
            }
            const side = (value > 0 ? valueMap.white : valueMap.black);
            let absValue = Math.abs(value);
            if (absValue !== Infinity) {
                if ([27, 28, 35, 36].indexOf(i) !== -1) {
                    // Boost four middle squares
                    absValue *= centerBoost;
                }
                const row = Math.floor(i / 8);
                const isPieceWhite = Chess_1.default.isWhite(board[i]);
                const relRow = (isPieceWhite ? 7 - row : row);
                if (Chess_1.default.toWhite(board[i]) === Chess_1.default.codes.pieces.white.pawn) {
                    const steps = relRow - 1;
                    if (steps >= 4) {
                        absValue += pawnNearPromotionBoost * (steps - 3);
                    }
                }
                absValue += pieceAdvancementBoost * relRow;
                side.material += absValue;
            }
            else {
                side.king = true;
            }
        }
        if (valueMap.white.king !== valueMap.black.king) {
            return (valueMap.white.king ? Infinity : -Infinity);
        }
        return (valueMap.white.material + 1) / (valueMap.black.material + 1);
    };
};

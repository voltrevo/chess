import Chess from './Chess';

export type BoardRaterParams = [number, number, number, number, number, number, number];

export const BoardRater = ([
  bishopVal,
  knightVal,
  rookVal,
  queenVal,
  centerBoost,
  pieceAdvancementBoost,
  pawnNearPromotionBoost,
]: BoardRaterParams) => {
  const material = {
    [Chess.codes.pieces.white.king]: Infinity,
    [Chess.codes.pieces.white.queen]: queenVal,
    [Chess.codes.pieces.white.rook]: rookVal,
    [Chess.codes.pieces.white.knight]: knightVal,
    [Chess.codes.pieces.white.bishop]: bishopVal,
    [Chess.codes.pieces.white.pawn]: 1,
    [Chess.codes.pieces.black.king]: -Infinity,
    [Chess.codes.pieces.black.queen]: -queenVal,
    [Chess.codes.pieces.black.rook]: -rookVal,
    [Chess.codes.pieces.black.knight]: -knightVal,
    [Chess.codes.pieces.black.bishop]: -bishopVal,
    [Chess.codes.pieces.black.pawn]: -1,
  };

  return (board: Uint8Array) => {
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
        const isPieceWhite = Chess.isWhite(board[i]);
        const relRow = (isPieceWhite ? 7 - row : row);

        if (Chess.toWhite(board[i]) === Chess.codes.pieces.white.pawn) {
          const steps = relRow - 1;

          if (steps >= 4) {
            absValue += pawnNearPromotionBoost * (steps - 3);
          }
        }

        absValue += pieceAdvancementBoost * relRow;

        side.material += absValue;
      } else {
        side.king = true;
      }
    }

    if (valueMap.white.king !== valueMap.black.king) {
      return (valueMap.white.king ? Infinity : -Infinity);
    }

    return (valueMap.white.material + 1) / (valueMap.black.material + 1);
  };
};

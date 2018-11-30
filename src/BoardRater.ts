import Board from './Board';

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
    [Board.codes.pieces.white.king]: Infinity,
    [Board.codes.pieces.white.queen]: queenVal,
    [Board.codes.pieces.white.rook]: rookVal,
    [Board.codes.pieces.white.knight]: knightVal,
    [Board.codes.pieces.white.bishop]: bishopVal,
    [Board.codes.pieces.white.pawn]: 1,
    [Board.codes.pieces.black.king]: -Infinity,
    [Board.codes.pieces.black.queen]: -queenVal,
    [Board.codes.pieces.black.rook]: -rookVal,
    [Board.codes.pieces.black.knight]: -knightVal,
    [Board.codes.pieces.black.bishop]: -bishopVal,
    [Board.codes.pieces.black.pawn]: -1,
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
        const isPieceWhite = Board.isWhite(board[i]);
        const relRow = (isPieceWhite ? 7 - row : row);

        if (Board.toWhite(board[i]) === Board.codes.pieces.white.pawn) {
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

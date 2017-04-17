import { codes, toWhite } from './board';

const material = {
  [codes.pieces.white.king]: Infinity,
  [codes.pieces.white.queen]: 9,
  [codes.pieces.white.rook]: 5,
  [codes.pieces.white.knight]: 3.5,
  [codes.pieces.white.bishop]: 3.5,
  [codes.pieces.white.pawn]: 1,
  [codes.pieces.black.king]: -Infinity,
  [codes.pieces.black.queen]: -9,
  [codes.pieces.black.rook]: -5,
  [codes.pieces.black.knight]: -3.5,
  [codes.pieces.black.bishop]: -3.5,
  [codes.pieces.black.pawn]: -1,
};

export const rateBoard = (board: Uint8Array) => {
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
        absValue *= 1.1;
      }

      if (toWhite(board[i]) === codes.pieces.white.pawn) {
        const row = Math.floor(i / 8);
        const steps = (-1 + (
          board[i] === codes.pieces.white.pawn ?
          7 - row :
          row
        ));

        if (steps >= 4) {
          absValue += 1.5 * (steps - 3);
        }
      }

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

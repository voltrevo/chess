import { applyMove, codes, findMoves, findPieces } from './board';
import { rateBoard } from './rateBoard';
import { values } from './util';

const findAllMoves: (board: Uint8Array) => IterableIterator<[number, number]> = function*(board: Uint8Array) {
  const pieceCodes = values(board[64] === codes.sides.white ? codes.pieces.white : codes.pieces.black);

  for (const piecePos of findPieces(board, Uint8Array.from(pieceCodes))) {
    for (const dest of findMoves(board, piecePos)) {
      yield [piecePos, dest];
    }
  }
};

export const pickMoveByRating = (board: Uint8Array) => {
  let bestMove: [number, number] | null = null;
  let bestRating = -Infinity;

  const ratingMultiplier = (board[64] === codes.sides.white) ? 1 : -1;

  for (const move of findAllMoves(board)) {
    const rating = ratingMultiplier * rateBoard(applyMove(board, move));

    if (rating > bestRating) {
      bestMove = move;
      bestRating = rating;
    }
  }

  return bestMove;
};

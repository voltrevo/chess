import { applyMove, codes, findMoves, findPieces } from './board';
import { values } from './util';

const findAllMoves: (board: Uint8Array) => IterableIterator<[number, number]> = function*(board: Uint8Array) {
  const pieceCodes = values(board[64] === codes.sides.white ? codes.pieces.white : codes.pieces.black);

  for (const piecePos of findPieces(board, Uint8Array.from(pieceCodes))) {
    for (const dest of findMoves(board, piecePos)) {
      yield [piecePos, dest];
    }
  }
};

const findBestMoveAndRating = (board: Uint8Array, rate: (board: Uint8Array) => number) => {
  let bestMove: [number, number] | null = null;
  let bestRating = -Infinity;

  const ratingMultiplier = (board[64] === codes.sides.white) ? 1 : -1;

  for (const move of findAllMoves(board)) {
    const rating = ratingMultiplier * rate(applyMove(board, move));

    if (rating > bestRating) {
      bestMove = move;
      bestRating = rating;
    }
  }

  // TODO: If no moves found, check for stalemate

  return [bestMove, ratingMultiplier * bestRating] as [[number, number] | null, number];
};

export const applyDepth:
  (rateBoard: (board: Uint8Array) => number, depth: number) =>
  (board: Uint8Array) => number
= (rateBoard: (board: Uint8Array) => number, depth: number) => {
  if (depth === 0) {
    return rateBoard;
  }

  const rate = applyDepth(rateBoard, depth - 1);

  return (board: Uint8Array) => findBestMoveAndRating(board, rate)[1];
};

export const pickMoveByRating = (board: Uint8Array, rateBoard: (board: Uint8Array) => number) => {
  return findBestMoveAndRating(board, rateBoard)[0];
};

export const applyPromise:
  (rateBoard: (board: Uint8Array) => number) =>
  (board: Uint8Array) => Promise<number>
= (rateBoard: (board: Uint8Array) => number) => {
  return (board: Uint8Array) => new Promise(resolve =>
    setTimeout(() => resolve(rateBoard(board)))
  );
};

const findBestMoveAndRatingPromise = (board: Uint8Array, rate: (board: Uint8Array) => Promise<number>) => {
  let bestMove: [number, number] | null = null;
  let bestRating = -Infinity;

  const ratingMultiplier = (board[64] === codes.sides.white) ? 1 : -1;

  const moves = Array.from(findAllMoves(board));

  type MoveAndRating = [[number, number] | null, number];

  const moveAndRatingsPromise = Promise
    .all(
      moves.map(move => rate(applyMove(board, move))
        .then(rating => [move, ratingMultiplier * rating] as MoveAndRating)
      )
    )
  ;

  return moveAndRatingsPromise
    .then((moveAndRatings: MoveAndRating[]) => {
      // TODO: If no moves found, check for stalemate
      return moveAndRatings.reduce((a: MoveAndRating, b: MoveAndRating) => a[1] > b[1] ? a : b)
    })
  ;
};

export const applyDepthPromise:
  (rateBoard: (board: Uint8Array) => Promise<number>, depth: number) =>
  (board: Uint8Array) => Promise<number>
= (rateBoard: (board: Uint8Array) => Promise<number>, depth: number) => {
  if (depth === 0) {
    return rateBoard;
  }

  const rate = applyDepthPromise(rateBoard, depth - 1);

  return (board: Uint8Array) => findBestMoveAndRatingPromise(board, rate)
    .then(moveAndRating => moveAndRating[1]);
};

export const pickMoveByRatingPromise = (board: Uint8Array, rateBoard: (board: Uint8Array) => Promise<number>) => {
  return findBestMoveAndRatingPromise(board, rateBoard).then(moveAndRating => moveAndRating[0]);
};

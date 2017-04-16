import { applyMove, codes, findMoves, findPieces, isKingInCheck } from './board';
import { values } from './util';

const determineEndState = (board: Uint8Array) => {
  const isPlayerWhite = (board[64] === codes.sides.white);

  const kingPosArray = Array.from(findPieces(
    board,
    Uint8Array.from(
      isPlayerWhite ?
      [codes.pieces.white.king] :
      [codes.pieces.black.king]
    )
  ));

  if (kingPosArray.length === 0 || isKingInCheck(board, kingPosArray[0], isPlayerWhite)) {
    return 'checkmate';
  }

  return 'stalemate';
};

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

  const isPlayerWhite = (board[64] === codes.sides.white);

  const ratingMultiplier = isPlayerWhite ? 1 : -1;

  for (const move of findAllMoves(board)) {
    const rating = ratingMultiplier * rate(applyMove(board, move));

    if (rating > bestRating) {
      bestMove = move;
      bestRating = rating;
    }
  }

  if (bestMove === null) {
    return (
      determineEndState(board) === 'checkmate' ?
      [null, ratingMultiplier * -Infinity] :
      [null, 1]
    ) as [null, number];
  }

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
      if (moveAndRatings.length === 0) {
        return (
          determineEndState(board) === 'checkmate' ?
          [null, ratingMultiplier * -Infinity] :
          [null, 1]
        ) as [null, number];
      }

      const [move, rating] = moveAndRatings.reduce((a: MoveAndRating, b: MoveAndRating) => a[1] >= b[1] ? a : b);
      return [move, ratingMultiplier * rating];
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

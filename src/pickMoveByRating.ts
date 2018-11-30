import Chess from './Chess';
import { values } from './util';

export const determineEndState = (board: Uint8Array) => {
  const isPlayerWhite = (board[64] === Chess.codes.sides.white);

  const kingPosArray = Array.from(Chess.findPieces(
    board,
    Uint8Array.from(
      isPlayerWhite ?
      [Chess.codes.pieces.white.king] :
      [Chess.codes.pieces.black.king]
    )
  ));

  if (kingPosArray.length === 0 || Chess.isKingInCheck(board, kingPosArray[0], isPlayerWhite)) {
    return 'checkmate';
  }

  return 'stalemate';
};

const findAllMoves: (board: Uint8Array) => IterableIterator<[number, number]> = function*(board: Uint8Array) {
  const pieceCodes = values(board[64] === Chess.codes.sides.white ? Chess.codes.pieces.white : Chess.codes.pieces.black);

  for (const piecePos of Chess.findPieces(board, Uint8Array.from(pieceCodes))) {
    for (const dest of Chess.findMoves(board, piecePos)) {
      yield [piecePos, dest];
    }
  }
};

const findBestMoveAndRating = (board: Uint8Array, rate: (board: Uint8Array) => number) => {
  let bestMove: [number, number] | null = null;
  let bestRating = -Infinity;

  const isPlayerWhite = (board[64] === Chess.codes.sides.white);

  const ratingMultiplier = isPlayerWhite ? 1 : -1;

  for (const move of findAllMoves(board)) {
    const rating = ratingMultiplier * rate(Chess.applyMove(board, move));

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

const findBestMoveAndRatingPromise = (board: Uint8Array, rate: (board: Uint8Array) => Promise<number>, rand: number = 0) => {
  let bestMove: [number, number] | null = null;
  let bestRating = -Infinity;

  const ratingMultiplier = (board[64] === Chess.codes.sides.white) ? 1 : -1;

  const moves = Array.from(findAllMoves(board));

  type MoveAndRating = [[number, number] | null, number];

  const moveAndRatingsPromise = Promise
    .all(
      moves.map(move => rate(Chess.applyMove(board, move))
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

      type ReduceState = [([number, number] | null)[], number];

      const [moves, rating] = moveAndRatings.reduce((state: ReduceState, el: MoveAndRating) => {
        if (state[1] > el[1]) {
          return state;
        }

        if (state[1] === el[1]) {
          state[0].push(el[0]);
          return state;
        }

        return [[el[0]], el[1]];
      }, [[], -Infinity] as ReduceState) as ReduceState;

      // TODO: Inject rng
      const move = moves[Math.floor(rand * moves.length)];

      return [move, ratingMultiplier * rating] as MoveAndRating;
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

export const pickMoveByRatingPromise = (board: Uint8Array, rateBoard: (board: Uint8Array) => Promise<number>, rand: number) => {
  return findBestMoveAndRatingPromise(board, rateBoard, rand).then(moveAndRating => moveAndRating[0]);
};

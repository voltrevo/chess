import Chess from './Chess';

import { BoardRater, BoardRaterParams } from './BoardRater';
import { championParams } from './championParams';

import {
  applyDepth,
  applyDepthPromise,
  applyPromise,
  determineEndState,
  pickMoveByRatingPromise
} from './pickMoveByRating';

import { entries, values } from './util';

const rateBoard = BoardRater(championParams);

export default function findAIMove(
  board: Chess.Board,
  depth: number = 2,
  rand: number = 0,
): Promise<[number, number] | null> {
  if (depth === 0) {
    return pickMoveByRatingPromise(board, applyPromise(rateBoard), rand);
  }

  const rateShallowSync = applyDepth(rateBoard, 1);
  const rateShallowAsync = applyPromise(rateShallowSync);
  const rateDeep = applyDepthPromise(rateShallowAsync, depth - 1);

  return pickMoveByRatingPromise(board, rateDeep, rand);
}

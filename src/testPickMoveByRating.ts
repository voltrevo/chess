import * as test from 'tape';

import { fromString } from './board';

import {
  applyDepth,
  applyDepthPromise,
  applyPromise,
  pickMoveByRating,
  pickMoveByRatingPromise
} from './pickMoveByRating';

import { rateBoard } from './rateBoard';

test('async and sync move pickers agree', (t) => {
  t.plan(1);

  const rateBoardDeepSync = applyDepth(rateBoard, 2);

  const rateBoardShallowSync = applyDepth(rateBoard, 1);
  const rateBoardShallowAsync = applyPromise(rateBoardShallowSync);
  const rateBoardDeepAsync = applyDepthPromise(rateBoardShallowAsync, 1);

  const board = fromString(`
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . . p . . .
    . . . . . . . .
    p p p p . p p p
    r n b q k b n r

    Black to move
  `);

  const syncMove = pickMoveByRating(board, rateBoardDeepSync);

  pickMoveByRatingPromise(board, rateBoardDeepAsync)
    .then(asyncMove => {
      t.deepEqual(syncMove, asyncMove);
    })
  ;
});

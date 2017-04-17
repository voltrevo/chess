import {
  findMoves,
  findPieces,
  toString,
  applyMove,
  newGame,
  isWhite,
  codes,
} from './board';

import { headToHead } from './headToHead';
import { pos } from './pgn';

import {
  applyDepth,
  applyDepthPromise,
  applyPromise,
  determineEndState,
  pickMoveByRatingPromise
} from './pickMoveByRating';

import { rateBoard } from './rateBoard';
import { rateBoardChallenger } from './rateBoardChallenger';
import { runChessGame } from './runChessGame';
import { entries, values } from './util';

const applyDeep = (rate: (board: Uint8Array) => number) => {
  const rateShallowSync = applyDepth(rate, 1);
  const rateShallowAsync = applyPromise(rateShallowSync);
  const rateDeep = applyDepthPromise(rateShallowAsync, 0);

  return rateDeep;
}

const rateBoardDeep = applyDeep(rateBoard);
const rateBoardChallengerDeep = applyDeep(rateBoardChallenger);

const startTime = Date.now();

headToHead(
  () => runChessGame(rateBoardDeep, rateBoardChallengerDeep),
  update => console.log(JSON.stringify({
    wins: update.wins,
    losses: update.losses,
    score: `${(100 * update.score).toFixed(1)}%`,
    confidence: `${(100 * update.confidence).toFixed(1)}%`,
    time: `${Math.floor((Date.now() - startTime) / 60000)}min`,
  })),
).catch(err => console.error(err));

import { headToHead } from './headToHead';

import {
  applyDepth,
  applyDepthPromise,
  applyPromise
} from './pickMoveByRating';

import { BoardRater, BoardRaterParams } from './BoardRater';
import { runChessGame } from './runChessGame';

const params: BoardRaterParams = [
  3.5,   // bishopVal
  3.5,   // knightVal
  5,     // rookVal
  9,     // queenVal
  1.1,   // centerBoost
  0.005, // pieceAdvancementBoost
  1.5,   // pawnNearPromotionBoost
];

// Just use the same params right now
const rateBoard = BoardRater(params);
const rateBoardChallenger = BoardRater(params);

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

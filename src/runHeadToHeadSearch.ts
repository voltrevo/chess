import * as assert from 'assert';

import { BoardRater, BoardRaterParams } from './BoardRater';
import { headToHeadSearch } from './headToHeadSearch';
import { range } from './range';
import { runChessGame } from './runChessGame';
import { scoreAndConfidence } from './scoreAndConfidence';
import { applyDepth, applyPromise, applyDepthPromise } from './pickMoveByRating';

// Deliberately naive params to test learning algorithm
const championParams: BoardRaterParams = [
  1,      // bishopVal
  1,      // knightVal
  1,      // rookVal
  1,      // queenVal
  1,      // centerBoost
  0.0001, // pieceAdvancementBoost
  1,      // pawnNearPromotionBoost
];

const applyDeep = (rate: (board: Uint8Array) => number) => {
  const rateShallowSync = applyDepth(rate, 1);
  const rateShallowAsync = applyPromise(rateShallowSync);
  const rateDeep = applyDepthPromise(rateShallowAsync, 0);

  return rateDeep;
};

const testPair = (params: BoardRaterParams, challengerParams: BoardRaterParams) => {
  const rate = applyDeep(BoardRater(params));
  const rateChallenger = applyDeep(BoardRater(challengerParams));

  return runChessGame(rate, rateChallenger);
};

const stdNormalRand = () => {
  const u = 1 - Math.random(); // Subtraction to flip [0, 1) to (0, 1].
  const v = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const generateMutationVector = () => {
  // // TODO: Possible typescript bug is the reason for the number[] annotation below
  // const vec: number[] = championParams.map(() => 1);

  // const randomIdx = Math.floor(Math.random() * vec.length);
  // vec[randomIdx] = Math.exp(0.25 * stdNormalRand());

  // return vec;
  return range(championParams.length).map(() => Math.exp(0.08 * stdNormalRand()));
};

const applyMutationVector = (params: BoardRaterParams, vec: number[]) => {
  assert.equal(params.length, vec.length);
  return range(params.length).map(i => params[i] * vec[i]);
};

headToHeadSearch(
  testPair,
  championParams,
  generateMutationVector,
  applyMutationVector,
  0.95,
  0.51,
  5,
  ({
    championParams,
    challengerPool,
    testCount,
    challengerCount,
    acceptCount,
    min,
  }) => console.log({
    championParams,
    challengerPool: challengerPool.map(ch => {
      let copy = JSON.parse(JSON.stringify(ch));
      copy.vector = copy.vector.map((n: number) => n.toFixed(3)).join(',');
      copy.conf = scoreAndConfidence(copy.wins, copy.losses).confidence;
      return copy;
    }).sort((ch1, ch2) => ch2.conf - ch1.conf),
    testCount,
    challengerCount,
    acceptCount,
    min,
  })
).catch(err => console.error(err));

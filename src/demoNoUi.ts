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
import { entries, values } from './util';

const applyDeep = (rate: (board: Uint8Array) => number) => {
  const rateShallowSync = applyDepth(rate, 1);
  const rateShallowAsync = applyPromise(rateShallowSync);
  const rateDeep = applyDepthPromise(rateShallowAsync, 0);

  return rateDeep;
}

const rateBoardDeep = applyDeep(rateBoard);
const rateBoardChallengerDeep = applyDeep(rateBoardChallenger);

(() => {
  const trial: () => Promise<boolean> = () => {
    let board = newGame;
    let moves = 0;

    // TODO: Better side alternation (should be A-B-B-A-A-B-B-...)
    const challengerSide = (Math.random() < 0.5 ? codes.sides.white : codes.sides.black);
    const getRater = () => {
      return (board[64] === challengerSide ? rateBoardChallengerDeep : rateBoardDeep);
    };

    const computerMove = () => {
      const rater = getRater();

      return pickMoveByRatingPromise(board, getRater(), Math.random()).then((move) => {
        if (move !== null) {
          board = applyMove(board, move);
          return { gameOver: false };
        }

        return { gameOver: true };
      });
    };

    const loop: () => Promise<boolean> = () => computerMove().then(({ gameOver }) => {
      moves++;

      if (moves > 500) {
        console.log('Restarting due to >500 moves');
        return trial();
      }

      if (!gameOver) {
        return loop();
      }

      if (determineEndState(board) === 'stalemate') {
        return trial();
      }

      // If it's checkmate and non-challenger turn, then challenger won
      return board[64] !== challengerSide;
    });

    return loop();
  };

  const startTime = Date.now();

  headToHead(
    trial,
    update => console.log(JSON.stringify({
      wins: update.wins,
      losses: update.losses,
      score: `${(100 * update.score).toFixed(1)}%`,
      confidence: `${(100 * update.confidence).toFixed(1)}%`,
      time: `${Math.floor((Date.now() - startTime) / 60000)}min`,
    })),
  ).catch(err => console.error(err));
})();

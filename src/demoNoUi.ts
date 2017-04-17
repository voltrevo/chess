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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const toChessboardJsBoardPos = (board: Uint8Array) => {
  const flatStr = toString(board).replace(/[\n ]/g, '');

  const pieceMap: { [key: string]: string | undefined } = {
    k: 'wK',
    q: 'wQ',
    b: 'wB',
    n: 'wN',
    r: 'wR',
    p: 'wP',
    K: 'bK',
    Q: 'bQ',
    B: 'bB',
    N: 'bN',
    R: 'bR',
    P: 'bP',
  };

  const cjsPos: { [square: string]: string } = {};

  for (let i = 0; i !== 64; i++) {
    const mappedPiece = pieceMap[flatStr[i]];

    if (mappedPiece !== undefined) {
      cjsPos[pos.toPgn(i)] = mappedPiece;
    }
  }

  return cjsPos;
};

const pickRandomMove = (board: Uint8Array) => {
  const pieceCodes = (board[64] === codes.sides.white ? codes.pieces.white : codes.pieces.black);
  const piecePositions = findPieces(board, Uint8Array.from(values(pieceCodes)));

  const moves: [number, number][] = [];

  for (const from of piecePositions) {
    for (const to of findMoves(board, from)) {
      moves.push([from, to]);
    }
  }

  if (moves.length === 0) {
    return null;
  }

  const randomMove = moves[Math.floor(Math.random() * moves.length)];

  return randomMove;
};

(() => {
  let board = newGame;
  let cjsPos = toChessboardJsBoardPos(board);

  const trial: () => Promise<boolean> = () => {
    board = newGame;
    let moves = 0;

    // TODO: Never going to find games without differences unless the same random numbers
    // are used
    let differenceFound = false;

    // TODO: Better side alternation (should be A-B-B-A-A-B-B-...)
    const challengerSide = (Math.random() < 0.5 ? codes.sides.white : codes.sides.black);
    const getRater = () => {
      return (board[64] === challengerSide ? rateBoardChallengerDeep : rateBoardDeep);
    };

    const computerMove = () => {
      const rater = getRater();

      const handleMove = (move: [number, number] | null) => {
        if (move !== null) {
          board = applyMove(board, move);
          return { gameOver: false };
        }

        return { gameOver: true };
      };

      if (!differenceFound && rater !== rateBoardDeep) {
        return Promise.all([
          pickMoveByRatingPromise(board, rater),
          pickMoveByRatingPromise(board, rateBoardDeep)
        ]).then(([move, testMove]) => {
          if (move === null) {
            return null;
          }

          if (testMove === null) {
            throw new Error('one ai says there are moves, the other does not');
          }

          if (move[0] !== testMove[0] || move[1] !== testMove[1]) {
            if (!differenceFound) {
              differenceFound = true;
            }
          }

          return move;
        }).then(handleMove);
      }

      return pickMoveByRatingPromise(board, getRater()).then(handleMove);
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

      if (!differenceFound) {
        console.log('No difference found, not counting this game');
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

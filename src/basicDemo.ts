(window as any).$ = require('jquery');
const chessboardJs = require('chessboardjs');

import Chess from './Chess';

import { BoardRater, BoardRaterParams } from './BoardRater';
import { championParams } from './championParams';
import { headToHead } from './headToHead';
import { pos } from './pgn';

import {
  applyDepth,
  applyDepthPromise,
  applyPromise,
  determineEndState,
  pickMoveByRatingPromise
} from './pickMoveByRating';

import { entries, values } from './util';

// Just use the same params right now
const rateBoard = BoardRater(championParams);
const rateBoardChallenger = BoardRater(championParams);

const applyDeep = (rate: (board: Uint8Array) => number) => {
  const rateShallowSync = applyDepth(rate, 1);
  const rateShallowAsync = applyPromise(rateShallowSync);
  const rateDeep = applyDepthPromise(rateShallowAsync, 1);

  return rateDeep;
}

const rateBoardDeep = applyDeep(rateBoard);
const rateBoardChallengerDeep = applyDeep(rateBoardChallenger);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const applyStyles = (el: HTMLElement, styles: { [key: string]: string }) => {
  for (const [key, val] of entries(styles)) {
    (el.style as any)[key] = val;
  }
};

const createElement = (tag: string, styles: { [key: string]: string } = {}) => {
  const el = document.createElement(tag);
  applyStyles(el, styles);

  return el;
};

const toChessboardJsBoardPos = (board: Uint8Array) => {
  const flatStr = Chess.Board.toString(board).replace(/[\n ]/g, '');

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
  const pieceCodes = (board[64] === Chess.codes.sides.white ? Chess.codes.pieces.white : Chess.codes.pieces.black);
  const piecePositions = Chess.findPieces(board, Uint8Array.from(values(pieceCodes)));

  const moves: [number, number][] = [];

  for (const from of piecePositions) {
    for (const to of Chess.findMoves(board, from)) {
      moves.push([from, to]);
    }
  }

  if (moves.length === 0) {
    return null;
  }

  const randomMove = moves[Math.floor(Math.random() * moves.length)];

  return randomMove;
};

window.addEventListener('load', () => {
  const boardContainer = createElement('div');
  const statsDisplay = createElement('pre', {
    position: 'fixed',
    right: '10px',
    bottom: '10px',
    border: '1px solid black',
    backgroundColor: '#aff',
  });

  document.body.appendChild(boardContainer);
  document.body.appendChild(statsDisplay);

  let board = Chess.Board();
  let cjsPos = toChessboardJsBoardPos(board);

  const isPlayBlack = location.search.indexOf('play-black') !== -1;
  if (isPlayBlack) {
    pickMoveByRatingPromise(board, rateBoardDeep, Math.random()).then(whiteMove => {
      if (whiteMove !== null) {
        board = Chess.applyMove(board, whiteMove);
        cjsBoard.position(toChessboardJsBoardPos(board), true);
      }
    });
  }

  const cjsBoard = chessboardJs(boardContainer, {
    position: cjsPos,
    orientation: isPlayBlack ? 'black' : 'white',
    draggable: true,
    onDrop: (from: string, to: string) => {
      const fromIdx = pos.fromPgn(from);
      const toIdx = pos.fromPgn(to);

      const isWhiteTurn = (board[64] === Chess.codes.sides.white);
      const isWhitePiece = Chess.isWhite(board[fromIdx]);

      if (isWhiteTurn !== isWhitePiece) {
        return 'snapback';
      }

      for (const legalToIdx of Chess.findMoves(board, fromIdx)) {
        if (toIdx === legalToIdx) {
          board = Chess.applyMove(board, [fromIdx, toIdx]);
          setTimeout(() => {
            cjsBoard.position(toChessboardJsBoardPos(board), false);

            pickMoveByRatingPromise(board, rateBoardDeep, Math.random()).then(blackMove => {
              if (blackMove !== null) {
                board = Chess.applyMove(board, blackMove);
                cjsBoard.position(toChessboardJsBoardPos(board), true);
              }
            });
          });
          return;
        }
      }

      return 'snapback';
    },
  });

  const trial: () => Promise<boolean> = () => {
    board = Chess.Board();
    cjsBoard.position(toChessboardJsBoardPos(board), false);
    let moves = 0;

    // TODO: Better side alternation (should be A-B-B-A-A-B-B-...)
    const challengerSide = (Math.random() < 0.5 ? Chess.codes.sides.white : Chess.codes.sides.black);
    const getRater = () => {
      return (board[64] === challengerSide ? rateBoardChallengerDeep : rateBoardDeep);
    };

    const computerMove = () => pickMoveByRatingPromise(board, getRater(), Math.random()).then(move => {
      if (move !== null) {
        board = Chess.applyMove(board, move);
        cjsBoard.position(toChessboardJsBoardPos(board), true);
        return { gameOver: false };
      }

      return { gameOver: true };
    });

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

  if (location.search.indexOf('play') === -1) {
    headToHead(
      trial,
      update => statsDisplay.textContent = JSON.stringify({
        wins: update.wins,
        losses: update.losses,
        score: `${(100 * update.score).toFixed(1)}%`,
        confidence: `${(100 * update.confidence).toFixed(1)}%`,
        time: `${Math.floor((Date.now() - startTime) / 60000)}min`,
      }, null, 2),
    );
  }

  const updateSize = () => {
    const windowSize = Math.min(window.innerHeight, window.innerWidth);

    const padding = 10;

    applyStyles(boardContainer, {
      position: 'fixed',
      left: `${(window.innerWidth - windowSize) / 2 + padding}px`,
      top: `${(window.innerHeight - windowSize) / 2 + padding}px`,
      width: `${windowSize - 2 * padding}px`,
      height: `${windowSize - 2 * padding}px`,
    });

    cjsBoard.resize();
  };

  updateSize();
  window.addEventListener('resize', updateSize);
});

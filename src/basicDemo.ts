(window as any).$ = require('jquery');
const chessboardJs = require('chessboardjs');

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
import { entries, values } from './util';

const rateBoardShallowSync = applyDepth(rateBoard, 1);
const rateBoardShallowAsync = applyPromise(rateBoardShallowSync);
const rateBoardDeep = applyDepthPromise(rateBoardShallowAsync, 0);

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

window.addEventListener('load', () => {
  const boardContainer = createElement('div');

  document.body.appendChild(boardContainer);

  let board = newGame;
  let cjsPos = toChessboardJsBoardPos(board);

  const cjsBoard = chessboardJs(boardContainer, {
    position: cjsPos,
    draggable: true,
    onDrop: (from: string, to: string) => {
      const fromIdx = pos.fromPgn(from);
      const toIdx = pos.fromPgn(to);

      const isWhiteTurn = (board[64] === codes.sides.white);
      const isWhitePiece = isWhite(board[fromIdx]);

      if (isWhiteTurn !== isWhitePiece) {
        return 'snapback';
      }

      for (const legalToIdx of findMoves(board, fromIdx)) {
        if (toIdx === legalToIdx) {
          board = applyMove(board, [fromIdx, toIdx]);
          setTimeout(() => {
            cjsBoard.position(toChessboardJsBoardPos(board), false);

            pickMoveByRatingPromise(board, rateBoardDeep).then(blackMove => {
              if (blackMove !== null) {
                board = applyMove(board, blackMove);
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
    board = newGame;
    cjsBoard.position(toChessboardJsBoardPos(board), false);
    let moves = 0;

    const computerMove = () => pickMoveByRatingPromise(board, rateBoardDeep).then(move => {
      if (move !== null) {
        board = applyMove(board, move);
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

      // If it's checkmate and black's turn, then white won
      return board[64] === codes.sides.black;
    });

    return loop();
  };

  headToHead(
    trial,
    update => console.log(update)
  );

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

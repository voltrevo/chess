(window as any).$ = require('jquery');
const chessboardJs = require('chessboardjs');

import { findMoves, toString, applyMove, newGame } from './board';
import { pos } from './pgn';
import { entries } from './util';

const createElement = (tag: string, styles: { [key: string]: string } = {}) => {
  const el = document.createElement(tag);

  for (const [key, val] of entries(styles)) {
    (el.style as any)[key] = val;
  }

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

window.addEventListener('load', () => {
  const boardContainer = createElement('div');

  const updateSize = () => {
    const windowSize = Math.min(window.innerHeight, window.innerWidth);
    boardContainer.style.width = `${0.9 * windowSize}px`;
    boardContainer.style.height = `${0.9 * windowSize}px`;
  };

  updateSize();
  window.addEventListener('resize', updateSize);

  document.body.appendChild(boardContainer);

  let board = newGame;
  let cjsPos = toChessboardJsBoardPos(board);

  const cjsBoard = chessboardJs(boardContainer, {
    position: cjsPos,
    draggable: true,
    onDrop: (from: string, to: string) => {
      const fromIdx = pos.fromPgn(from);
      const toIdx = pos.fromPgn(to);

      for (const legalToIdx of findMoves(board, fromIdx)) {
        if (toIdx === legalToIdx) {
          board = applyMove(board, [fromIdx, toIdx]);
          setTimeout(() => {
            cjsBoard.position(toChessboardJsBoardPos(board), false);
          });
          return;
        }
      }

      return 'snapback';
    },
  });
});

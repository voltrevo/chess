import * as assert from 'assert';

import { emptyIter, values } from './util';

const newGameStr = `
  R N B Q K B N R
  P P P P P P P P
  . . . . . . . .
  . . . . . . . .
  . . . . . . . .
  . . . . . . . .
  p p p p p p p p
  r n b q k b n r

  White to move
`;

export const codes = {
  pieces: {
    white: {
      king: 'k'.charCodeAt(0),
      queen: 'q'.charCodeAt(0),
      rook: 'r'.charCodeAt(0),
      knight: 'n'.charCodeAt(0),
      bishop: 'b'.charCodeAt(0),
      pawn: 'p'.charCodeAt(0),
    },
    black: {
      king: 'K'.charCodeAt(0),
      queen: 'Q'.charCodeAt(0),
      rook: 'R'.charCodeAt(0),
      knight: 'N'.charCodeAt(0),
      bishop: 'B'.charCodeAt(0),
      pawn: 'P'.charCodeAt(0),
    },
  },
  sides: {
    white: 'W'.charCodeAt(0),
    black: 'B'.charCodeAt(0),
  },
  emptySquare: '.'.charCodeAt(0),
};

export const fromString = (str: string): Uint8Array => {
  const flatStr = str.replace(/\n /g, '');
  const board = new Uint8Array(66);

  for (let i = 0; i !== 65; i++) {
    board[i] = flatStr.charCodeAt(i);
  }

  // Castling flags:
  // |      1      |      2      |      4      |      8      |
  // | white-col-7 | white-col-7 | black-col-7 | black-col-7 |

  // En passant flags:
  // |     16      |     32      |     64      |    128      |
  // | exists flag |     3 bit unsigned int for column       |

  board[65] = 1 | 2 | 4 | 8;

  return board;
};

const masks = {
  whiteCastle:  0b00000011,
  whiteCastle0: 0b00000001,
  whiteCastle7: 0b00000010,
  blackCastle:  0b00001100,
  blackCastle0: 0b00000100,
  blackCastle7: 0b00001000,
  enPassant:    0b00010000,
  enPassantAll: 0b11110000,
};

const enPassantCol = (board: Uint8Array) => {
  const flags = board[65];

  if (!(flags & masks.enPassant)) {
    return null;
  }

  return flags >> 5;
};

const setEnPassantCol = (board: Uint8Array, col: number | null) => {
  let flags = board[65];
  flags &= ~masks.enPassantAll;

  if (col !== null) {
    flags |= masks.enPassant;
    flags |= col << 5;
  }

  board[65] = flags;
};

export const toString = (board: Uint8Array) => {
  let result = '';

  for (let i = 0; i !== 8; i++) {
    for (let j = 0; j !== 8; j++) {
      if (j !== 0) {
        result += ' ';
      }

      result += String.fromCharCode(board[8 * i + j]);
    }

    result += '\n';
  }

  result += `\n${String.fromCharCode(board[64]) === 'W' ? 'White' : 'Black'} to move\n`;

  return result;
};

/**
 * E.g. findPieces(board, values(codes.pieces.white)) to get white's pieces
 */
export const findPieces = function*(board: Uint8Array, pieceCodes: Uint8Array) {
  for (let i = 0; i !== 64; i++) {
    if (pieceCodes.indexOf(board[i]) !== -1) {
      yield i;
    }
  }
};

export const findMoves = (() => {
  const isOnBoard = (pos: number) => 0 <= pos && pos < 64;
  const row = (pos: number) => Math.floor(pos / 8);

  const isMoveOnBoard = (pos: number, [di, dj]: [number, number]) => {
    const newVertPos = pos + 8 * di;

    return (
      (row(pos) === row(pos + dj)) &&
      (0 <= newVertPos && newVertPos < 64)
    );
  };

  const isWhite = (code: number) => code >= 'a'.charCodeAt(0);
  const diff = 'a'.charCodeAt(0) - 'A'.charCodeAt(0);
  const toWhite = (code: number) => !isWhite(code) ? code + diff : code;

  const kingMoves = function*(board: Uint8Array, pos: number) {
    const isPlayerWhite = isWhite(board[pos]);

    for (const di of [-1, 0, 1]) {
      for (const dj of [-1, 0, 1]) {
        if (di === 0 && dj === 0) {
          continue;
        }

        if (!isMoveOnBoard(pos, [di, dj])) {
          continue;
        }

        const newPos = pos + 8 * di + dj;
        const newPosCode = board[newPos];

        if (
          newPosCode === codes.emptySquare ||
          isWhite(newPosCode) !== isPlayerWhite
        ) {
          yield newPos;
        }
      }
    }
  };

  const travelMoves = function*(board: Uint8Array, pos: number, [di, dj]: [number, number]) {
    if (di === 0 && dj === 0) {
      return;
    }

    for (let dist = 1; true; dist++) {
      const [distI, distJ] = [di * dist, dj * dist];

      if (!isMoveOnBoard(pos, [distI, distJ])) {
        return;
      }

      const newPos = pos + 8 * distI + distJ;
      const newPosCode = board[newPos];

      if (newPosCode === codes.emptySquare) {
        yield newPos;
        continue;
      }

      if (isWhite(newPosCode) !== isWhite(board[pos])) {
        yield newPos;
        return;
      }
    }
  };

  const rookMoves = function*(board: Uint8Array, pos: number) {
    for (const unitMove of [[0, 1], [0, -1], [1, 0], [-1, 0]] as [number, number][]) {
      for (const move of travelMoves(board, pos, unitMove)) {
        yield move;
      }
    }
  };

  const bishopMoves = function*(board: Uint8Array, pos: number) {
    for (const unitMove of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as [number, number][]) {
      for (const move of travelMoves(board, pos, unitMove)) {
        yield move;
      }
    }
  };

  const queenMoves = function*(board: Uint8Array, pos: number) {
    for (const moveSet of [rookMoves, bishopMoves]) {
      for (const move of moveSet(board, pos)) {
        yield move;
      }
    }
  };

  const knightMoves = (() => {
    const moveSet: [number, number][] = [];

    for (const [di, dj] of [[2, 1], [1, 2]]) {
      for (const flipI of [1, -1]) {
        for (const flipJ of [1, -1]) {
          moveSet.push([flipI * di, flipJ * dj]);
        }
      }
    }

    return function*(board: Uint8Array, pos: number) {
      const isPlayerWhite = isWhite(board[pos]);

      for (const [di, dj] of moveSet) {
        if (!isMoveOnBoard(pos, [di, dj])) {
          continue;
        }

        const newPos = pos + 8 * di + dj;
        const newPosCode = board[newPos];

        if (
          newPosCode === codes.emptySquare ||
          isWhite(newPosCode) === isPlayerWhite
        ) {
          yield newPos;
        }
      }
    };
  })();

  const pawnMoves = function*(board: Uint8Array, pos: number) {
    const isPlayerWhite = isWhite(board[pos]);

    const firstMove = (
      isPlayerWhite ?
      row(pos) === 6 :
      row(pos) === 1
    );

    const iDirection = (isPlayerWhite ? -1 : 1);

    const forwardMoves = (
      firstMove ?
      [[iDirection, 0]] :
      [[iDirection, 0], [2 * iDirection, 0]]
    );

    for (const [di, dj] of forwardMoves) {
      if (!isMoveOnBoard(pos, [di, dj])) {
        continue;
      }

      const newPos = pos + 8 * di + dj;

      if (board[newPos] === codes.emptySquare) {
        yield newPos;
      }
    }

    for (const [di, dj] of [[iDirection, 1], [iDirection, -1]]) {
      if (!isMoveOnBoard(pos, [di, dj])) {
        continue;
      }

      const newPos = pos + 8 * di + dj;

      if (isWhite(board[newPos]) !== isPlayerWhite) {
        yield newPos;
      }
    }
  };

  return function(board: Uint8Array, pos: number) {
    const pieceCode = board[pos];

    if (pieceCode === '.'.charCodeAt(0)) {
      return emptyIter<number>();
    }

    const pieces = codes.pieces.white;

    switch (toWhite(pieceCode)) {
      case pieces.king:
        // TODO: castling
        return kingMoves(board, pos);

      case pieces.queen:
        return queenMoves(board, pos);

      case pieces.rook:
        return rookMoves(board, pos);

      case pieces.knight:
        return knightMoves(board, pos);

      case pieces.bishop:
        return bishopMoves(board, pos);

      case pieces.pawn:
        // TODO: En passant
        return pawnMoves(board, pos);
    }

    assert(false);
    return emptyIter<number>();
  };
})();

export const newGame = fromString(newGameStr);

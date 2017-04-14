const newGameStr = `
  RNBQKBNR
  PPPPPPPP
  ........
  ........
  ........
  ........
  pppppppp
  rnbqkbnr
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
    },
    black: {
      king: 'K'.charCodeAt(0),
      queen: 'Q'.charCodeAt(0),
      rook: 'R'.charCodeAt(0),
      knight: 'N'.charCodeAt(0),
      bishop: 'B'.charCodeAt(0),
    },
  },
  moves: {
    white: 'W'.charCodeAt(0),
    black: 'B'.charCodeAt(0),
  },
};

export const fromString = (str: string): Uint8Array => {
  const flatStr = str.replace(/\n /g, '');
  const board = new Uint8Array(65);

  for (let i = 0; i !== 65; i++) {
    board[i] = flatStr.charCodeAt(i);
  }

  return board;
};

export const toString = (board: Uint8Array) => {
  let result = '';

  for (let i = 0; i !== 8; i++) {
    for (let j = 0; j !== 8; j++) {
      result += String.fromCharCode(board[8 * i + j]);
    }

    result += '\n';
  }

  result += `${String.fromCharCode(board[64]) === 'W' ? 'White' : 'Black'} to move\n`;

  return result;
}

export const findPieces = function* (board: Uint8Array, pieceCodes: Uint8Array) {
  for (let i = 0; i !== 64; i++) {
    if (pieceCodes.indexOf(board[i]) !== -1) {
      yield i;
    }
  }
};

export const newGame = fromString(newGameStr);

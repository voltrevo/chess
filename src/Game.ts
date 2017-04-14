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

export const newGame = fromString(newGameStr);

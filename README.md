# Chess

Implementation of the rules of chess as well as a computer player.

Demo available at https://andrewmorris.io/chess

## Getting Started

Install:
```sh
npm install voltrevo/chess
```

Example:
```ts
import Chess from 'chess';

let board = Chess.Board();

console.log('\n' + Chess.Board.toString(board) + '\n');

Chess.findAIMove(board, 2, Math.random()).then(move => {
  if (move === null) {
    console.log('Failed to find move');
    return;
  }

  board = Chess.applyMove(board, move);

  console.log('\n' + Chess.Board.toString(board) + '\n');
});
```

Output:
```

R N B Q K B N R
P P P P P P P P
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
p p p p p p p p
r n b q k b n r

White to move


R N B Q K B N R
P P P P P P P P
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . n . .
p p p p p p p p
r n b q k b . r

Black to move

```

# API

## `Chess.Board`

The state of the board is represented as a `Uint8Array` with 66 elements, one for each square and a couple of extra bytes containing flags to keep track of things like each player's ability to castle.

Positions on the board are represented by numbers from 0 to 63, starting from the top left and proceeding left to right, top to bottom.

A starting board can be created with `Chess.Board()`.

### `Chess.Board.toString`

Convert `Chess.Board` to a `string`.

Example:

```
R N B Q K B N R
P P P P P P P P
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
p p p p p p p p
r n b q k b n r

White to move
```

### `Chess.Board.fromString`

Convert from strings similar to the example above. Whitespace is not signficant and the player to move is determined only by the first character after the board.

### `Chess.Board.copy`

Copy a chess board. This should usually be unnecessary as the api will not mutate boards passed to it (it will return new boards where appropriate).

### `Chess.codes`

Object literal indicating the numbers used to encode each piece on the board. It contains:

```
{
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
}
```

For example, if you wanted to check whether the black king was in the first square of the board, you could write:

```ts
board[0] === Chess.codes.pieces.black.king
```

### `Chess.findPieces(board, pieces)`

Returns an iterator for the positions (numbers from 0 to 63) where the specified pieces are located, if they are on the board. For example, you can find all of white's pieces with:

```
Chess.findPieces(board, Object.values(Chess.codes.pieces.white));
```

### `Chess.findMoves(board, pos)`

Returns an iterator of destinations representing all the legal moves starting from the given position.

For example, starting with a black knight in the top left corner:

```
N . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .

Black to move
```

`Array.from(Chess.findMoves(board, 0))` -> `[10, 17]`

### `Chess.isKingInCheck(board)`

Returns `true` or `false` indicating whether the king of the current player is in check.

### `Chess.isWhite(code)`

Returns `true` or `false` indicating whether the provided code is a white piece. (See `Chess.codes`).

### `Chess.toWhite(code)`

Returns the code for the equivalent white piece when passed a black piece, returns white pieces unchanged.

### `Chess.applyMove(board, move)`

Applies the provided move. Moves are represented by a pair of positions, e.g. `[52, 36]` is the e4 / king's pawn opening move.

### `Chess.findAIMove(board, depth, rand)`

Finds an AI move for the provided board.
- `depth`: How many 'moves ahead' the AI will consider. With a depth of 0 it will evaluate each possible move only by looking at the boards resulting from those moves, and no further.
- `rand`: (Optional) A number between 0 (inclusive) and 1 (exclusive) used to pick between equally ranked moves.

import * as assert from 'assert';
import * as test from 'tape';

import Board from './Board';

import { pos } from './pgn';

const checkedApplyMove = (
  board: Uint8Array | null,
  [from, to]: [string, string],
  promotionPreference?: () => number
) => {
  if (board === null) {
    return null;
  }

  const isMoveLegal = Array
    .from(Board.findMoves(board, pos.fromPgn(from)))
    .some(legalTo => pos.toPgn(legalTo) === to)
  ;

  if (!isMoveLegal) {
    return null;
  }

  return Board.applyMove(
    board,
    [pos.fromPgn(from), pos.fromPgn(to)],
    promotionPreference
  );
}

const blockTrim = (str: string) => {
  const lines = str.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim() !== '');

  const minIndent = nonEmptyLines
    .map(line => {
      const match = line.match(/^ */);

      if (match === null) {
        assert(false);
        return Infinity;
      }

      return match[0].length;
    })
    .reduce((x, y) => Math.min(x, y))
  ;

  return lines
    .map(line => line.substring(minIndent))
    .join('\n')
    .trim()
  ;
};

const sampleBoardStrings = [
  `
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    White to move
  `,
  `
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . . p . . .
    . . . . . . . .
    p p p p . p p p
    r n b q k b n r

    Black to move
  `,
  `
    R . B . . R . .
    . P . N Q . B .
    . N P . P . K .
    P . . . . . . .
    . . . p n . . .
    . p . . b . . .
    . . q . b p p p
    . . r r . . k .

    White to move
  `,
].map(blockTrim);

test('can convert games to and from strings', (t) => {
  t.plan(sampleBoardStrings.length);

  for (const boardStr of sampleBoardStrings) {
    t.equal(Board.toString(Board.fromString(boardStr)), boardStr);
  }
});

test('starting moves of e2 pawn', (t) => {
  t.plan(2);

  t.equal(Board.toString(Board()), sampleBoardStrings[-1]);

  const moveList = Array
    .from(Board.findMoves(Board(), pos.fromPgn('e2')))
    .map(pos.toPgn)
    .join(',')
  ;

  t.equal(moveList, 'e3,e4');
});

test('moves of d4 queen', (t) => {
  t.plan(1);

  const board = Board.fromString(`
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . q . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    White to move
  `);

  // 8 | R N B Q K B N R
  // 7 | * P P * P P * P
  // 6 | . * . * . * . .
  // 5 | . . * * * . . .
  // 4 | * * * q * * * *
  // 3 | . . * * * . . .
  // 2 | p p p p p p p p
  // 1 | r n b q k b n r
  //   \----------------
  //     a b c d e f g h

  const moveList = Array
    .from(Board.findMoves(board, pos.fromPgn('d4')))
    .map(pos.toPgn)
    .sort()
    .join(',')
  ;

  t.equal(moveList, 'a4,a7,b4,b6,c3,c4,c5,d3,d5,d6,d7,e3,e4,e5,f4,f6,g4,g7,h4');
});

test('pawn can capture', (t) => {
  t.plan(1);

  let board: Uint8Array | null = Board.fromString(`
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . P . . . .
    . . . . p . . .
    . . . . . . . .
    p p p p . p p p
    r n b q k b n r

    White to move
  `);

  board = checkedApplyMove(board, ['e4', 'd5']);

  t.equal(board && Board.toString(board), blockTrim(`
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . p . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p . p p p
    r n b q k b n r

    Black to move
  `));
});

test('en passant', (t) => {
  t.plan(2);

  let board: Uint8Array | null = Board.fromString(`
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . P . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    White to move
  `);

  board = checkedApplyMove(board, ['e2', 'e4']);

  t.equal(board && Board.toString(board), blockTrim(`
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . P p . . .
    . . . . . . . .
    p p p p . p p p
    r n b q k b n r

    Black to move
  `));

  board = checkedApplyMove(board, ['d4', 'e3']);

  t.equal(board && Board.toString(board), blockTrim(`
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . P . . .
    p p p p . p p p
    r n b q k b n r

    White to move
  `));
});

test('black queen side castle', (t) => {
  t.plan(1);

  let board: Uint8Array | null = Board.fromString(`
    R . . . K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    Black to move
  `);

  board = checkedApplyMove(board, ['e8', 'c8']);

  t.equal(board && Board.toString(board), blockTrim(`
    . . K R . B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    White to move
  `));
});

test('black king side castle', (t) => {
  t.plan(1);

  let board: Uint8Array | null = Board.fromString(`
    R N B Q K . . R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    Black to move
  `);

  board = checkedApplyMove(board, ['e8', 'g8']);

  t.equal(board && Board.toString(board), blockTrim(`
    R N B Q . R K .
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    White to move
  `));
});

test('knight can capture', (t) => {
  t.plan(1);

  let board: Uint8Array | null = Board.fromString(`
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . n . .
    . . . . . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    White to move
  `);

  board = checkedApplyMove(board, ['f5', 'g7']);

  t.equal(board && Board.toString(board), blockTrim(`
    R N B Q K B N R
    P P P P P P n P
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    Black to move
  `));
});

test('rooks can\'t jump over pieces', (t) => {
  t.plan(1);

  let board: Uint8Array | null = Board.fromString(`
    R N B Q K B N R
    P P P P P P P P
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p p p p p
    r n b q k b n r

    White to move
  `);

  board = checkedApplyMove(board, ['h1', 'h3']);

  t.equal(board && Board.toString(board), null);
});

test('king can move out of check', (t) => {
  t.plan(1);

  let board: Uint8Array | null = Board.fromString(`
    R N B Q K B N R
    P P P P P P P P
    . . . . Q . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p . p p p
    r n b . k b n r

    White to move
  `);

  board = checkedApplyMove(board, ['e1', 'd1']);

  t.equal(board && Board.toString(board), blockTrim(`
    R N B Q K B N R
    P P P P P P P P
    . . . . Q . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    p p p p . p p p
    r n b k . b n r

    Black to move
  `));
});

test('can\'t castle over check', (t) => {
  t.plan(1);

  let board: Uint8Array | null = Board.fromString(`
    R N . Q K B N R
    P P P . . P P P
    . . . . . . . .
    . . . P P . . .
    . . . . . . . .
    . . . . . n p B
    p p p p p p . p
    r n b q k . . r

    White to move
  `);

  board = checkedApplyMove(board, ['e1', 'g1']);

  t.equal(board && Board.toString(board), null);
});

test('pawns can\'t jump over pieces on first move', (t) => {
  t.plan(1);

  let board: Uint8Array | null = Board.fromString(`
    R N B Q K B N R
    P P P P P P n P
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . n . . .
    p p p p p p p p
    r n b q k b n r

    White to move
  `);

  board = checkedApplyMove(board, ['e2', 'e4']);

  t.equal(board && Board.toString(board), null);
});

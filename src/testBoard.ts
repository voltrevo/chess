import * as assert from 'assert';
import * as test from 'tape';

import {
  newGame,
  fromString,
  toString,
  findMoves,
  applyMove,
  codes,
} from './board';

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
    .from(findMoves(board, pos.fromPgn(from)))
    .some(legalTo => pos.toPgn(legalTo) === to)
  ;

  if (!isMoveLegal) {
    return null;
  }

  return applyMove(board, [pos.fromPgn(from), pos.fromPgn(to)], promotionPreference);
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
    t.equal(toString(fromString(boardStr)), boardStr);
  }
});

test('starting moves of e2 pawn', (t) => {
  t.plan(2);

  t.equal(toString(newGame), sampleBoardStrings[0]);

  const moveList = Array
    .from(findMoves(newGame, pos.fromPgn('e2')))
    .map(pos.toPgn)
    .join(',')
  ;

  t.equal(moveList, 'e3,e4');
});

test('moves of d4 queen', (t) => {
  t.plan(1);

  const board = fromString(`
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
    .from(findMoves(board, pos.fromPgn('d4')))
    .map(pos.toPgn)
    .sort()
    .join(',')
  ;

  t.equal(moveList, 'a4,a7,b4,b6,c3,c4,c5,d3,d5,d6,d7,e3,e4,e5,f4,f6,g4,g7,h4');
});

test('en passant', (t) => {
  t.plan(2);

  let board: Uint8Array | null = fromString(`
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

  t.equal(board && toString(board), blockTrim(`
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

  t.equal(board && toString(board), blockTrim(`
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

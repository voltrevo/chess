import * as assert from 'assert';
import * as test from 'tape';

import {
  newGame,
  fromString,
  toString,
  findMoves,
  applyMove
} from './board';

import { pos } from './pgn';

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

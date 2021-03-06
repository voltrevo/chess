import * as assert from 'assert';

import { emptyIter, values } from './util';
import findAIMoveImport from './findAIMove';

namespace Chess {
  export type Board = Uint8Array;

  export function Board(): Board {
    return Board.fromString(`
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
  }

  export namespace Board {
    export function toString(board: Board): string {
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

      result += `\n${String.fromCharCode(board[64]) === 'W' ? 'White' : 'Black'} to move`;

      return result;
    }

    export function fromString(str: string): Board {
      const flatStr = str.replace(/[\n ]/g, '');
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
    }

    export function copy(board: Board): Board {
      return Uint8Array.from(board);
    }
  }

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

  const masks = {
    castle: {
      white: {
        castle:   0b00000011,
        castle0:  0b00000001,
        castle7:  0b00000010,
      },
      black: {
        castle:   0b00001100,
        castle0:  0b00000100,
        castle7:  0b00001000,
      },
    },
    enPassant:    0b00010000,
    enPassantAll: 0b11110000,
  };

  function enPassantCol(board: Board) {
    const flags = board[65];

    if (!(flags & masks.enPassant)) {
      return null;
    }

    return flags >> 5;
  }

  function setEnPassantCol(flags: number, col: number) {
    flags &= ~masks.enPassantAll;

    flags |= masks.enPassant;
    flags |= col << 5;

    return flags;
  }

  function enPassantPos(board: Board) {
    const col = enPassantCol(board);

    if (col === null) {
      return null;
    }

    const row = (
      board[64] === codes.sides.white ?
      2 : // If white's turn, en passant row is one ahead of black's pawn row
      5   // If black's turn, en passant row is one ahead of white's pawn row
    );

    return 8 * row + col;
  }

  /**
   * E.g. findPieces(board, values(codes.pieces.white)) to get white's pieces
   */
  export function* findPieces(
    board: Board,
    pieceCodes: Uint8Array
  ): IterableIterator<number> {
    for (let i = 0; i !== 64; i++) {
      if (pieceCodes.indexOf(board[i]) !== -1) {
        yield i;
      }
    }
  };

  const row = (pos: number) => Math.floor(pos / 8);

  export const { findMoves, isKingInCheck, isWhite, toWhite } = (() => {
    const isOnBoard = (pos: number) => 0 <= pos && pos < 64;

    const isMoveOnBoard = (pos: number, [di, dj]: [number, number]) => {
      const newVertPos = pos + 8 * di;

      return (
        (row(pos) === row(pos + dj)) &&
        (0 <= newVertPos && newVertPos < 64)
      );
    };

    function isWhite(code: number): boolean {
      return code >= 'a'.charCodeAt(0);
    }

    const diff = 'a'.charCodeAt(0) - 'A'.charCodeAt(0);

    function toWhite(code: number): number {
      return !isWhite(code) ? code + diff : code;
    }

    function* travelMoves(
      board: Board,
      pos: number,
      [di, dj]: [number, number],
      isPlayerWhite: boolean,
    ) {
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

        if (isWhite(newPosCode) !== isPlayerWhite) {
          yield newPos;
        }

        return;
      }
    }

    function* rookMoves(
      board: Board,
      pos: number,
      isPlayerWhite: boolean
    ) {
      for (
        const unitMove of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ] as [number, number][]
      ) {
        for (const move of travelMoves(board, pos, unitMove, isPlayerWhite)) {
          yield move;
        }
      }
    }

    const bishopMoves = function*(
      board: Board,
      pos: number,
      isPlayerWhite: boolean
    ) {
      for (
        const unitMove of [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1]
        ] as [number, number][]
      ) {
        for (const move of travelMoves(board, pos, unitMove, isPlayerWhite)) {
          yield move;
        }
      }
    }

    function* queenMoves(
      board: Board,
      pos: number,
      isPlayerWhite: boolean
    ) {
      for (const moveSet of [rookMoves, bishopMoves]) {
        for (const move of moveSet(board, pos, isPlayerWhite)) {
          yield move;
        }
      }
    }

    const knightMoves = (() => {
      const moveSet: [number, number][] = [];

      for (const [di, dj] of [[2, 1], [1, 2]]) {
        for (const flipI of [1, -1]) {
          for (const flipJ of [1, -1]) {
            moveSet.push([flipI * di, flipJ * dj]);
          }
        }
      }

      return function*(board: Board, pos: number, isPlayerWhite: boolean) {
        for (const [di, dj] of moveSet) {
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
      };
    })();

    function* pawnMoves(
      board: Board,
      pos: number,
      isPlayerWhite: boolean
    ) {
      const firstMove = (
        isPlayerWhite ?
        row(pos) === 6 :
        row(pos) === 1
      );

      const iDirection = (isPlayerWhite ? -1 : 1);

      const forwardMoves = (
        firstMove ?
        [[iDirection, 0], [2 * iDirection, 0]] :
        [[iDirection, 0]]
      );

      for (const [di, dj] of forwardMoves) {
        if (!isMoveOnBoard(pos, [di, dj])) {
          continue;
        }

        const newPos = pos + 8 * di + dj;

        if (
          di === 2 * iDirection &&
          board[pos + 8 * iDirection + dj] !== codes.emptySquare
        ) {
          continue;
        }

        if (board[newPos] === codes.emptySquare) {
          yield newPos;
        }
      }

      for (const [di, dj] of [[iDirection, 1], [iDirection, -1]]) {
        if (!isMoveOnBoard(pos, [di, dj])) {
          continue;
        }

        const newPos = pos + 8 * di + dj;
        const newPosCode = board[newPos];

        if (
          (newPosCode !== codes.emptySquare && isWhite(newPosCode) !== isPlayerWhite) ||
          newPos === enPassantPos(board)
        ) {
          yield newPos;
        }
      }
    }

    function* plainKingMoves(
      board: Board,
      pos: number,
      isPlayerWhite: boolean
    ) {
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
    }

    function isKingInCheck(
      board: Board,
      pos: number,
      isPlayerWhite: boolean
    ): boolean {
      const opponentPieces = (
        isPlayerWhite ?
        codes.pieces.black :
        codes.pieces.white
      );

      for (const otherPos of plainKingMoves(board, pos, isPlayerWhite)) {
        if (board[otherPos] === opponentPieces.king) {
          return true;
        }
      }

      for (const otherPos of knightMoves(board, pos, isPlayerWhite)) {
        if (board[otherPos] === opponentPieces.knight) {
          return true;
        }
      }

      const i = row(pos);
      const j = pos % 8;
      const opponentPawnRow = (isPlayerWhite ? i - 1 : i + 1);

      for (const opponentPawnCol of [j - 1, j + 1]) {
        if (opponentPawnCol < 0 || opponentPawnCol > 7) {
          continue;
        }

        if (board[8 * opponentPawnRow + opponentPawnCol] === opponentPieces.pawn) {
          return true;
        }
      }

      for (const otherPos of rookMoves(board, pos, isPlayerWhite)) {
        const code = board[otherPos];
        if (code === opponentPieces.rook || code === opponentPieces.queen) {
          return true;
        }
      }

      for (const otherPos of bishopMoves(board, pos, isPlayerWhite)) {
        const code = board[otherPos];
        if (code === opponentPieces.bishop || code === opponentPieces.queen) {
          return true;
        }
      }

      return false;
    }

    function* kingMoves(board: Board, pos: number, isPlayerWhite: boolean) {
      for (const move of plainKingMoves(board, pos, isPlayerWhite)) {
        yield move;
      }

      const flags = board[65];

      const castleMasks = (
        isPlayerWhite ?
        masks.castle.white :
        masks.castle.black
      );

      if (!(flags & castleMasks.castle)) {
        return;
      }

      const i8 = 8 * row(pos);

      if (
        (flags & castleMasks.castle0) &&
        board[i8 + 1] === codes.emptySquare &&
        board[i8 + 2] === codes.emptySquare &&
        board[i8 + 3] === codes.emptySquare &&
        !isKingInCheck(board, pos, isPlayerWhite) &&
        !isKingInCheck(board, i8 + 3, isPlayerWhite)
      ) {
        yield i8 + 2;
      }

      if (
        (flags & castleMasks.castle7) &&
        board[i8 + 5] === codes.emptySquare &&
        board[i8 + 6] === codes.emptySquare &&
        !isKingInCheck(board, pos, isPlayerWhite) &&
        !isKingInCheck(board, i8 + 5, isPlayerWhite)
      ) {
        yield i8 + 6;
      }
    }

    function* findMoves(board: Board, pos: number): IterableIterator<number> {
      const pieceCode = board[pos];

      if (pieceCode === '.'.charCodeAt(0)) {
        return;
      }

      const isPlayerWhite = isWhite(pieceCode);

      const pieces = codes.pieces.white;

      const moveGen = {
        [pieces.king]: kingMoves,
        [pieces.queen]: queenMoves,
        [pieces.rook]: rookMoves,
        [pieces.knight]: knightMoves,
        [pieces.bishop]: bishopMoves,
        [pieces.pawn]: pawnMoves,
      }[toWhite(pieceCode)];

      const moves = moveGen(board, pos, isPlayerWhite);

      const kingPiece = (
        isPlayerWhite ?
        codes.pieces.white.king :
        codes.pieces.black.king
      );

      for (const move of moves) {
        // PERF: Should return this so it doesn't need recalculating after, or find a way around it
        const newBoard = applyMove(board, [pos, move]);

        let kingPos: number | null = null;
        for (const foundKingPos of findPieces(newBoard, Uint8Array.from([kingPiece]))) {
          kingPos = foundKingPos;
        }

        if (kingPos === null || !isKingInCheck(newBoard, kingPos, isPlayerWhite)) {
          yield move;
        }
      }
    }

    return { findMoves, isKingInCheck, isWhite, toWhite, row };
  })();

  export function applyMove(
    board: Board,
    [from, to]: [number, number],
    promotionPreference = () => (
      isWhite(board[from]) ?
      codes.pieces.white.queen :
      codes.pieces.black.queen
    )
  ) {
    const newBoard = Board.copy(board);
    let flags = board[65];

    // Update who's turn it is
    newBoard[64] = (
      board[64] === codes.sides.white ?
      codes.sides.black :
      codes.sides.white
    );

    // Move piece
    newBoard[from] = codes.emptySquare;
    newBoard[to] = board[from];

    const piece = toWhite(board[from]);
    const pieces = codes.pieces.white;

    // Clear en passant flags
    flags &= ~masks.enPassantAll;

    // Special treatment of pawns
    if (piece === pieces.pawn) {
      const dist = Math.abs(from - to);

      if (dist === 2 * 8) {
        // Set en passant flags - makes en passant available to opponent
        flags = setEnPassantCol(flags, from % 8);
      } else if ((
        (dist === 8 - 1 || dist === 8 + 1) && // Diagonal move
        board[to] === codes.emptySquare       // Destination empty
      )) {
        // En passant occurred - need to remove opponent pawn
        const opponentPawnRow = row(from);
        const opponentPawnCol = to % 8;
        const opponentPawnPos = 8 * opponentPawnRow + opponentPawnCol;
        newBoard[opponentPawnPos] = codes.emptySquare;
      } else {
        const toRow = row(to);

        if (toRow === 0 || toRow === 7) {
          // Promote pawn to piece of choice
          newBoard[to] = promotionPreference();
        }
      }
    }

    const [castleMasks, homeRow] = (
      board[64] === codes.sides.white ?
      [masks.castle.white, 7] :
      [masks.castle.black, 0]
    );

    // Special treatment of kings
    if (piece === pieces.king) {
      // Clear castling flags
      flags &= ~castleMasks.castle;

      // Move rook if actually castling
      if (Math.abs(from - to) === 2) {
        const rookCol = (to % 8 === 2 ? 0 : 7);
        const rookFrom = 8 * homeRow + rookCol;
        const rookTo = (from + to) / 2;

        const rook = board[rookFrom];
        newBoard[rookFrom] = codes.emptySquare;
        newBoard[rookTo] = rook;
      }
    }

    // Special treatment of rooks
    if (piece === pieces.rook && row(from) === homeRow) {
      // Clear castle flag on side
      const col = from % 8;

      if (col === 0) {
        flags &= ~castleMasks.castle0;
      } else if (col === 7) {
        flags &= ~castleMasks.castle7;
      }
    }

    newBoard[65] = flags;

    return newBoard;
  }

  export const findAIMove = findAIMoveImport;
}

export default Chess;

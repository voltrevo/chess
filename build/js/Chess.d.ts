import findAIMoveImport from './findAIMove';
declare namespace Chess {
    type Board = Uint8Array;
    function Board(): Board;
    namespace Board {
        function toString(board: Board): string;
        function fromString(str: string): Board;
        function copy(board: Board): Board;
    }
    const codes: {
        pieces: {
            white: {
                king: number;
                queen: number;
                rook: number;
                knight: number;
                bishop: number;
                pawn: number;
            };
            black: {
                king: number;
                queen: number;
                rook: number;
                knight: number;
                bishop: number;
                pawn: number;
            };
        };
        sides: {
            white: number;
            black: number;
        };
        emptySquare: number;
    };
    /**
     * E.g. findPieces(board, values(codes.pieces.white)) to get white's pieces
     */
    function findPieces(board: Board, pieceCodes: Uint8Array): IterableIterator<number>;
    const findMoves: (board: Uint8Array, pos: number) => IterableIterator<number>, isKingInCheck: (board: Uint8Array, pos: number, isPlayerWhite: boolean) => boolean, isWhite: (code: number) => boolean, toWhite: (code: number) => number;
    function applyMove(board: Board, [from, to]: [number, number], promotionPreference?: () => number): Uint8Array;
    const findAIMove: typeof findAIMoveImport;
}
export default Chess;
//# sourceMappingURL=Chess.d.ts.map
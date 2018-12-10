"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
window.$ = require('jquery');
const chessboardJs = require('chessboardjs');
const Chess_1 = require("./Chess");
const BoardRater_1 = require("./BoardRater");
const championParams_1 = require("./championParams");
const headToHead_1 = require("./headToHead");
const pgn_1 = require("./pgn");
const pickMoveByRating_1 = require("./pickMoveByRating");
const util_1 = require("./util");
// Just use the same params right now
const rateBoard = BoardRater_1.BoardRater(championParams_1.championParams);
const rateBoardChallenger = BoardRater_1.BoardRater(championParams_1.championParams);
const applyDeep = (rate) => {
    const rateShallowSync = pickMoveByRating_1.applyDepth(rate, 1);
    const rateShallowAsync = pickMoveByRating_1.applyPromise(rateShallowSync);
    const rateDeep = pickMoveByRating_1.applyDepthPromise(rateShallowAsync, 1);
    return rateDeep;
};
const rateBoardDeep = applyDeep(rateBoard);
const rateBoardChallengerDeep = applyDeep(rateBoardChallenger);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const applyStyles = (el, styles) => {
    for (const [key, val] of util_1.entries(styles)) {
        el.style[key] = val;
    }
};
const createElement = (tag, styles = {}) => {
    const el = document.createElement(tag);
    applyStyles(el, styles);
    return el;
};
const toChessboardJsBoardPos = (board) => {
    const flatStr = Chess_1.default.Board.toString(board).replace(/[\n ]/g, '');
    const pieceMap = {
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
    const cjsPos = {};
    for (let i = 0; i !== 64; i++) {
        const mappedPiece = pieceMap[flatStr[i]];
        if (mappedPiece !== undefined) {
            cjsPos[pgn_1.pos.toPgn(i)] = mappedPiece;
        }
    }
    return cjsPos;
};
const pickRandomMove = (board) => {
    const pieceCodes = (board[64] === Chess_1.default.codes.sides.white ? Chess_1.default.codes.pieces.white : Chess_1.default.codes.pieces.black);
    const piecePositions = Chess_1.default.findPieces(board, Uint8Array.from(util_1.values(pieceCodes)));
    const moves = [];
    for (const from of piecePositions) {
        for (const to of Chess_1.default.findMoves(board, from)) {
            moves.push([from, to]);
        }
    }
    if (moves.length === 0) {
        return null;
    }
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return randomMove;
};
window.addEventListener('load', () => {
    const boardContainer = createElement('div');
    const statsDisplay = createElement('pre', {
        position: 'fixed',
        right: '10px',
        bottom: '10px',
        border: '1px solid black',
        backgroundColor: '#aff',
    });
    document.body.appendChild(boardContainer);
    document.body.appendChild(statsDisplay);
    let board = Chess_1.default.Board();
    let cjsPos = toChessboardJsBoardPos(board);
    const isPlayBlack = location.search.indexOf('play-black') !== -1;
    if (isPlayBlack) {
        pickMoveByRating_1.pickMoveByRatingPromise(board, rateBoardDeep, Math.random()).then(whiteMove => {
            if (whiteMove !== null) {
                board = Chess_1.default.applyMove(board, whiteMove);
                cjsBoard.position(toChessboardJsBoardPos(board), true);
            }
        });
    }
    const cjsBoard = chessboardJs(boardContainer, {
        position: cjsPos,
        orientation: isPlayBlack ? 'black' : 'white',
        draggable: true,
        onDrop: (from, to) => {
            const fromIdx = pgn_1.pos.fromPgn(from);
            const toIdx = pgn_1.pos.fromPgn(to);
            const isWhiteTurn = (board[64] === Chess_1.default.codes.sides.white);
            const isWhitePiece = Chess_1.default.isWhite(board[fromIdx]);
            if (isWhiteTurn !== isWhitePiece) {
                return 'snapback';
            }
            for (const legalToIdx of Chess_1.default.findMoves(board, fromIdx)) {
                if (toIdx === legalToIdx) {
                    board = Chess_1.default.applyMove(board, [fromIdx, toIdx]);
                    setTimeout(() => {
                        cjsBoard.position(toChessboardJsBoardPos(board), false);
                        pickMoveByRating_1.pickMoveByRatingPromise(board, rateBoardDeep, Math.random()).then(blackMove => {
                            if (blackMove !== null) {
                                board = Chess_1.default.applyMove(board, blackMove);
                                cjsBoard.position(toChessboardJsBoardPos(board), true);
                            }
                        });
                    });
                    return;
                }
            }
            return 'snapback';
        },
    });
    const trial = () => {
        board = Chess_1.default.Board();
        cjsBoard.position(toChessboardJsBoardPos(board), false);
        let moves = 0;
        // TODO: Better side alternation (should be A-B-B-A-A-B-B-...)
        const challengerSide = (Math.random() < 0.5 ? Chess_1.default.codes.sides.white : Chess_1.default.codes.sides.black);
        const getRater = () => {
            return (board[64] === challengerSide ? rateBoardChallengerDeep : rateBoardDeep);
        };
        const computerMove = () => pickMoveByRating_1.pickMoveByRatingPromise(board, getRater(), Math.random()).then(move => {
            if (move !== null) {
                board = Chess_1.default.applyMove(board, move);
                cjsBoard.position(toChessboardJsBoardPos(board), true);
                return { gameOver: false };
            }
            return { gameOver: true };
        });
        const loop = () => computerMove().then(({ gameOver }) => {
            moves++;
            if (moves > 500) {
                console.log('Restarting due to >500 moves');
                return trial();
            }
            if (!gameOver) {
                return loop();
            }
            if (pickMoveByRating_1.determineEndState(board) === 'stalemate') {
                return trial();
            }
            // If it's checkmate and non-challenger turn, then challenger won
            return board[64] !== challengerSide;
        });
        return loop();
    };
    const startTime = Date.now();
    if (location.search.indexOf('play') === -1) {
        headToHead_1.headToHead(trial, update => statsDisplay.textContent = JSON.stringify({
            wins: update.wins,
            losses: update.losses,
            score: `${(100 * update.score).toFixed(1)}%`,
            confidence: `${(100 * update.confidence).toFixed(1)}%`,
            time: `${Math.floor((Date.now() - startTime) / 60000)}min`,
        }, null, 2));
    }
    const updateSize = () => {
        const windowSize = Math.min(window.innerHeight, window.innerWidth);
        const padding = 10;
        applyStyles(boardContainer, {
            position: 'fixed',
            left: `${(window.innerWidth - windowSize) / 2 + padding}px`,
            top: `${(window.innerHeight - windowSize) / 2 + padding}px`,
            width: `${windowSize - 2 * padding}px`,
            height: `${windowSize - 2 * padding}px`,
        });
        cjsBoard.resize();
    };
    updateSize();
    window.addEventListener('resize', updateSize);
});

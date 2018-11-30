import Chess from './Chess';
import { determineEndState, pickMoveByRatingPromise } from './pickMoveByRating';

type RaterT = (board: Uint8Array) => Promise<number>;

export const runChessGame: (rate: RaterT, rateChallenger: RaterT) => Promise<boolean> = (rate, rateChallenger) => {
  let board = Chess.Board();
  let moves = 0;

  // TODO: Better side alternation (should be A-B-B-A-A-B-B-...)
  const challengerSide = (Math.random() < 0.5 ? Chess.codes.sides.white : Chess.codes.sides.black);
  const getRater = () => {
    return (board[64] === challengerSide ? rateChallenger : rate);
  };

  const computerMove = () => {
    const rater = getRater();

    return pickMoveByRatingPromise(board, getRater(), Math.random()).then((move) => {
      if (move !== null) {
        board = Chess.applyMove(board, move);
        return { gameOver: false };
      }

      return { gameOver: true };
    });
  };

  const loop: () => Promise<boolean> = () => computerMove().then(({ gameOver }) => {
    moves++;

    if (moves > 500) {
      console.log('Restarting due to >500 moves');
      return runChessGame(rate, rateChallenger);
    }

    if (!gameOver) {
      return loop();
    }

    if (determineEndState(board) === 'stalemate') {
      return runChessGame(rate, rateChallenger);
    }

    // If it's checkmate and non-challenger turn, then challenger won
    return board[64] !== challengerSide;
  });

  return loop();
};

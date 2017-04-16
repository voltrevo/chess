import { scoreAndConfidence } from './scoreAndConfidence';

export const headToHead = (
  trial: () => Promise<boolean>,
  updateHandler: (update: {
    wins: number,
    losses: number,
    score: number,
    confidence: number,
  }) => void
) => {
  let wins = 0;
  let losses = 0;

  const loop: () => Promise<void> = () => {
    return trial()
      .then(result => {
        if (result) {
          wins++;
        } else {
          losses++;
        }

        const { score, confidence } = scoreAndConfidence(wins, losses);

        updateHandler({ wins, losses, score, confidence });

        return loop();
      })
  };

  return loop();
};

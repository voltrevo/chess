const range = (n: number) => (new Array(n)).fill(0).map((x, i) => i);

const approxIntegral = (a: number, b: number, n: number, f: (x: number) => number) => {
  const h = (b - a) / n;

  return (h / 3) * (
    f(a) +
    2 * range(n / 2 - 1)
      .map(j => j + 1)
      .map(j => f(a + 2 * j * h))
      .reduce((y1, y2) => y1 + y2)
    +
    4 * range(n / 2)
      .map(j => j + 1)
      .map(j => f(a + (2 * j - 1) * h))
      .reduce((y1, y2) => y1 + y2)
    +
    f(b)
  );
}

export const scoreAndConfidence = (wins: number, losses: number) => {
  const score = (wins + 1) / (wins + losses + 2);
  const confidence = (
    approxIntegral(0.5, 1, 100, p => Math.pow(p, wins) * Math.pow(1 - p, losses)) /
    approxIntegral(0, 1, 100, p => Math.pow(p, wins) * Math.pow(1 - p, losses))
  );

  return { score, confidence };
};

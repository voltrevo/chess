import { scoreAndConfidence } from './scoreAndConfidence';

type ChallengerType<ParamSet, ParamVector> = {
  vector: ParamVector,
  params: ParamSet,
  wins: number,
  losses: number
};

type UpdateType<ParamSet, ParamVector> = {
  championParams: ParamSet,
  challengerPool: ChallengerType<ParamSet, ParamVector>[],
  testCount: number,
  challengerCount: number,
  acceptCount: number,
  min: string,
};

const range = (n: number) => (new Array(n)).fill(0).map((x, i) => i);

export const headToHeadSearch = <ParamSet, ParamVector>(
  testPair: (a: ParamSet, b: ParamSet) => Promise<boolean>,
  championParams: ParamSet,
  generateMutationVector: () => ParamVector,
  applyMutationVector: (p: ParamSet, v: ParamVector) => ParamSet,
  acceptThreshold: number,
  rejectThreshold: number,
  poolSize: number,
  updateHandler: (updates: UpdateType<ParamSet, ParamVector>) => void
) => {
  let challengerCount = 0;
  let acceptCount = 0;

  const createChallenger: () => ChallengerType<ParamSet, ParamVector> = () => {
    const vector = generateMutationVector();
    const params = applyMutationVector(championParams, vector);
    challengerCount++;

    return { vector, params, wins: 0, losses: 0 };
  };

  let challengerPool = range(poolSize).map(createChallenger);

  const challengerPoolWithSc = (winBoost: number) => challengerPool
    .map(challenger => ({ challenger, sc: scoreAndConfidence(challenger.wins + winBoost, challenger.losses) }))
  ;

  const pickChallenger = () => challengerPoolWithSc(1)
    .reduce((a, b) => (a.sc.confidence > b.sc.confidence ? a : b))
    .challenger
  ;

  const replaceChampion = (challenger: ChallengerType<ParamSet, ParamVector>) => {
    // Set new champion
    championParams = challenger.params;

    // Remove challenger from pool
    challengerPool = challengerPool.filter(ch => ch !== challenger);

    // Re-apply challenger vectors to new champion and reset wins & losses
    // TODO: How to prevent any promising challengers from the previous round
    // from getting knocked out early by chance in the next round?
    challengerPool.forEach(ch => {
      ch.wins = 0;
      ch.losses = 0;
      ch.params = applyMutationVector(championParams, ch.vector);
    });

    acceptCount++;
  };

  let testCount = 0;

  const runTest = () => {
    const challenger = pickChallenger();

    return testPair(championParams, challenger.params)
      .then(won => {
        testCount++;

        if (won) {
          challenger.wins++;

          if (scoreAndConfidence(challenger.wins, challenger.losses).confidence > acceptThreshold) {
            replaceChampion(challenger);
          }
        } else {
          challenger.losses++;
        }
      })
    ;
  };

  const churnPool = () => {
    challengerPool = challengerPoolWithSc(1)
      .filter(({ challenger, sc }) => (
        challenger.wins + challenger.losses === 0 ||
        sc.confidence > rejectThreshold
      ))
      .map(({ challenger }) => challenger)
    ;

    while (challengerPool.length < poolSize) {
      challengerPool.push(createChallenger());
    }
  };

  const startTime = Date.now();

  const triggerUpdate = () => updateHandler({
    championParams,
    challengerPool,
    testCount,
    challengerCount,
    acceptCount,
    min: `${((Date.now() - startTime) / 60000).toFixed(1)}min`,
  });

  const loop: () => Promise<void> = () => runTest()
    .then(churnPool)
    .then(triggerUpdate)
    .then(loop)
  ;

  triggerUpdate();
  return loop();
};

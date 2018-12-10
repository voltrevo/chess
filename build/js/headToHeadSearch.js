"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scoreAndConfidence_1 = require("./scoreAndConfidence");
const range = (n) => (new Array(n)).fill(0).map((x, i) => i);
exports.headToHeadSearch = (testPair, championParams, generateMutationVector, applyMutationVector, acceptThreshold, rejectThreshold, poolSize, updateHandler) => {
    let challengerCount = 0;
    let acceptCount = 0;
    const createChallenger = () => {
        const vector = generateMutationVector();
        const params = applyMutationVector(championParams, vector);
        challengerCount++;
        return { vector, params, wins: 0, losses: 0 };
    };
    let challengerPool = range(poolSize).map(createChallenger);
    const challengerPoolWithSc = (winBoost) => challengerPool
        .map(challenger => ({ challenger, sc: scoreAndConfidence_1.scoreAndConfidence(challenger.wins + winBoost, challenger.losses) }));
    const pickChallenger = () => challengerPoolWithSc(1)
        .reduce((a, b) => (a.sc.confidence > b.sc.confidence ? a : b))
        .challenger;
    const replaceChampion = (challenger) => {
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
                if (scoreAndConfidence_1.scoreAndConfidence(challenger.wins, challenger.losses).confidence > acceptThreshold) {
                    replaceChampion(challenger);
                }
            }
            else {
                challenger.losses++;
            }
        });
    };
    const churnPool = () => {
        challengerPool = challengerPoolWithSc(1)
            .filter(({ challenger, sc }) => (challenger.wins + challenger.losses === 0 ||
            sc.confidence > rejectThreshold))
            .map(({ challenger }) => challenger);
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
    const loop = () => runTest()
        .then(churnPool)
        .then(triggerUpdate)
        .then(loop);
    triggerUpdate();
    return loop();
};

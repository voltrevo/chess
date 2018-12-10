"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scoreAndConfidence_1 = require("./scoreAndConfidence");
exports.headToHead = (trial, updateHandler) => {
    let wins = 0;
    let losses = 0;
    const loop = () => {
        return trial()
            .then(result => {
            if (result) {
                wins++;
            }
            else {
                losses++;
            }
            const { score, confidence } = scoreAndConfidence_1.scoreAndConfidence(wins, losses);
            updateHandler({ wins, losses, score, confidence });
            return loop();
        });
    };
    return loop();
};

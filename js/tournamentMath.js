// js/tournamentMath.js

export function getNextPowerOfTwo(n) {
    let p = 1;
    while (p < n) p *= 2;
    return p;
}

export function getWinnersBracketRoundsCount(bracketSize) {
    if (bracketSize < 2) return 0;
    return Math.log2(bracketSize);
}

export function getLosersBracketRoundsCount(bracketSize) {
    if (bracketSize < 4) return 0;
    return 2 * Math.log2(bracketSize) - 2;
}

export function getWinnersRoundMatchCount(vRoundIndex, bracketSize) {
    return bracketSize / Math.pow(2, vRoundIndex);
}

export function getLosersRoundMatchCount(pRoundIndex, bracketSize) {
    return bracketSize / Math.pow(2, Math.ceil(pRoundIndex / 2) + 1);
}

export const getLoserDestinationRound = (vRoundIndex) => (vRoundIndex === 1) ? 1 : (2 * vRoundIndex - 2);

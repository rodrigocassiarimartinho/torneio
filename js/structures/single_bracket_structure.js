// js/structures/double_bracket_structure.js
// Versão com a lógica de ranking do campeão e formatação de rótulos corrigida.

import * as TMath from '../math.js';

/**
 * Formata um rótulo de colocação para o formato "5º to 6º".
 * @param {number} start O início da faixa de colocação.
 * @param {number} count O número de jogadores nessa faixa.
 * @returns {string} O rótulo formatado.
 */
function formatPlacement(start, count) {
    if (count === 1) {
        return `${start}º`;
    }
    const end = start + count - 1;
    return `${start}º to ${end}º`;
}

export function buildDoubleBracketStructure(n_original) {
    const bracketSize = TMath.getNextPowerOfTwo(n_original);
    if (bracketSize < 2) return { type: 'double', winnersBracket: [], losersBracket: [], grandFinal: [], ranking: {} };

    let matchIdCounter = 1;
    const winnersBracket = [];
    const losersBracket = [];
    const grandFinal = [];
    const ranking = {};

    const numWinnersRounds = TMath.getWinnersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numWinnersRounds; i++) {
        winnersBracket.push(Array.from({ length: TMath.getWinnersRoundMatchCount(i, bracketSize) }, () => ({ id: matchIdCounter++, p1: null, p2: null })));
    }
    const numLosersRounds = TMath.getLosersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numLosersRounds; i++) {
        losersBracket.push(Array.from({ length: TMath.getLosersRoundMatchCount(i, bracketSize) }, () => ({ id: matchIdCounter++, p1: null, p2: null })));
    }

    for(let r=0; r < winnersBracket.length - 1; r++) {
        const currentRound = winnersBracket[r];
        const nextRound = winnersBracket[r+1];
        nextRound.forEach((match, index) => {
            match.p1 = { name: `Winner of M${currentRound[index*2].id}`, isPlaceholder: true };
            match.p2 = { name: `Winner of M${currentRound[index*2+1].id}`, isPlaceholder: true };
        });
    }

    if (losersBracket.length > 0 && winnersBracket.length > 0) {
        if (losersBracket[0]) {
            const losersFromV1 = winnersBracket[0].map(m => ({ name: `Loser of M${m.id}`, isPlaceholder: true }));
            losersBracket[0].forEach((match, index) => {
                match.p1 = losersFromV1[index*2];
                match.p2 = losersFromV1[index*2 + 1];
            });
        }
        let wbLoserDropIndex = 1;
        for (let r = 1; r < losersBracket.length; r++) {
            const pRoundIndex = r + 1;
            const currentLosersRound = losersBracket[r];
            let lbWinners = losersBracket[r-1].map(m => ({ name: `Winner of M${m.id}`, isPlaceholder: true }));
            let wbLosers = [];
            const loserDest = TMath.getLoserDestinationRound(wbLoserDropIndex + 1);
            if (loserDest === pRoundIndex) {
                wbLosers = winnersBracket[wbLoserDropIndex].map(m => ({ name: `Loser of M${m.id}`, isPlaceholder: true }));
                if (pRoundIndex > 1) { wbLosers.reverse(); }
                wbLoserDropIndex++;
            }
            currentLosersRound.forEach((match, matchIndex) => {
                const isInternalRound = lbWinners.length > 0 && wbLosers.length === 0;
                if (isInternalRound) {
                    match.p1 = lbWinners[matchIndex*2];
                    match.p2 = lbWinners[matchIndex*2 + 1];
                } else {
                    match.p1 = lbWinners[matchIndex];
                    match.p2 = wbLosers[matchIndex];
                }
            });
        }
    }

    ranking['1º'] = [];
    ranking['2º'] = [];
    let currentPlacement = 3;

    for (let r = losersBracket.length - 1; r >= 0; r--) {
        const round = losersBracket[r];
        const playersInTier = round.length;
        if (playersInTier === 0) continue;

        const placementLabel = formatPlacement(currentPlacement, playersInTier);

        ranking[placementLabel] = [];
        round.forEach(match => {
            match.loserDestination = `RANK:${placementLabel}`;
        });
        currentPlacement += playersInTier;
    }

    if (bracketSize >= 2) {
        const wbFinalWinner = { name: `Winner of M${winnersBracket[numWinnersRounds-1][0].id}`, isPlaceholder: true };
        const lbFinalWinner = losersBracket.length > 0 ? { name: `Winner of M${losersBracket[numLosersRounds-1][0].id}`, isPlaceholder: true } : {name: 'TBD'};

        const finalMatch1 = { id: matchIdCounter++, p1: wbFinalWinner, p2: lbFinalWinner };

        if (losersBracket.length === 0) {
            finalMatch1.winnerDestination = `RANK:1º`;
            finalMatch1.loserDestination = `RANK:2º`;
            grandFinal.push([finalMatch1]);
        } else {
            const finalMatch2 = { id: matchIdCounter++, p1: { name: `Winner of M${finalMatch1.id}`, isPlaceholder: true }, p2: { name: `Loser of M${finalMatch1.id}`, isPlaceholder: true } };
            const championBox = { id: matchIdCounter++, isChampionBox: true, p1: { name: `Winner of M${finalMatch2.id}`, isPlaceholder: true }, winnerDestination: `RANK:1º` };

            finalMatch1.winnerDestination = `Winner of M${finalMatch1.id}`;
            finalMatch1.loserDestination = `RANK:2º`;

            finalMatch2.winnerDestination = `RANK:1º`;
            finalMatch2.loserDestination = `RANK:2º`;

            grandFinal.push([finalMatch1], [finalMatch2], [championBox]);
        }
    }

    return { type: 'double', winnersBracket, losersBracket, grandFinal, ranking };
}

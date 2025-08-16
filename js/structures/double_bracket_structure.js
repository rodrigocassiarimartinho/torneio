// js/structures/double_bracket_structure.js
import * as TMath from '../math.js';

export function buildDoubleBracketStructure(n_original) {
    const bracketSize = TMath.getNextPowerOfTwo(n_original);
    if (bracketSize < 2) return { winnersBracket: [], losersBracket: [], grandFinal: [] };

    let matchIdCounter = 1;
    const winnersBracket = [];
    const losersBracket = [];
    const grandFinal = [];

    const numWinnersRounds = TMath.getWinnersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numWinnersRounds; i++) {
        const numMatches = TMath.getWinnersRoundMatchCount(i, bracketSize);
        winnersBracket.push(Array.from({ length: numMatches }, () => ({ id: matchIdCounter++, p1: null, p2: null })));
    }

    const numLosersRounds = TMath.getLosersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numLosersRounds; i++) {
        const numMatches = TMath.getLosersRoundMatchCount(i, bracketSize);
        losersBracket.push(Array.from({ length: numMatches }, () => ({ id: matchIdCounter++, p1: null, p2: null })));
    }

    for(let r=0; r < winnersBracket.length - 1; r++) {
        const currentRound = winnersBracket[r];
        const nextRound = winnersBracket[r+1];
        nextRound.forEach((match, index) => {
            match.p1 = { name: `Winner of M${currentRound[index*2].id}`, isPlaceholder: true };
            match.p2 = { name: `Winner of M${currentRound[index*2+1].id}`, isPlaceholder: true };
        });
    }

    if (losersBracket[0] && winnersBracket[0]) {
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

    if (bracketSize >= 2) {
        const wbFinalWinner = { name: `Winner of M${winnersBracket[numWinnersRounds-1][0].id}`, isPlaceholder: true };
        const lbFinalWinner = losersBracket[numLosersRounds-1] ? { name: `Winner of M${losersBracket[numLosersRounds-1][0].id}`, isPlaceholder: true } : {name: 'TBD'};
        grandFinal.push([{ id: matchIdCounter++, p1: wbFinalWinner, p2: lbFinalWinner }]);
    }
    
    return { winnersBracket, losersBracket, grandFinal };
}

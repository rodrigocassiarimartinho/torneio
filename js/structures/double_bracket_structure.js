// js/structures/double_bracket_structure.js
// Responsável por criar o "esqueleto" de uma chave de dupla eliminação,
// incluindo a geração dinâmica da estrutura de classificação.

import * as TMath from '../math.js';

export function buildDoubleBracketStructure(n_original) {
    const bracketSize = TMath.getNextPowerOfTwo(n_original);
    if (bracketSize < 2) return { type: 'double', winnersBracket: [], losersBracket: [], grandFinal: [], ranking: {} };

    let matchIdCounter = 1;
    const winnersBracket = [];
    const losersBracket = [];
    const grandFinal = [];
    const ranking = {};

    // 1. Constrói esqueletos da WB e LB
    const numWinnersRounds = TMath.getWinnersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numWinnersRounds; i++) {
        winnersBracket.push(Array.from({ length: TMath.getWinnersRoundMatchCount(i, bracketSize) }, () => ({ id: matchIdCounter++, p1: null, p2: null })));
    }
    const numLosersRounds = TMath.getLosersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numLosersRounds; i++) {
        losersBracket.push(Array.from({ length: TMath.getLosersRoundMatchCount(i, bracketSize) }, () => ({ id: matchIdCounter++, p1: null, p2: null })));
    }

    // 2. Preenche WB com placeholders
    for(let r=0; r < winnersBracket.length - 1; r++) {
        const currentRound = winnersBracket[r];
        const nextRound = winnersBracket[r+1];
        nextRound.forEach((match, index) => {
            match.p1 = { name: `Winner of M${currentRound[index*2].id}`, isPlaceholder: true };
            match.p2 = { name: `Winner of M${currentRound[index*2+1].id}`, isPlaceholder: true };
        });
    }

    // 3. Preenche LB com placeholders de vencedores da WB e da própria LB
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

    // 4. Gera o esqueleto do ranking e atribui destinos aos perdedores da Losers Bracket
    ranking['1st Place'] = [];
    ranking['2nd Place'] = [];
    let currentPlacement = 3;
    for (let r = losersBracket.length - 1; r >= 0; r--) {
        const round = losersBracket[r];
        const playersInTier = round.length;
        if (playersInTier === 0) continue;

        let placementLabel;
        if (playersInTier > 1) {
            const lastPlaceInTier = currentPlacement + playersInTier - 1;
            placementLabel = `${currentPlacement}th-${lastPlaceInTier}th Place`;
        } else {
            placementLabel = `${currentPlacement}rd Place`;
            // Lógica para 4º lugar, se houver
            if (currentPlacement === 3 && losersBracket.length > 1) {
                placementLabel = '3rd Place';
                ranking['4th Place'] = [];
                const prevRound = losersBracket[r-1];
                if (prevRound) {
                    prevRound.forEach(match => {
                        match.loserDestination = `RANK:4th Place`;
                    });
                }
            }
        }
        
        ranking[placementLabel] = [];
        round.forEach(match => {
            match.loserDestination = `RANK:${placementLabel}`;
        });
        currentPlacement += playersInTier;
    }
    
    // 5. Constrói e atribui destinos para a Grande Final
    if (bracketSize >= 2) {
        const wbFinalWinner = { name: `Winner of M${winnersBracket[numWinnersRounds-1][0].id}`, isPlaceholder: true };
        const lbFinalWinner = losersBracket.length > 0 ? { name: `Winner of M${losersBracket[numLosersRounds-1][0].id}`, isPlaceholder: true } : {name: 'TBD'};
        
        const finalMatch1 = { id: matchIdCounter++, p1: wbFinalWinner, p2: lbFinalWinner };
        
        if (losersBracket.length === 0) {
            finalMatch1.winnerDestination = `RANK:1st Place`;
            finalMatch1.loserDestination = `RANK:2nd Place`;
            grandFinal.push([finalMatch1]);
        } else {
            const finalMatch2 = { id: matchIdCounter++, p1: { name: `Winner of M${finalMatch1.id}`, isPlaceholder: true }, p2: { name: `Loser of M${finalMatch1.id}`, isPlaceholder: true } };
            const championBox = { id: matchIdCounter++, isChampionBox: true, p1: { name: `Winner of M${finalMatch2.id}`, isPlaceholder: true }, p2: null, winnerDestination: `RANK:1st Place` };
            
            finalMatch1.loserDestination = `RANK:2nd Place`;
            finalMatch2.winnerDestination = `RANK:1st Place`;
            finalMatch2.loserDestination = `RANK:2nd Place`;

            grandFinal.push([finalMatch1], [finalMatch2], [championBox]);
        }
    }
    
    return { type: 'double', winnersBracket, losersBracket, grandFinal, ranking };
}

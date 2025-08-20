// js/structures/single_bracket_structure.js
// Versão com a lógica de ranking dinâmico e exportação corrigida.

import { getNextPowerOfTwo, getWinnersBracketRoundsCount, getWinnersRoundMatchCount } from '../math.js';

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

export function buildSingleBracketStructure(n_original) {
    const bracketSize = getNextPowerOfTwo(n_original);
    if (bracketSize < 2) return { type: 'single', rounds: [], ranking: {} };

    let matchIdCounter = 1;
    const rounds = [];
    const ranking = {};

    const numRounds = getWinnersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numRounds; i++) {
        const numMatches = getWinnersRoundMatchCount(i, bracketSize);
        const round = Array.from({ length: numMatches }, () => ({ id: matchIdCounter++, p1: null, p2: null }));
        rounds.push(round);
    }
    
    ranking['1º'] = [];
    ranking['2º'] = [];

    for (let r = numRounds - 2; r >= 0; r--) {
        const round = rounds[r];
        const losersInThisRound = round.length;
        // Calcula a posição inicial dos perdedores desta rodada
        const previousLosers = bracketSize / Math.pow(2, r + 1);
        const losersPlacement = previousLosers + 1;

        const placementLabel = formatPlacement(losersPlacement, losersInThisRound);
        
        ranking[placementLabel] = [];
        round.forEach(match => {
            match.loserDestination = `RANK:${placementLabel}`;
        });
    }

    for(let r=0; r < rounds.length - 1; r++) {
        const currentRound = rounds[r];
        const nextRound = rounds[r+1];
        nextRound.forEach((match, index) => {
            match.p1 = { name: `Winner of M${currentRound[index*2].id}`, isPlaceholder: true };
            match.p2 = { name: `Winner of M${currentRound[index*2+1].id}`, isPlaceholder: true };
        });
    }
    
    const finalMatch = rounds[numRounds - 1][0];
    finalMatch.winnerDestination = `RANK:1º`;
    finalMatch.loserDestination = `RANK:2º`;
    
    const championBox = { 
        id: matchIdCounter++, 
        isChampionBox: true, 
        p1: { name: `Winner of M${finalMatch.id}`, isPlaceholder: true }, 
        p2: null,
        winnerDestination: `RANK:1º`
    };
    rounds.push([championBox]);
    
    return { type: 'single', rounds, ranking };
}

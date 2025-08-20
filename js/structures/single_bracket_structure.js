// js/structures/single_bracket_structure.js
// Versão com a lógica de ranking dinâmico corrigida.

import { getNextPowerOfTwo, getWinnersBracketRoundsCount, getWinnersRoundMatchCount } from '../math.js';

/**
 * Converte um número para sua forma ordinal em inglês (1st, 2nd, 3rd, 4th).
 * @param {number} n O número a ser convertido.
 * @returns {string} O número com o sufixo ordinal.
 */
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
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
    
    ranking['1st Place'] = [];
    ranking['2nd Place'] = [];

    // --- INÍCIO DA CORREÇÃO ---
    // Itera pelas rodadas (exceto a final) para definir as colocações dos perdedores
    for (let r = numRounds - 2; r >= 0; r--) {
        const round = rounds[r];
        // A colocação de um perdedor é o número de partidas da rodada + 1.
        const losersPlacement = round.length + 1;
        
        let placementLabel;
        if (round.length > 1) { // Mais de um perdedor, então é um empate
            const lastPlaceInTier = losersPlacement + round.length - 1;
            placementLabel = `${getOrdinal(losersPlacement)}-${getOrdinal(lastPlaceInTier)} Place`;
        } else {
             placementLabel = `${getOrdinal(losersPlacement)} Place`;
        }
        
        ranking[placementLabel] = [];
        round.forEach(match => {
            match.loserDestination = `RANK:${placementLabel}`;
        });
    }
    // --- FIM DA CORREÇÃO ---

    for(let r=0; r < rounds.length - 1; r++) {
        const currentRound = rounds[r];
        const nextRound = rounds[r+1];
        nextRound.forEach((match, index) => {
            match.p1 = { name: `Winner of M${currentRound[index*2].id}`, isPlaceholder: true };
            match.p2 = { name: `Winner of M${currentRound[index*2+1].id}`, isPlaceholder: true };
        });
    }
    
    const finalMatch = rounds[numRounds - 1][0];
    finalMatch.winnerDestination = `RANK:1st Place`;
    finalMatch.loserDestination = `RANK:2nd Place`;
    
    const championBox = { 
        id: matchIdCounter++, 
        isChampionBox: true, 
        p1: { name: `Winner of M${finalMatch.id}`, isPlaceholder: true }, 
        p2: null 
    };
    rounds.push([championBox]);
    
    return { type: 'single', rounds, ranking };
}

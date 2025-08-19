// js/structures/single_bracket_structure.js
// Responsável por criar o "esqueleto" de uma chave de eliminação simples,
// com todas as rodadas e partidas, mas sem jogadores (apenas placeholders).

import { getNextPowerOfTwo, getWinnersBracketRoundsCount, getWinnersRoundMatchCount } from '../math.js';

export function buildSingleBracketStructure(n_original) {
    const bracketSize = getNextPowerOfTwo(n_original);
    if (bracketSize < 2) return { rounds: [] };

    let matchIdCounter = 1;
    const rounds = [];

    const numRounds = getWinnersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numRounds; i++) {
        const numMatches = getWinnersRoundMatchCount(i, bracketSize);
        const round = Array.from({ length: numMatches }, () => ({ id: matchIdCounter++, p1: null, p2: null }));
        rounds.push(round);
    }

    for(let r=0; r < rounds.length - 1; r++) {
        const currentRound = rounds[r];
        const nextRound = rounds[r+1];
        nextRound.forEach((match, index) => {
            match.p1 = { name: `Winner of M${currentRound[index*2].id}`, isPlaceholder: true };
            match.p2 = { name: `Winner of M${currentRound[index*2+1].id}`, isPlaceholder: true };
        });
    }
    
    if (rounds.length > 0) {
        const finalMatch = rounds[rounds.length - 1][0];
        const championRound = [];
        const championBox = { 
            id: matchIdCounter++, 
            isChampionBox: true, 
            p1: { name: `Winner of M${finalMatch.id}`, isPlaceholder: true }, 
            p2: null 
        };
        championRound.push(championBox);
        rounds.push(championRound);
    }
    
    return { type: 'single', rounds };
}

// js/structures/single_bracket_structure.js
// Responsável por criar o "esqueleto" de uma chave de eliminação simples,
// incluindo a geração dinâmica da estrutura de classificação.

import { getNextPowerOfTwo, getWinnersBracketRoundsCount, getWinnersRoundMatchCount } from '../math.js';

export function buildSingleBracketStructure(n_original) {
    const bracketSize = getNextPowerOfTwo(n_original);
    if (bracketSize < 2) return { rounds: [] };

    let matchIdCounter = 1;
    const rounds = [];
    const ranking = {};

    // 1. Constrói o esqueleto da chave
    const numRounds = getWinnersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numRounds; i++) {
        const numMatches = getWinnersRoundMatchCount(i, bracketSize);
        const round = Array.from({ length: numMatches }, () => ({ id: matchIdCounter++, p1: null, p2: null }));
        rounds.push(round);
    }
    
    // 2. Gera o esqueleto do ranking e atribui destinos de classificação aos perdedores
    ranking['1st Place'] = [];
    ranking['2nd Place'] = [];

    for (let r = numRounds - 2; r >= 0; r--) {
        const round = rounds[r];
        const losersPlacement = (round.length * 2) + 1;
        
        let placementLabel = `${losersPlacement}th Place`;
        if (round.length > 1) { // Mais de um perdedor, então é um empate
            const lastPlaceInTier = losersPlacement + round.length - 1;
            placementLabel = `${losersPlacement}th-${lastPlaceInTier}th Place`;
        }
        
        ranking[placementLabel] = [];
        round.forEach(match => {
            match.loserDestination = `RANK:${placementLabel}`;
        });
    }

    // 3. Preenche a chave com apontadores
    for(let r=0; r < rounds.length - 1; r++) {
        const currentRound = rounds[r];
        const nextRound = rounds[r+1];
        nextRound.forEach((match, index) => {
            match.p1 = { name: `Winner of M${currentRound[index*2].id}`, isPlaceholder: true };
            match.p2 = { name: `Winner of M${currentRound[index*2+1].id}`, isPlaceholder: true };
        });
    }
    
    // 4. Atribui destinos para a final
    const finalMatch = rounds[numRounds - 1][0];
    finalMatch.winnerDestination = `RANK:1st Place`;
    finalMatch.loserDestination = `RANK:2nd Place`;
    
    return { type: 'single', rounds, ranking };
}

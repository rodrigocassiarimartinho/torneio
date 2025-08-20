// js/structures/single_bracket_structure.js
// Responsável por criar o "esqueleto" de uma chave de eliminação simples,
// incluindo a geração dinâmica da estrutura de classificação.

import { getNextPowerOfTwo, getWinnersBracketRoundsCount, getWinnersRoundMatchCount } from '../math.js';

export function buildSingleBracketStructure(n_original) {
    const bracketSize = getNextPowerOfTwo(n_original);
    if (bracketSize < 2) return { type: 'single', rounds: [], ranking: {} };

    let matchIdCounter = 1;
    const rounds = [];
    const ranking = {};

    // 1. Constrói o esqueleto da chave com partidas vazias
    const numRounds = getWinnersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numRounds; i++) {
        const numMatches = getWinnersRoundMatchCount(i, bracketSize);
        const round = Array.from({ length: numMatches }, () => ({ id: matchIdCounter++, p1: null, p2: null }));
        rounds.push(round);
    }
    
    // 2. Gera o esqueleto do ranking e atribui destinos de classificação aos perdedores
    ranking['1st Place'] = [];
    ranking['2nd Place'] = [];

    // Itera pelas rodadas (exceto a final) para definir as colocações dos perdedores
    for (let r = numRounds - 2; r >= 0; r--) {
        const round = rounds[r];
        // A colocação de um perdedor é o número de times que avançam + 1
        const losersPlacement = (bracketSize / Math.pow(2, r+1)) * 2 + 1;
        
        let placementLabel;
        if (round.length > 1) { // Mais de um perdedor, então é um empate
            const lastPlaceInTier = losersPlacement + round.length - 1;
            placementLabel = `${losersPlacement}th-${lastPlaceInTier}th Place`;
        } else { // Apenas um perdedor (ex: disputa de 3º lugar, se existisse)
             placementLabel = `${losersPlacement}rd Place`;
        }
        
        // Cria a entrada no objeto de ranking e atribui o placeholder de destino
        ranking[placementLabel] = [];
        round.forEach(match => {
            match.loserDestination = `RANK:${placementLabel}`;
        });
    }

    // 3. Preenche a chave com apontadores de vencedores para as próximas rodadas
    for(let r=0; r < rounds.length - 1; r++) {
        const currentRound = rounds[r];
        const nextRound = rounds[r+1];
        nextRound.forEach((match, index) => {
            match.p1 = { name: `Winner of M${currentRound[index*2].id}`, isPlaceholder: true };
            match.p2 = { name: `Winner of M${currentRound[index*2+1].id}`, isPlaceholder: true };
        });
    }
    
    // 4. Atribui destinos de classificação para o vencedor e perdedor da final
    const finalMatch = rounds[numRounds - 1][0];
    finalMatch.winnerDestination = `RANK:1st Place`;
    finalMatch.loserDestination = `RANK:2nd Place`;
    
    // O último elemento da chave é a caixa do campeão, que apenas recebe o vencedor
    const championBox = { 
        id: matchIdCounter++, 
        isChampionBox: true, 
        p1: { name: `Winner of M${finalMatch.id}`, isPlaceholder: true }, 
        p2: null 
    };
    rounds.push([championBox]);
    
    return { type: 'single', rounds, ranking };
}

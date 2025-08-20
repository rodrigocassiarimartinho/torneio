// js/structures/double_bracket_structure.js
// Responsável por criar o "esqueleto" de uma chave de dupla eliminação,
// incluindo a geração dinâmica da estrutura de classificação.

import * as TMath from '../math.js';

export function buildDoubleBracketStructure(n_original) {
    const bracketSize = TMath.getNextPowerOfTwo(n_original);
    if (bracketSize < 2) return { winnersBracket: [], losersBracket: [], grandFinal: [], ranking: {} };

    // ... (toda a lógica de construção das chaves até o passo 4 permanece a mesma) ...
    let matchIdCounter = 1;
    const winnersBracket = [];
    const losersBracket = [];
    const grandFinal = [];

    const numWinnersRounds = TMath.getWinnersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numWinnersRounds; i++) {
        winnersBracket.push(Array.from({ length: TMath.getWinnersRoundMatchCount(i, bracketSize) }, () => ({ id: matchIdCounter++, p1: null, p2: null })));
    }

    const numLosersRounds = TMath.getLosersBracketRoundsCount(bracketSize);
    for (let i = 1; i <= numLosersRounds; i++) {
        losersBracket.push(Array.from({ length: TMath.getLosersRoundMatchCount(i, bracketSize) }, () => ({ id: matchIdCounter++, p1: null, p2: null })));
    }
    // ... (lógica de preenchimento com placeholders para WB e LB inalterada) ...


    // 5. Gera o esqueleto do ranking e atribui destinos aos perdedores da Losers Bracket
    const ranking = { '1st Place': [], '2nd Place': [] };
    let currentPlacement = 3;

    // Itera pela chave dos perdedores DE TRÁS PARA FRENTE
    for (let r = losersBracket.length - 1; r >= 0; r--) {
        const round = losersBracket[r];
        const playersInTier = round.length;

        let placementLabel = `${currentPlacement}th Place`;
        if (playersInTier > 1) {
            const lastPlaceInTier = currentPlacement + playersInTier - 1;
            placementLabel = `${currentPlacement}th-${lastPlaceInTier}th Place`;
        }
        
        ranking[placementLabel] = [];
        round.forEach(match => {
            match.loserDestination = `RANK:${placementLabel}`;
        });
        currentPlacement += playersInTier;
    }
    
    // 6. Constrói e atribui destinos para a Grande Final
    if (bracketSize >= 2) {
        const wbFinalWinner = { name: `Winner of M${winnersBracket[numWinnersRounds-1][0].id}`, isPlaceholder: true };
        const lbFinalWinner = losersBracket.length > 0 ? { name: `Winner of M${losersBracket[numLosersRounds-1][0].id}`, isPlaceholder: true } : {name: 'TBD'};
        
        const finalMatch1 = { id: matchIdCounter++, p1: wbFinalWinner, p2: lbFinalWinner };
        
        // Se não houver chave dos perdedores, a final é uma chave simples
        if (losersBracket.length === 0) {
            finalMatch1.winnerDestination = `RANK:1st Place`;
            finalMatch1.loserDestination = `RANK:2nd Place`;
            grandFinal.push([finalMatch1]);
        } else {
            // Lógica completa da grande final com bracket reset
            const finalMatch2 = { id: matchIdCounter++, p1: { name: `Winner of M${finalMatch1.id}`, isPlaceholder: true }, p2: { name: `Loser of M${finalMatch1.id}`, isPlaceholder: true } };
            const championBox = { id: matchIdCounter++, isChampionBox: true, p1: { name: `Winner of M${finalMatch2.id}`, isPlaceholder: true }, p2: null };
            
            // Perdedor da primeira final fica em 2º (se não houver reset)
            finalMatch1.loserDestination = `RANK:2nd Place`;
            // Perdedor da segunda final (reset) fica em 2º
            finalMatch2.loserDestination = `RANK:2nd Place`;
            // Vencedor da segunda final (ou da caixa do campeão) fica em 1º
            finalMatch2.winnerDestination = `RANK:1st Place`;
            championBox.winnerDestination = `RANK:1st Place`; // Para o caso de avanço direto

            grandFinal.push([finalMatch1], [finalMatch2], [championBox]);
        }
    }
    
    return { type: 'double', winnersBracket, losersBracket, grandFinal, ranking };
}

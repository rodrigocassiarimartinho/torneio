// js/results.js - Versão com a lógica da Grande Final corrigida

import { getLoserDestinationRound } from './math.js';

// --- Funções Auxiliares (inalteradas) ---
function findMatchAndRoundIndex(rounds, matchId) {
    if (!rounds) return { match: null, round: null, roundIndex: -1 };
    for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        if (round) { for (const match of round) { if (match && match.id === matchId) return { match, round, roundIndex: i }; } }
    }
    return { match: null, round: null, roundIndex: -1 };
}

function findMatchInTournament(matchId, tournamentData) {
    if (!tournamentData.type) return { match: null };
    if (tournamentData.type === 'single') {
        const result = findMatchAndRoundIndex(tournamentData.rounds, matchId);
        return { ...result, bracket: tournamentData.rounds, bracketName: 'rounds' };
    } else if (tournamentData.type === 'double') {
        let result = findMatchAndRoundIndex(tournamentData.winnersBracket, matchId);
        if (result.match) return { ...result, bracket: tournamentData.winnersBracket, bracketName: 'winnersBracket' };
        result = findMatchAndRoundIndex(tournamentData.losersBracket, matchId);
        if (result.match) return { ...result, bracket: tournamentData.losersBracket, bracketName: 'losersBracket' };
        result = findMatchAndRoundIndex(tournamentData.grandFinal, matchId);
        if (result.match) return { ...result, bracket: tournamentData.grandFinal, bracketName: 'grandFinal' };
    }
    return { match: null };
}

function _determineWinner(match) {
    let winner = null, loser = null;
    const p1 = match.p1, p2 = match.p2;
    if (p2?.score === 'WO') { winner = p1; loser = p2; }
    else if (p1?.score === 'WO') { winner = p2; loser = p1; }
    else {
        const score1 = parseInt(p1?.score), score2 = parseInt(p2?.score);
        if (!isNaN(score1) && !isNaN(score2) && score1 !== score2) {
            if (score1 > score2) { winner = p1; loser = p2; }
            else { winner = p2; loser = p1; }
        }
    }
    return { winner, loser };
}

function _advancePlayer(player, placeholder, data) {
    const allBrackets = data.type === 'single' ? [data.rounds] : [data.winnersBracket, data.losersBracket, data.grandFinal];
    const playerData = { ...player };
    delete playerData.score;
    for (const bracket of allBrackets) {
        for (const round of (bracket || [])) {
            for (const match of (round || [])) {
                if (match.p1?.name === placeholder) { match.p1 = playerData; return; }
                if (match.p2?.name === placeholder) { match.p2 = playerData; return; }
            }
        }
    }
}

// --- Funções Principais Exportadas ---
export function resolveMatch(tournamentData, matchId, scores) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    const { match, bracketName, bracket, roundIndex } = findMatchInTournament(matchId, dataCopy);
    if (!match) return dataCopy;

    if (match.p1) match.p1.score = scores.p1;
    if (match.p2) match.p2.score = scores.p2;

    const { winner, loser } = _determineWinner(match);

    if (winner) {
        // **INÍCIO DA CORREÇÃO**
        // LÓGICA ESPECIAL PARA A GRANDE FINAL
        if (bracketName === 'grandFinal' && roundIndex === 0) { // Se for a PRIMEIRA final
            const winnerIsFromWinnersBracket = (winner.name === match.p1.name);
            if (winnerIsFromWinnersBracket) {
                // Cenário A: Vencedor da Vence
                const championBox = dataCopy.grandFinal[2][0];
                _advancePlayer(winner, championBox.p1.name, dataCopy); // Avança direto para a caixa do campeão
            } else {
                // Cenário B: Vencedor da Perde (Bracket Reset)
                _advancePlayer(winner, `Winner of M${match.id}`, dataCopy);
                _advancePlayer(loser, `Loser of M${match.id}`, dataCopy);
            }
        } else { // Lógica normal para as outras partidas
            _advancePlayer(winner, `Winner of M${match.id}`, dataCopy);
            if (dataCopy.type === 'double' && bracketName === 'winnersBracket' && loser) {
                _advancePlayer(loser, `Loser of M${match.id}`, dataCopy);
            }
        }
        // **FIM DA CORREÇÃO**
    }
    return dataCopy;
}

export function resolveInitialByes(tournamentData) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    const firstRound = (dataCopy.type === 'single') ? dataCopy.rounds[0] : dataCopy.winnersBracket[0];
    
    firstRound.forEach(match => {
        if (match && (match.p1?.isBye || match.p2?.isBye)) {
            if(match.p1?.isBye) match.p1.score = 'WO';
            if(match.p2?.isBye) match.p2.score = 'WO';
            dataCopy = resolveMatch(dataCopy, match.id, { p1: match.p1.score, p2: match.p2.score });
        }
    });
    return dataCopy;
}

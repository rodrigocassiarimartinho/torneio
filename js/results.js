// js/results.js - Versão Final com Lógica da Grande Final
import { getLoserDestinationRound } from './math.js';

// --- Funções Auxiliares Puras (internas) ---
function findMatchAndRoundIndex(rounds, matchId) {
    if (!rounds) return { match: null, round: null, roundIndex: -1 };
    for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        if (round) {
            for (const match of round) {
                if (match && match.id === matchId) { return { match, round, roundIndex: i }; }
            }
        }
    }
    return { match: null, round: null, roundIndex: -1 };
}

function findMatchInTournament(matchId, tournamentData) {
    const data = tournamentData.type === 'single' ? { rounds: tournamentData.rounds, type: 'single', ...tournamentData } : tournamentData;
    if (!data) return { match: null };

    if (data.rounds) {
        const result = findMatchAndRoundIndex(data.rounds, matchId);
        if (result.match) return { ...result, bracket: data.rounds, bracketName: 'rounds' };
    }
    if (data.winnersBracket) {
        let result = findMatchAndRoundIndex(data.winnersBracket, matchId);
        if (result.match) return { ...result, bracket: data.winnersBracket, bracketName: 'winnersBracket' };
    }
    if (data.losersBracket) {
        let result = findMatchAndRoundIndex(data.losersBracket, matchId);
        if (result.match) return { ...result, bracket: data.losersBracket, bracketName: 'losersBracket' };
    }
    if (data.grandFinal) {
        let result = findMatchAndRoundIndex(data.grandFinal, matchId);
        if (result.match) return { ...result, bracket: data.grandFinal, bracketName: 'grandFinal' };
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
    const { match, bracketName } = findMatchInTournament(matchId, dataCopy);
    if (!match) return dataCopy;

    if (match.p1) match.p1.score = scores.p1;
    if (match.p2) match.p2.score = scores.p2;

    const { winner, loser } = _determineWinner(match);

    if (winner) {
        // LÓGICA ESPECIAL PARA A GRANDE FINAL
        if (bracketName === 'grandFinal' && dataCopy.grandFinal[0].some(m => m.id === match.id)) {
            // Se o vencedor da primeira final veio da chave dos perdedores, ativa a segunda final
            if (winner.name === match.p2.name) {
                _advancePlayer(winner, `Winner of M${match.id}`, dataCopy);
                _advancePlayer(loser, `Loser of M${match.id}`, dataCopy);
            } else { // Se o vencedor veio da chave dos vencedores, ele é o campeão
                _advancePlayer(winner, `Winner of M${match.id}`, dataCopy);
            }
        } else { // Lógica normal para as outras partidas
            _advancePlayer(winner, `Winner of M${match.id}`, dataCopy);
            if (dataCopy.type === 'double' && bracketName === 'winnersBracket' && loser) {
                _advancePlayer(loser, `Loser of M${match.id}`, dataCopy);
            }
        }
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

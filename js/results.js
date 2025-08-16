// js/results.js
import { getLoserDestinationRound } from './math.js';

// --- Funções Auxiliares Puras (internas a este módulo) ---
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
    if (p1?.isBye) { winner = p2; loser = p1; }
    else if (p2?.isBye) { winner = p1; loser = p2; }
    else if (p1?.score === 'WO') { winner = p2; loser = p1; }
    else if (p2?.score === 'WO') { winner = p1; loser = p2; }
    else {
        const score1 = parseInt(p1?.score), score2 = parseInt(p2?.score);
        if (!isNaN(score1) && !isNaN(score2)) {
            if (score1 > score2) { winner = p1; loser = p2; }
            else if (score2 > score1) { winner = p2; loser = p1; }
        }
    }
    return { winner, loser };
}

function _advanceWinner(winner, matchInfo, data) {
    const { match, bracket, roundIndex } = matchInfo;
    const matchIndexInRound = bracket[roundIndex].findIndex(m => m && m.id === match.id);
    const winnerData = { name: winner.name, seed: winner.seed }; // Clone limpo
    const nextRound = bracket[roundIndex + 1];
    if (nextRound) {
        const nextMatch = nextRound[Math.floor(matchIndexInRound / 2)];
        if (nextMatch) {
            if (matchIndexInRound % 2 === 0) { nextMatch.p1 = winnerData; }
            else { nextMatch.p2 = winnerData; }
        }
    }
}

function _dropLoser(loser, matchInfo, data) {
    const { match, roundIndex } = matchInfo;
    const vRound = roundIndex + 1;
    const destPRound = getLoserDestinationRound(vRound);
    const destRound = data.losersBracket[destPRound - 1];
    if(destRound) {
        const loserData = { name: loser.name, seed: loser.seed }; // Clone limpo
        const placeholderName = `Loser of M${match.id}`;
        for(const destMatch of destRound) {
            if (destMatch.p1?.name === placeholderName) { destMatch.p1 = loserData; break; }
            if (destMatch.p2?.name === placeholderName) { destMatch.p2 = loserData; break; }
        }
    }
}

// --- Funções Principais Exportadas ---
export function resolveMatch(tournamentData, matchId, scores) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    const matchInfo = findMatchInTournament(matchId, dataCopy);
    if (!matchInfo.match) return dataCopy;

    if (matchInfo.match.p1) matchInfo.match.p1.score = scores.p1;
    if (matchInfo.match.p2) matchInfo.match.p2.score = scores.p2;

    const { winner, loser } = _determineWinner(matchInfo.match);

    if (winner) {
        _advanceWinner(winner, matchInfo, dataCopy);
        if (dataCopy.type === 'double' && matchInfo.bracketName === 'winnersBracket' && loser) {
            _dropLoser(loser, matchInfo, dataCopy);
        }
    }
    return dataCopy;
}

export function resolveInitialByes(tournamentData) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    const firstRound = (dataCopy.type === 'single') ? dataCopy.rounds[0] : dataCopy.winnersBracket[0];
    
    firstRound.forEach(match => {
        if (match && (match.p1?.isBye || match.p2?.isBye)) {
            const matchInfo = findMatchInTournament(match.id, dataCopy);
            const { winner, loser } = _determineWinner(match);

            if(winner) {
                _advanceWinner(winner, matchInfo, dataCopy);
                if (dataCopy.type === 'double' && loser?.isBye) {
                    _dropLoser(loser, matchInfo, dataCopy);
                }
            }
        }
    });
    return dataCopy;
}

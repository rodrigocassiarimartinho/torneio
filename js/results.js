// js/results.js - Versão com a lógica de placares e busca corrigida

import { getLoserDestinationRound } from './math.js';

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

function _advanceWinner(winner, matchInfo, data) {
    const { match, bracket, roundIndex } = matchInfo;
    const matchIndexInRound = bracket[roundIndex].findIndex(m => m && m.id === match.id);
    const winnerData = { ...winner };
    delete winnerData.score;
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
        const loserData = { ...loser };
        delete loserData.score;
        const placeholderName = `Loser of M${match.id}`;
        for(const destMatch of destRound) {
            if (destMatch.p1?.name === placeholderName) { destMatch.p1 = loserData; break; }
            if (destMatch.p2?.name === placeholderName) { destMatch.p2 = loserData; break; }
        }
    }
}

// **A LÓGICA DO SEU ALGORITMO**
function _defineAutomaticScores(data) {
    let changed = false;
    const allBrackets = data.type === 'single' ? [data.rounds] : [data.winnersBracket, data.losersBracket];
    allBrackets.forEach(bracket => {
        (bracket || []).forEach(round => {
            (round || []).forEach(match => {
                if (match && (!match.p1?.score && !match.p2?.score)) {
                    const p1 = match.p1;
                    const p2 = match.p2;
                    if (p1 && p2) {
                        if (p1.isBye && p2.isBye) { match.p2.score = 'WO'; changed = true; }
                        else if (p1.isBye) { match.p1.score = 'WO'; changed = true; }
                        else if (p2.isBye) { match.p2.score = 'WO'; changed = true; }
                    }
                }
            });
        });
    });
    return changed;
}

function _calculateResultsAndAdvancePlayers(data) {
    let changed = false;
    const allBrackets = data.type === 'single' ? [data.rounds] : [data.winnersBracket, data.losersBracket, data.grandFinal];
    allBrackets.forEach(bracket => {
        (bracket || []).forEach((round, roundIndex) => {
            (round || []).forEach(match => {
                if (match && (match.p1?.score || match.p2?.score) && !match.winner) {
                    const { winner, loser } = _determineWinner(match);
                    if (winner) {
                        match.winner = winner.name;
                        const matchInfo = findMatchInTournament(match.id, data);
                        _advanceWinner(winner, matchInfo, data);
                        if (data.type === 'double' && matchInfo.bracketName === 'winnersBracket' && loser) {
                            _dropLoser(loser, matchInfo, data);
                        }
                        changed = true;
                    }
                }
            });
        });
    });
    return changed;
}

function _runResolutionLoop(tournamentData) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    let changedInLoop;
    do {
        const scoresChanged = _defineAutomaticScores(dataCopy);
        const resultsChanged = _calculateResultsAndAdvancePlayers(dataCopy);
        changedInLoop = scoresChanged || resultsChanged;
    } while (changedInLoop);
    return dataCopy;
}

export function resolveMatch(tournamentData, matchId, scores) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    const matchInfo = findMatchInTournament(matchId, dataCopy);
    if (!matchInfo.match) return dataCopy;

    if (matchInfo.match.p1) matchInfo.match.p1.score = scores.p1;
    if (matchInfo.match.p2) matchInfo.match.p2.score = scores.p2;

    return _runResolutionLoop(dataCopy);
}

export function resolveInitialState(tournamentData) {
    return _runResolutionLoop(tournamentData);
}

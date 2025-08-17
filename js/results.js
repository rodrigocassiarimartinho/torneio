// js/results.js - Versão com a lógica do "Carteiro Cego"

import { getLoserDestinationRound } from './math.js';

function findMatchInTournament(matchId, tournamentData) {
    const allBrackets = tournamentData.type === 'single'
        ? [tournamentData.rounds]
        : [tournamentData.winnersBracket, tournamentData.losersBracket, tournamentData.grandFinal];
    
    for (const bracket of allBrackets) {
        if (bracket) {
            for (const round of bracket) {
                if (round) {
                    const match = round.find(m => m && m.id === matchId);
                    if (match) return { match, bracket, bracketName: '' }; // Nome do bracket não é crucial aqui
                }
            }
        }
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
        if (!isNaN(score1) && !isNaN(score2) && score1 !== score2) {
            if (score1 > score2) { winner = p1; loser = p2; }
            else { winner = p2; loser = p1; }
        }
    }
    return { winner, loser };
}

// **INÍCIO DA CORREÇÃO - LÓGICA DO "CARTEIRO CEGO"**
function _advanceWinner(winner, sourceMatch, data) {
    const placeholderName = `Winner of M${sourceMatch.id}`;
    const allBrackets = data.type === 'single' ? [data.rounds] : [data.winnersBracket, data.losersBracket, data.grandFinal];
    const winnerData = { ...winner };
    delete winnerData.score;

    for (const bracket of allBrackets) {
        for (const round of (bracket || [])) {
            for (const match of (round || [])) {
                if (match.p1?.name === placeholderName) {
                    match.p1 = winnerData;
                    return; // Encontrou e entregou, termina a busca
                }
                if (match.p2?.name === placeholderName) {
                    match.p2 = winnerData;
                    return;
                }
            }
        }
    }
}

function _dropLoser(loser, sourceMatch, data) {
    const placeholderName = `Loser of M${sourceMatch.id}`;
    const allBrackets = [data.losersBracket]; // Perdedores só caem para a chave dos perdedores
    const loserData = { ...loser };
    delete loserData.score;
    
    for (const bracket of allBrackets) {
        for (const round of (bracket || [])) {
            for (const match of (round || [])) {
                if (match.p1?.name === placeholderName) {
                    match.p1 = loserData;
                    return;
                }
                if (match.p2?.name === placeholderName) {
                    match.p2 = loserData;
                    return;
                }
            }
        }
    }
}
// **FIM DA CORREÇÃO**


export function resolveMatch(tournamentData, matchId, scores) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    const { match } = findMatchInTournament(matchId, dataCopy);
    if (!match) return dataCopy;

    if (match.p1) match.p1.score = scores.p1;
    if (match.p2) match.p2.score = scores.p2;

    const { winner, loser } = _determineWinner(match);

    if (winner) {
        const bracketName = findMatchInTournament(matchId, dataCopy).bracketName;
        _advanceWinner(winner, match, dataCopy);
        if (dataCopy.type === 'double' && bracketName === 'winnersBracket' && loser) {
            _dropLoser(loser, match, dataCopy);
        }
    }
    return dataCopy;
}

export function resolveInitialByes(tournamentData) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    const firstRound = (dataCopy.type === 'single') ? dataCopy.rounds[0] : dataCopy.winnersBracket[0];
    
    firstRound.forEach(match => {
        if (match && (match.p1?.isBye || match.p2?.isBye)) {
            const { winner, loser } = _determineWinner(match);
            if(winner) {
                _advanceWinner(winner, match, dataCopy);
                if (dataCopy.type === 'double' && loser) {
                    _dropLoser(loser, match, dataCopy);
                }
            }
        }
    });
    return dataCopy;
}

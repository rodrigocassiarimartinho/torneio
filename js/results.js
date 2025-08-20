// js/results.js - Versão com persistência de histórico Undo/Redo

// --- ESTADO INTERNO DO MÓDULO ---
let sessionState = {
    currentState: {},
    undoHistory: [],
    redoHistory: []
};

// --- FUNÇÕES "PRIVADAS" (AUXILIARES) ---

function _findMatchInTournament(matchId, tournamentData) {
    if (tournamentData.type === 'single') {
        for (const round of (tournamentData.rounds || [])) {
            const match = round.find(m => m && m.id === matchId);
            if (match) return { match, bracketName: 'rounds' };
        }
    } else {
        if (tournamentData.winnersBracket) {
            for (const round of tournamentData.winnersBracket) {
                const match = round.find(m => m && m.id === matchId);
                if (match) return { match, bracketName: 'winnersBracket' };
            }
        }
        if (tournamentData.losersBracket) {
            for (const round of tournamentData.losersBracket) {
                const match = round.find(m => m && m.id === matchId);
                if (match) return { match, bracketName: 'losersBracket' };
            }
        }
        if (tournamentData.grandFinal) {
            for (const round of tournamentData.grandFinal) {
                const match = round.find(m => m && m.id === matchId);
                if (match) return { match, bracketName: 'grandFinal' };
            }
        }
    }
    return { match: null, bracketName: null };
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
    const playerData = { ...player };
    delete playerData.score;

    if (placeholder && placeholder.startsWith('RANK:')) {
        const placement = placeholder.substring(5);
        if (!data.ranking) data.ranking = {};
        if (!data.ranking[placement]) data.ranking[placement] = [];
        if (!data.ranking[placement].some(p => p.name === playerData.name)) {
            data.ranking[placement].push(playerData);
        }
        return;
    }

    const allBrackets = data.type === 'single' ? [data.rounds] : [data.winnersBracket, data.losersBracket, data.grandFinal];
    for (const bracket of (allBrackets || [])) {
        for (const round of (bracket || [])) {
            for (const match of (round || [])) {
                if (match.p1?.isPlaceholder && match.p1?.name === placeholder) { 
                    match.p1 = playerData; 
                    return; 
                }
                if (match.p2?.isPlaceholder && match.p2?.name === placeholder) { 
                    match.p2 = playerData; 
                    return; 
                }
            }
        }
    }
}

function _processMatchResult(data, match, bracketName) {
    if (match.isChampionBox) {
        if (match.p1 && !match.p1.isPlaceholder) {
            _advancePlayer(match.p1, match.winnerDestination, data);
            match.isProcessed = true;
            return true;
        }
        return false;
    }

    const { winner, loser } = _determineWinner(match);

    if (winner) {
        if (bracketName === 'grandFinal' && data.grandFinal && data.grandFinal.length > 1) {
            const finalMatch1 = data.grandFinal[0][0];
            const finalMatch2 = data.grandFinal[1] ? data.grandFinal[1][0] : null;

            if (match.id === finalMatch1.id) {
                const winnerIsFromWinnersBracket = (winner.name === match.p1.name);
                if (winnerIsFromWinnersBracket) {
                    _advancePlayer(winner, 'Tournament Champion', data);
                    if (loser) _advancePlayer(loser, 'RANK:2º', data);
                } else {
                    _advancePlayer(winner, `Winner of M${match.id}`, data);
                    _advancePlayer(loser, `Loser of M${match.id}`, data);
                }
            } else if (finalMatch2 && match.id === finalMatch2.id) {
                _advancePlayer(winner, 'Tournament Champion', data);
                if (loser) _advancePlayer(loser, 'RANK:2º', data);
            }
        } else {
            const winnerDestination = match.winnerDestination || `Winner of M${match.id}`;
            _advancePlayer(winner, winnerDestination, data);
       
            if (loser && !loser.isBye) {
                const loserDestination = match.loserDestination || (data.type === 'double' && bracketName === 'winnersBracket' ? `Loser of M${match.id}` : null);
                if(loserDestination) {
                    _advancePlayer(loser, loserDestination, data);
                }
            }
        }
        
        match.isProcessed = true;
        return true;
    }
    return false;
}

function _stabilizeBracket(data) {
    if (!data || !data.type) return {};
    let dataCopy = JSON.parse(JSON.stringify(data));
    let changesMade;
    do {
        changesMade = false;
        const allBracketsInfo = [
            { name: 'winnersBracket', data: dataCopy.winnersBracket },
            { name: 'losersBracket', data: dataCopy.losersBracket },
            { name: 'grandFinal', data: dataCopy.grandFinal },
            { name: 'rounds', data: dataCopy.rounds }
        ];

        for (const bracketInfo of allBracketsInfo) {
            for (const round of (bracketInfo.data || [])) {
                for (const match of (round || [])) {
                    if (!match || (match.p1 && match.p1.score !== undefined) || (match.p2 && match.p2.score !== undefined)) continue;
                    
                    const p1_isBye = match.p1 && match.p1.isBye;
                    const p2_isBye = match.p2 && match.p2.isBye;
                    const p1_exists = match.p1 && !match.p1.isBye && !match.p1.isPlaceholder;
                    const p2_exists = match.p2 && !match.p2.isBye && !match.p2.isPlaceholder;

                    if (p1_exists && p2_isBye) { match.p2.score = 'WO'; changesMade = true; } 
                    else if (p2_exists && p1_isBye) { match.p1.score = 'WO'; changesMade = true; }
                    else if (p1_isBye && p2_isBye) { match.p2.score = 'WO'; changesMade = true; }
                }
            }
        }

        for (const bracketInfo of allBracketsInfo) {
            for (const round of (bracketInfo.data || [])) {
                for (const match of (round || [])) {
                    if (!match || match.isProcessed) continue;
                    
                    const hasScore = (match.p1 && match.p1.score !== undefined) || (match.p2 && match.p2.score !== undefined);
                    const isProcessableChampionBox = match.isChampionBox && match.p1 && !match.p1.isPlaceholder;
                    
                    if (hasScore || isProcessableChampionBox) { 
                        if (_processMatchResult(dataCopy, match, bracketInfo.name)) { 
                            changesMade = true; 
                        } 
                    }
                }
            }
        }
    } while (changesMade);
    return dataCopy;
}


// --- FUNÇÕES "PÚBLICAS" EXPORTADAS ---

export function initializeBracket(data) {
    if (data && data.currentState) {
        sessionState = data;
    } else {
        sessionState = {
            currentState: _stabilizeBracket(data),
            undoHistory: [],
            redoHistory: []
        };
    }
}

export function updateScore(matchId, playerSlot, newScore) {
    const { match } = _findMatchInTournament(matchId, sessionState.currentState);
    if (!match) return;
    
    sessionState.undoHistory.push(JSON.parse(JSON.stringify(sessionState.currentState)));
    sessionState.redoHistory = [];
    
    if (!match[playerSlot]) match[playerSlot] = {};
    match[playerSlot].score = newScore;
    match[playerSlot].isProcessed = false; 

    sessionState.currentState = _stabilizeBracket(sessionState.currentState);
}

export function undo() {
    if (sessionState.undoHistory.length > 0) {
        sessionState.redoHistory.push(JSON.parse(JSON.stringify(sessionState.currentState)));
        sessionState.currentState = sessionState.undoHistory.pop();
    }
}

export function redo() {
    if (sessionState.redoHistory.length > 0) {
        sessionState.undoHistory.push(JSON.parse(JSON.stringify(sessionState.currentState)));
        sessionState.currentState = sessionState.redoHistory.pop();
    }
}

export function getCurrentSessionState() {
    return JSON.parse(JSON.stringify(sessionState));
}

export function getHistoryState() {
    return {
        canUndo: sessionState.undoHistory.length > 0,
        canRedo: sessionState.redoHistory.length > 0
    };
}

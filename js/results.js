// js/results.js - Versão com _advancePlayer e _processMatchResult atualizados

let currentTournamentData = {};
let undoHistory = [];
let redoHistory = [];

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

    // Se o placeholder começa com 'RANK:', é uma classificação
    if (placeholder && placeholder.startsWith('RANK:')) {
        const placement = placeholder.substring(5); // Pega o texto "3rd Place", etc.
        if (!data.ranking) data.ranking = {};
        if (!data.ranking[placement]) data.ranking[placement] = [];

        // Adiciona o jogador se ele ainda não estiver lá
        if (!data.ranking[placement].some(p => p.name === playerData.name)) {
            data.ranking[placement].push(playerData);
        }
        return;
    }

    // Lógica original para avançar para a próxima partida
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
    // Para a caixa do campeão, o "vencedor" é apenas o jogador p1
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
        const winnerDestination = match.winnerDestination || `Winner of M${match.id}`;
        _advancePlayer(winner, winnerDestination, data);
       
        if (loser && !loser.isBye) {
            const loserDestination = match.loserDestination || (data.type === 'double' && bracketName === 'winnersBracket' ? `Loser of M${match.id}` : null);
            if(loserDestination) {
                _advancePlayer(loser, loserDestination, data);
            }
        }
        
        match.isProcessed = true;
        return true;
    }
    return false;
}

function _stabilizeBracket(data) {
    if (!data || !data.type) return {}; // Retorna objeto vazio se não houver dados
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
                    if (hasScore) { if (_processMatchResult(dataCopy, match, bracketInfo.name)) { changesMade = true; } }
                }
            }
        }
    } while (changesMade);
    return dataCopy;
}

export function initializeBracket(populatedBracket) {
    undoHistory = [];
    redoHistory = [];
    currentTournamentData = _stabilizeBracket(populatedBracket);
}

export function updateScore(matchId, playerSlot, newScore) {
    const { match } = _findMatchInTournament(matchId, currentTournamentData);
    if (!match) return;
    
    const isFirstScoreInteraction = !(match.p1 && match.p1.score !== undefined) && !(match.p2 && match.p2.score !== undefined);
    if (isFirstScoreInteraction) {
        undoHistory.push(JSON.parse(JSON.stringify(currentTournamentData)));
        redoHistory = [];
    }

    if (!match[playerSlot]) match[playerSlot] = {};
    match[playerSlot].score = newScore;
    match.isProcessed = false; 

    currentTournamentData = _stabilizeBracket(currentTournamentData);
}

export function undo() {
    if (undoHistory.length > 0) {
        redoHistory.push(JSON.parse(JSON.stringify(currentTournamentData)));
        currentTournamentData = undoHistory.pop();
    }
}

export function redo() {
    if (redoHistory.length > 0) {
        undoHistory.push(JSON.parse(JSON.stringify(currentTournamentData)));
        currentTournamentData = redoHistory.pop();
    }
}

export function getCurrentData() {
    return JSON.parse(JSON.stringify(currentTournamentData));
}

export function getHistoryState() {
    return {
        canUndo: undoHistory.length > 0,
        canRedo: redoHistory.length > 0
    };
}

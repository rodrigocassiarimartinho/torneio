// js/results.js - Versão Final Limpa e Comentada
// Este módulo funciona como um "Motor de Torneio Stateful", gerenciando internamente
// todo o estado da chave, incluindo o histórico para undo/redo.

// --- ESTADO INTERNO DO MÓDULO ---
let currentTournamentData = {};
let undoHistory = [];
let redoHistory = [];

// --- FUNÇÕES "PRIVADAS" (AUXILIARES) ---

/**
 * Encontra uma partida pelo ID dentro de toda a estrutura do torneio.
 * @returns {object} Um objeto contendo a partida e o nome do bracket onde ela foi encontrada.
 */
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

/**
 * Determina o vencedor e o perdedor de uma partida com base nos placares.
 * @returns {object} Objeto com as chaves 'winner' e 'loser'.
 */
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

/**
 * Avança um jogador para a próxima vaga que o espera (identificada por um placeholder).
 */
function _advancePlayer(player, placeholder, data) {
    const allBrackets = data.type === 'single' ? [data.rounds] : [data.winnersBracket, data.losersBracket, data.grandFinal];
    const playerData = { ...player };
    delete playerData.score;
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

/**
 * Processa o resultado de uma única partida, avançando o vencedor e, se aplicável, o perdedor.
 */
function _processMatchResult(data, match, bracketName) {
    const { winner, loser } = _determineWinner(match);
    if (winner) {
        if (bracketName === 'grandFinal' && match.id === data.grandFinal[0][0].id) { 
            const winnerIsFromWinnersBracket = (winner.name === match.p1.name);
            if (winnerIsFromWinnersBracket) {
                const championBox = data.grandFinal[2][0];
                _advancePlayer(winner, championBox.p1.name, data);
            } else {
                _advancePlayer(winner, `Winner of M${match.id}`, data);
                _advancePlayer(loser, `Loser of M${match.id}`, data);
            }
        } else {
            _advancePlayer(winner, `Winner of M${match.id}`, data);
            if (data.type === 'double' && bracketName === 'winnersBracket' && loser) {
                _advancePlayer(loser, `Loser of M${match.id}`, data);
            }
        }
        match.isProcessed = true;
        return true;
    }
    return false;
}

/**
 * O coração do motor: Roda em loop até que nenhuma nova alteração possa ser feita automaticamente (WOs ou avanços).
 * @returns {object} O novo objeto de torneio estável.
 */
function _stabilizeBracket(data) {
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

        // Fase 1: Atribui placares automáticos para partidas com BYE
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
                }
            }
        }

        // Fase 2: Processa os resultados de partidas que já têm placar
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


// --- FUNÇÕES "PÚBLICAS" EXPORTADAS (A INTERFACE DO MÓDULO) ---

/**
 * Inicializa um novo torneio, limpando o estado anterior.
 */
export function initializeBracket(populatedBracket) {
    undoHistory = [];
    redoHistory = [];
    currentTournamentData = _stabilizeBracket(populatedBracket);
}

/**
 * Ponto de entrada para uma atualização de placar feita pelo usuário.
 */
export function updateScore(matchId, playerSlot, newScore) {
    const { match } = _findMatchInTournament(matchId, currentTournamentData);
    if (!match) return;
    
    // Salva no histórico apenas na primeira interação com uma partida não pontuada
    const isFirstScoreInteraction = !(match.p1 && match.p1.score !== undefined) && !(match.p2 && match.p2.score !== undefined);
    if (isFirstScoreInteraction) {
        undoHistory.push(JSON.parse(JSON.stringify(currentTournamentData)));
        redoHistory = []; // Limpa o "refazer" pois uma nova linha do tempo foi criada
    }

    if (!match[playerSlot]) match[playerSlot] = {};
    match[playerSlot].score = newScore;
    match.isProcessed = false; 

    currentTournamentData = _stabilizeBracket(currentTournamentData);
}

/**
 * Reverte o estado do torneio para o ponto anterior.
 */
export function undo() {
    if (undoHistory.length > 0) {
        redoHistory.push(JSON.parse(JSON.stringify(currentTournamentData)));
        currentTournamentData = undoHistory.pop();
    }
}

/**
 * Avança o estado do torneio para um ponto que foi desfeito.
 */
export function redo() {
    if (redoHistory.length > 0) {
        undoHistory.push(JSON.parse(JSON.stringify(currentTournamentData)));
        currentTournamentData = redoHistory.pop();
    }
}

/**
 * Retorna uma cópia segura do estado atual do torneio.
 */
export function getCurrentData() {
    return JSON.parse(JSON.stringify(currentTournamentData));
}

/**
 * Retorna o estado dos históricos para a UI poder habilitar/desabilitar botões.
 */
export function getHistoryState() {
    return {
        canUndo: undoHistory.length > 0,
        canRedo: redoHistory.length > 0
    };
}

// js/results.js - Versão com o novo motor de estabilização

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
    delete playerData.score; // Limpa o placar antes de avançar
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

// --- Motor de Lógica Principal (NOVA ARQUITETURA) ---

// Função interna que avança um jogador se a partida tiver um vencedor
function processMatchResult(data, match, bracketName) {
    const { winner, loser } = _determineWinner(match);
    if (winner) {
        // Lógica Especial para a Grande Final
        if (bracketName === 'grandFinal' && match.id === data.grandFinal[0][0].id) { 
            const winnerIsFromWinnersBracket = (winner.name === match.p1.name);
            if (winnerIsFromWinnersBracket) {
                const championBox = data.grandFinal[2][0];
                _advancePlayer(winner, championBox.p1.name, data);
            } else {
                _advancePlayer(winner, `Winner of M${match.id}`, data);
                _advancePlayer(loser, `Loser of M${match.id}`, data);
            }
        } else { // Lógica normal para as outras partidas
            _advancePlayer(winner, `Winner of M${match.id}`, data);
            if (data.type === 'double' && bracketName === 'winnersBracket' && loser) {
                _advancePlayer(loser, `Loser of M${match.id}`, data);
            }
        }
        match.isProcessed = true; // Marca a partida como processada
        return true; // Indica que uma mudança ocorreu
    }
    return false; // Nenhuma mudança
}


export function stabilizeBracket(tournamentData) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    let changesMade;

    do {
        changesMade = false;
        const allBracketsInfo = [
            { name: 'winnersBracket', data: dataCopy.winnersBracket },
            { name: 'losersBracket', data: dataCopy.losersBracket },
            { name: 'grandFinal', data: dataCopy.grandFinal },
            { name: 'rounds', data: dataCopy.rounds } // Para eliminação simples
        ];

        // 1. FASE DE PLACAR (Atribui WOs automáticos)
        for (const bracketInfo of allBracketsInfo) {
            for (const round of (bracketInfo.data || [])) {
                for (const match of (round || [])) {
                    if (!match || (match.p1 && match.p1.score !== undefined) || (match.p2 && match.p2.score !== undefined)) continue;

                    const p1_isBye = match.p1 && match.p1.isBye;
                    const p2_isBye = match.p2 && match.p2.isBye;
                    const p1_exists = match.p1 && !match.p1.isBye && !match.p1.isPlaceholder;
                    const p2_exists = match.p2 && !match.p2.isBye && !match.p2.isPlaceholder;

                    if (p1_exists && p2_isBye) {
                        match.p2.score = 'WO';
                        changesMade = true;
                    } else if (p2_exists && p1_isBye) {
                        match.p1.score = 'WO';
                        changesMade = true;
                    }
                }
            }
        }

        // 2. FASE DE RESULTADO (Avança jogadores de partidas com placar)
        for (const bracketInfo of allBracketsInfo) {
            for (const round of (bracketInfo.data || [])) {
                for (const match of (round || [])) {
                    if (!match || match.isProcessed) continue;
                    const hasScore = (match.p1 && match.p1.score !== undefined) || (match.p2 && match.p2.score !== undefined);
                    if (hasScore) {
                        if (processMatchResult(dataCopy, match, bracketInfo.name)) {
                            changesMade = true;
                        }
                    }
                }
            }
        }

    } while (changesMade);

    return dataCopy;
}

export function updateScoreAndStabilize(tournamentData, matchId, playerSlot, newScore) {
    let dataCopy = JSON.parse(JSON.stringify(tournamentData));
    const { match } = findMatchInTournament(matchId, dataCopy);

    if (!match) return dataCopy;

    // 1. Escreve o placar vindo do usuário
    if (!match[playerSlot]) match[playerSlot] = {};
    match[playerSlot].score = newScore;
    match.isProcessed = false; // Desmarca para que o motor possa processá-lo

    // 2. Aciona o motor de estabilização
    return stabilizeBracket(dataCopy);
}

// js/interactivity.js - Versão com a sua arquitetura de interatividade final

import { resolveMatch } from './results.js';

// Função auxiliar para encontrar a partida na estrutura de dados
function findMatchInTournament(matchId, tournamentData) {
    const allBrackets = tournamentData.type === 'single'
        ? [tournamentData.rounds]
        : [tournamentData.winnersBracket, tournamentData.losersBracket, tournamentData.grandFinal];
    
    for (const bracket of allBrackets) {
        if (bracket) {
            for (const round of bracket) {
                if (round) {
                    const match = round.find(m => m && m.id === matchId);
                    if (match) return match;
                }
            }
        }
    }
    return null;
}

// Função auxiliar para verificar se uma partida tem um resultado final
function isMatchComplete(match) {
    if (!match || !match.p1 || !match.p2) return false;
    if (match.p1.score === 'WO' || match.p2.score === 'WO') return true;
    
    const score1 = parseInt(match.p1.score);
    const score2 = parseInt(match.p2.score);
    
    return !isNaN(score1) && !isNaN(score2);
}

export function setupInteractivity(getTournamentData, setTournamentData, fullRender) {
    const appContainer = document.getElementById('app-container');

    if (window.scoreUpdateHandler) {
        appContainer.removeEventListener('change', window.scoreUpdateHandler);
    }

    window.scoreUpdateHandler = (event) => {
        if (!event.target.classList.contains('score-select')) return;

        const selectEl = event.target;
        const matchId = parseInt(selectEl.dataset.matchId);
        const playerSlot = selectEl.dataset.playerSlot;
        const newScore = selectEl.value;
        const matchEl = selectEl.closest('.match');

        let currentData = getTournamentData();
        const targetMatch = findMatchInTournament(matchId, currentData);
        if (!targetMatch) return;

        // 1. Atualiza o placar na estrutura de dados
        if (!targetMatch[playerSlot]) targetMatch[playerSlot] = {};
        targetMatch[playerSlot].score = newScore;
        
        // 2. Chama o render para exibir a mudança de placar
        fullRender();
        
        // 3. Verifica se a partida está completa
        if (isMatchComplete(targetMatch)) {
            // 4. Se estiver completa, chama o "motor" de resultados
            const scores = { p1: targetMatch.p1.score, p2: targetMatch.p2.score };
            const newData = resolveMatch(currentData, matchId, scores);
            setTournamentData(newData);
            
            // 5. Chama o render novamente com o estado atualizado
            setTimeout(() => fullRender(), 50); // Pequeno delay para garantir que o primeiro render termine
        }
    };

    appContainer.addEventListener('change', window.scoreUpdateHandler);
}

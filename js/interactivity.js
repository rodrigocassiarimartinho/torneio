// js/interactivity.js - Versão que salva o estado para o Undo

import { updateScoreAndStabilize } from './results.js';

// A função agora recebe 'undoHistory' como um novo parâmetro
export function setupInteractivity(getTournamentData, setTournamentData, fullRender, undoHistory) {
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

        const currentData = getTournamentData();
        
        // --- INÍCIO DA MUDANÇA ---
        // 1. Salva uma cópia do estado ATUAL no histórico ANTES de qualquer mudança
        undoHistory.push(JSON.parse(JSON.stringify(currentData)));
        
        // 2. Habilita o botão de Undo
        document.getElementById('undo-btn').disabled = false;
        // --- FIM DA MUDANÇA ---

        const newData = updateScoreAndStabilize(currentData, matchId, playerSlot, newScore);
        setTournamentData(newData);
        fullRender();
    };

    appContainer.addEventListener('change', window.scoreUpdateHandler);
}

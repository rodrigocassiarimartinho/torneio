// js/interactivity.js - Versão Mensageiro Puro Final

import { updateScore } from './results.js';

export function setupInteractivity(fullRender) {
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

        // 1. Informa o motor sobre a mudança
        updateScore(matchId, playerSlot, newScore);
        
        // 2. Pede para a UI ser redesenhada com o novo estado
        fullRender();
    };

    appContainer.addEventListener('change', window.scoreUpdateHandler);
}

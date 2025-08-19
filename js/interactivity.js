// js/interactivity.js - Versão que salva o estado para o Undo e com log de depuração

import { updateScoreAndStabilize } from './results.js';

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
        
        const stateToSave = JSON.parse(JSON.stringify(currentData));
        console.log("Salvando estado no histórico:", stateToSave); // DEBUG
        undoHistory.push(stateToSave);
        
        document.getElementById('undo-btn').disabled = false;

        const newData = updateScoreAndStabilize(currentData, matchId, playerSlot, newScore);
        setTournamentData(newData);
        fullRender();
    };

    appContainer.addEventListener('change', window.scoreUpdateHandler);
}

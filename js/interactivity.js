// js/interactivity.js - Versão Final Limpa e Comentada
// Este módulo tem um único papel: capturar os eventos de 'change' nos
// seletores de placar e notificar o motor de resultados, sem conter
// nenhuma lógica de negócio. É um "mensageiro" puro.

import { updateScore } from './results.js';

export function setupInteractivity(fullRender) {
    const appContainer = document.getElementById('app-container');

    // Remove o listener antigo para evitar duplicatas em caso de re-chamada
    if (window.scoreUpdateHandler) {
        appContainer.removeEventListener('change', window.scoreUpdateHandler);
    }

    window.scoreUpdateHandler = (event) => {
        // Filtra eventos que não sejam dos seletores de placar
        if (!event.target.classList.contains('score-select')) return;

        // Coleta os dados da interação do usuário
        const selectEl = event.target;
        const matchId = parseInt(selectEl.dataset.matchId);
        const playerSlot = selectEl.dataset.playerSlot;
        const newScore = selectEl.value;

        // 1. Informa o motor sobre a mudança
        updateScore(matchId, playerSlot, newScore);
        
        // 2. Pede para a UI ser redesenhada com o novo estado
        fullRender();
    };

    // Anexa o listener de eventos ao contêiner principal
    appContainer.addEventListener('change', window.scoreUpdateHandler);
}

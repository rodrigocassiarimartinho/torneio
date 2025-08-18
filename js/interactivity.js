// js/interactivity.js - Versão "Mensageiro"

import { updateScoreAndStabilize } from './results.js'; // <<-- MUDANÇA AQUI

export function setupInteractivity(getTournamentData, setTournamentData, fullRender) {
    const appContainer = document.getElementById('app-container');

    // Remove o listener antigo para evitar duplicatas em caso de re-chamada
    if (window.scoreUpdateHandler) {
        appContainer.removeEventListener('change', window.scoreUpdateHandler);
    }

    // **INÍCIO DA MUDANÇA**
    // O handler agora é apenas um mensageiro
    window.scoreUpdateHandler = (event) => {
        if (!event.target.classList.contains('score-select')) return;

        const selectEl = event.target;
        const matchId = parseInt(selectEl.dataset.matchId);
        const playerSlot = selectEl.dataset.playerSlot;
        const newScore = selectEl.value;

        // 1. Pega os dados atuais
        const currentData = getTournamentData();
        
        // 2. Envia a ação do usuário para o motor e recebe o novo estado estável
        const newData = updateScoreAndStabilize(currentData, matchId, playerSlot, newScore);

        // 3. Atualiza o estado global com os novos dados
        setTournamentData(newData);
        
        // 4. Renderiza a chave inteira com o estado final
        fullRender();
    };
    // **FIM DA MUDANÇA**

    appContainer.addEventListener('change', window.scoreUpdateHandler);
}

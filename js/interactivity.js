// js/interactivity.js
import { resolveMatch } from './results.js';

// A função que será chamada pelo "Maestro" (main.js) para "ligar" os eventos
export function setupInteractivity(getTournamentData, setTournamentData, fullRender) {
    const appContainer = document.getElementById('app-container');

    // Remove qualquer listener antigo para evitar duplicação
    if (window.scoreUpdateHandler) {
        appContainer.removeEventListener('change', window.scoreUpdateHandler);
    }

    // Cria um novo handler que tem acesso ao estado atual
    window.scoreUpdateHandler = (event) => {
        if (!event.target.classList.contains('score-select')) return;

        const selectEl = event.target;
        const matchId = parseInt(selectEl.dataset.matchId);
        const playerSlot = selectEl.dataset.playerSlot;
        const newScore = selectEl.value;

        const opponentSlot = playerSlot === 'p1' ? 'p2' : 'p1';
        const matchEl = selectEl.closest('.match');
        const opponentSelect = matchEl ? matchEl.querySelector(`[data-player-slot="${opponentSlot}"]`) : null;

        if (newScore === 'WO' && opponentSelect && opponentSelect.value === 'WO') {
            alert("Apenas um jogador pode ser desclassificado (WO) por partida.");
            selectEl.value = matchEl.dataset.previousValue || '--';
            return;
        }

        matchEl.dataset.previousValue = selectEl.value;
        
        const scores = {};
        scores[playerSlot] = newScore;
        scores[opponentSlot] = opponentSelect ? opponentSelect.value : '--';

        // Obtém o estado atual, chama o módulo de resultados, e atualiza o estado
        const currentData = getTournamentData();
        const newData = resolveMatch(currentData, matchId, scores);
        setTournamentData(newData);
        
        // Pede ao "Maestro" para redesenhar tudo
        fullRender();
    };

    appContainer.addEventListener('change', window.scoreUpdateHandler);
}

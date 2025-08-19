// js/main.js - Versão Final Limpa e Comentada
// Este módulo atua como o "Orquestrador da UI". Ele lida com os eventos dos
// botões principais, chama o motor de torneio e pede para a UI ser redesenhada.

import { buildSingleBracketStructure } from './structures/single_bracket_structure.js';
import { buildDoubleBracketStructure } from './structures/double_bracket_structure.js';
import { populateSingleBracket } from './logic/single_player_logic.js';
import { populateDoubleBracket } from './logic/double_player_logic.js';
import { renderBracket } from './bracket_render.js';
import { parsePlayerInput } from './parsing.js';
import { setupInteractivity } from './interactivity.js';
import * as tournamentEngine from './results.js';

/**
 * Atualiza o estado (habilitado/desabilitado) dos botões Undo/Redo
 * com base na informação vinda do motor.
 */
function updateButtonStates() {
    const { canUndo, canRedo } = tournamentEngine.getHistoryState();
    document.getElementById('undo-btn').disabled = !canUndo;
    document.getElementById('redo-btn').disabled = !canRedo;
}

/**
 * Inicia um novo torneio com base nas seleções do usuário.
 */
function startTournament() {
    const playerInput = document.getElementById('player-list').value;
    const tournamentType = document.querySelector('input[name="bracket-type"]:checked').value;
    
    const { unseededPlayers, seededPlayers } = parsePlayerInput(playerInput);
    const playerCount = unseededPlayers.length + seededPlayers.length;

    if (playerCount < 2) {
        alert("Please enter at least 2 players.");
        return;
    }

    // Gerencia a visibilidade dos painéis
    document.getElementById('setup').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    document.getElementById('winners-bracket-container').style.display = 'block';
    document.getElementById('losers-bracket-container').style.display = tournamentType === 'double' ? 'block' : 'none';
    document.getElementById('grand-final-container').style.display = tournamentType === 'double' ? 'block' : 'none';
    
    const mainBracketTitle = document.getElementById('main-bracket-title');
    if (tournamentType === 'double') {
        mainBracketTitle.style.display = 'block';
        mainBracketTitle.textContent = 'Winners Bracket';
    } else {
        mainBracketTitle.style.display = 'none';
        mainBracketTitle.textContent = '';
    }
    
    // Monta a estrutura de dados inicial
    let populatedBracket;
    if (tournamentType === 'single') {
        const structure = buildSingleBracketStructure(playerCount);
        populatedBracket = populateSingleBracket(structure, playerInput);
    } else {
        const structure = buildDoubleBracketStructure(playerCount);
        populatedBracket = populateDoubleBracket(structure, playerInput);
    }
    
    // Envia a estrutura para o motor para inicialização e estabilização
    tournamentEngine.initializeBracket(populatedBracket);
    fullRender();
}

/**
 * Reseta a aplicação para o estado inicial.
 */
function resetTournament() {
    if (confirm("Are you sure you want to reset the entire tournament? This action cannot be undone.")) {
        // Gerencia a visibilidade dos painéis
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('setup').style.display = 'block';
        document.getElementById('player-list').value = '';
        
        // Limpa a UI
        const containers = ['#winners-bracket-matches', '#losers-bracket-matches', '#final-bracket-matches'];
        containers.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.innerHTML = '';
        });
        
        // Limpa o estado do motor
        tournamentEngine.initializeBracket({});
        updateButtonStates();
    }
}

/**
 * Função central que redesenha a chave inteira com base no estado atual do motor.
 */
function fullRender() {
    const currentData = tournamentEngine.getCurrentData();
    if (!currentData.type) return;

    if (currentData.type === 'single') {
        renderBracket(currentData.rounds, '#winners-bracket-matches');
    } else if (currentData.type === 'double') {
        renderBracket(currentData.winnersBracket, '#winners-bracket-matches');
        renderBracket(currentData.losersBracket, '#losers-bracket-matches');
        renderBracket(currentData.grandFinal, '#final-bracket-matches');
    }
    updateButtonStates();
}

/**
 * Ações de Undo/Redo que chamam o motor e pedem um redesenho.
 */
function undoAction() {
    tournamentEngine.undo();
    fullRender();
}

function redoAction() {
    tournamentEngine.redo();
    fullRender();
}

// --- Event Listeners Iniciais ---
document.getElementById('generate-btn').addEventListener('click', startTournament);
document.getElementById('reset-btn').addEventListener('click', resetTournament);
document.getElementById('undo-btn').addEventListener('click', undoAction);
document.getElementById('redo-btn').addEventListener('click', redoAction);

// Inicializa o módulo que ouve as interações na chave
setupInteractivity(fullRender);

// Garante que os conectores sejam redesenhados se a janela mudar de tamanho
window.addEventListener('resize', () => {
    const currentData = tournamentEngine.getCurrentData();
    if (!currentData.type) return;
    fullRender();
});

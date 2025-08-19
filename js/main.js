// js/main.js - Versão com a correção final da visibilidade dos contêineres

import { buildSingleBracketStructure } from './structures/single_bracket_structure.js';
import { buildDoubleBracketStructure } from './structures/double_bracket_structure.js';
import { populateSingleBracket } from './logic/single_player_logic.js';
import { populateDoubleBracket } from './logic/double_player_logic.js';
import { renderBracket } from './bracket_render.js';
import { parsePlayerInput } from './parsing.js';
import { setupInteractivity } from './interactivity.js';
import * as tournamentEngine from './results.js';

function updateButtonStates() {
    const { canUndo, canRedo } = tournamentEngine.getHistoryState();
    document.getElementById('undo-btn').disabled = !canUndo;
    document.getElementById('redo-btn').disabled = !canRedo;
}

function startTournament() {
    const playerInput = document.getElementById('player-list').value;
    const tournamentType = document.querySelector('input[name="bracket-type"]:checked').value;
    
    const { unseededPlayers, seededPlayers } = parsePlayerInput(playerInput);
    const playerCount = unseededPlayers.length + seededPlayers.length;

    if (playerCount < 2) {
        alert("Please enter at least 2 players.");
        return;
    }

    document.getElementById('setup').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    // --- INÍCIO DA CORREÇÃO ---
    // Estas linhas cruciais foram restauradas
    document.getElementById('winners-bracket-container').style.display = 'block';
    document.getElementById('losers-bracket-container').style.display = tournamentType === 'double' ? 'block' : 'none';
    document.getElementById('grand-final-container').style.display = tournamentType === 'double' ? 'block' : 'none';
    // --- FIM DA CORREÇÃO ---
    
    const mainBracketTitle = document.getElementById('main-bracket-title');
    mainBracketTitle.style.display = 'block';
    
    if (tournamentType === 'double') {
        mainBracketTitle.textContent = 'Winners Bracket';
    } else {
        mainBracketTitle.textContent = 'Main Bracket';
    }
    
    let populatedBracket;
    if (tournamentType === 'single') {
        const structure = buildSingleBracketStructure(playerCount);
        populatedBracket = populateSingleBracket(structure, playerInput);
    } else {
        const structure = buildDoubleBracketStructure(playerCount);
        populatedBracket = populateDoubleBracket(structure, playerInput);
    }
    
    tournamentEngine.initializeBracket(populatedBracket);
    fullRender();
}

function resetTournament() {
    if (confirm("Are you sure you want to reset the entire tournament? This action cannot be undone.")) {
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('setup').style.display = 'block';
        document.getElementById('player-list').value = '';
        
        const containers = ['#winners-bracket-matches', '#losers-bracket-matches', '#final-bracket-matches'];
        containers.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.innerHTML = '';
        });
        
        tournamentEngine.initializeBracket({});
        updateButtonStates();
    }
}

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

function undoAction() {
    tournamentEngine.undo();
    fullRender();
}

function redoAction() {
    tournamentEngine.redo();
    fullRender();
}

document.getElementById('generate-btn').addEventListener('click', startTournament);
document.getElementById('reset-btn').addEventListener('click', resetTournament);
document.getElementById('undo-btn').addEventListener('click', undoAction);
document.getElementById('redo-btn').addEventListener('click', redoAction);

setupInteractivity(fullRender);

window.addEventListener('resize', () => {
    const currentData = tournamentEngine.getCurrentData();
    if (!currentData.type) return;
    fullRender();
});

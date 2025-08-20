// js/main.js - Lógica completa para a página pública (index.html)

import { renderBracket } from './bracket_render.js';
import { setupInteractivity } from './interactivity.js';
import * as tournamentEngine from './results.js';

const API_URL = 'api/api.php';
let currentTournamentId = null;
let isEditMode = false;

/**
 * Atualiza o estado (habilitado/desabilitado) dos botões Undo/Redo.
 */
function updateButtonStates() {
    const { canUndo, canRedo } = tournamentEngine.getHistoryState();
    document.getElementById('undo-btn').disabled = !canUndo;
    document.getElementById('redo-btn').disabled = !canRedo;
}

/**
 * Salva o estado atual do torneio no servidor.
 */
async function saveCurrentTournamentState() {
    const currentData = tournamentEngine.getCurrentData();
    if (!currentData.type || !currentTournamentId) return;

    const payload = {
        public_id: currentTournamentId,
        bracket_data: currentData,
        name: document.querySelector('#app-container h1').textContent,
        date: currentData.tournament_date || new Date().toISOString().slice(0, 10),
        type: currentData.type
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Failed to save.");
        console.log("State saved for tournament:", currentTournamentId);
    } catch (error) {
        console.error('Auto-save failed:', error);
        alert("Failed to save changes to the server.");
    }
}

/**
 * Busca a lista de todos os torneios na API e os exibe na página.
 */
async function loadTournamentList() {
    const listContainer = document.getElementById('tournament-list');
    const appContainer = document.getElementById('app-container');
    const listContainerWrapper = document.getElementById('tournament-list-container');
    
    listContainerWrapper.style.display = 'block';
    appContainer.style.display = 'none';
    
    listContainer.innerHTML = '<h2>All Tournaments</h2><p>Loading...</p>';
    
    try {
        const response = await fetch(`${API_URL}?action=list`);
        const tournaments = await response.json();

        if (tournaments.length === 0) {
            listContainer.innerHTML = '<h2>All Tournaments</h2><p>No tournaments found. <a href="admin.html">Create one!</a></p>';
            return;
        }

        let html = '<h2>All Tournaments</h2><ul>';
        tournaments.forEach(t => {
            const date = new Date(t.tournament_date + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const typeLabel = t.type.charAt(0).toUpperCase() + t.type.slice(1);
            
            html += `
                <li>
                    <a href="?id=${t.public_id}">
                        <span class="tournament-name">${t.name}</span>
                        <span class="tournament-details">${typeLabel} Elimination - ${formattedDate}</span>
                    </a>
                </li>
            `;
        });
        html += '</ul>';
        listContainer.innerHTML = html;

    } catch (error) {
        console.error("Error loading tournament list:", error);
        listContainer.innerHTML = '<h2>All Tournaments</h2><p>Could not load tournaments.</p>';
    }
}

/**
 * Carrega e exibe uma chave de torneio específica, ajustando a UI para o modo correto.
 */
async function loadAndDisplayBracket(id) {
    document.getElementById('tournament-list-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';

    // Gerencia a visibilidade dos botões de admin com base na flag isEditMode
    const adminControls = document.querySelector('.header-buttons-left');
    adminControls.style.display = isEditMode ? 'flex' : 'none';

    // Ajusta o botão "Voltar"
    const backButton = document.getElementById('back-to-list-btn');
    if (isEditMode) {
        backButton.textContent = "Back to Admin";
    } else {
        backButton.textContent = "Back to List";
    }

    try {
        const response = await fetch(`${API_URL}?id=${id}`);
        if (!response.ok) throw new Error('Tournament not found.');
        
        const tournamentDataFromServer = await response.json();
        
        const bracketData = tournamentDataFromServer.bracket_data;
        bracketData.tournament_date = tournamentDataFromServer.tournament_date;
        
        tournamentEngine.initializeBracket(bracketData);
        currentTournamentId = id;
        
        document.querySelector('#app-container h1').textContent = tournamentDataFromServer.name;
        
        fullRender();

    } catch(error) {
        console.error('Error loading tournament:', error);
        alert(error.message);
    }
}

/**
 * Função central de renderização.
 */
function fullRender() {
    const currentData = tournamentEngine.getCurrentData();
    if (!currentData.type) return;

    const isReadOnly = !isEditMode;
    const mainBracketTitle = document.getElementById('main-bracket-title');
    
    document.getElementById('losers-bracket-container').style.display = currentData.type === 'double' ? 'block' : 'none';
    document.getElementById('grand-final-container').style.display = currentData.type === 'double' ? 'block' : 'none';

    if (currentData.type === 'double') {
        mainBracketTitle.style.display = 'block';
        mainBracketTitle.textContent = 'Winners Bracket';
        renderBracket(currentData.winnersBracket, '#winners-bracket-matches', isReadOnly);
        renderBracket(currentData.losersBracket, '#losers-bracket-matches', isReadOnly);
        renderBracket(currentData.grandFinal, '#final-bracket-matches', isReadOnly);
    } else {
        mainBracketTitle.style.display = 'none';
        renderBracket(currentData.rounds, '#winners-bracket-matches', isReadOnly);
    }

    if (isEditMode) {
        updateButtonStates();
    }
}

/**
 * Ações de histórico que salvam o estado após a execução.
 */
function undoAction() {
    tournamentEngine.undo();
    fullRender();
    saveCurrentTournamentState();
}

function redoAction() {
t-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    background-color: #28a745;
    border: 2px solid #28a745;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}
#save-btn:hover {
    background-color: #218838;
    border-color: #218838;
}

// js/main.js - Versão com edição de nome e data do torneio

import { renderBracket, renderRanking } from './bracket_render.js';
import { setupInteractivity } from './interactivity.js';
import * as tournamentEngine from './results.js';

const API_URL = 'api/api.php';
let currentTournamentId = null;
let isEditMode = false;

function updateButtonStates() {
    const { canUndo, canRedo } = tournamentEngine.getHistoryState();
    document.getElementById('undo-btn').disabled = !canUndo;
    document.getElementById('redo-btn').disabled = !canRedo;
}

async function saveCurrentTournamentState() {
    const currentSession = tournamentEngine.getCurrentSessionState();
    if (!currentSession.currentState || !currentSession.currentState.type || !currentTournamentId) return;

    const payload = {
        public_id: currentTournamentId,
        bracket_data: currentSession,
        name: document.getElementById('main-tournament-title').textContent,
        date: currentSession.currentState.tournament_date,
        type: currentSession.currentState.type
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

async function loadAndDisplayBracket(id) {
    document.getElementById('tournament-list-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';

    const adminControls = document.querySelector('.header-buttons-left');
    adminControls.style.display = isEditMode ? 'flex' : 'none';
    
    const photoManager = document.getElementById('admin-photo-manager');
    if (isEditMode) {
        photoManager.style.display = 'block';
    } else {
        photoManager.style.display = 'none';
    }

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
        
        const sessionData = tournamentDataFromServer.bracket_data;
        
        tournamentEngine.initializeBracket(sessionData);
        currentTournamentId = id;
        
        updateTitleDisplay(tournamentDataFromServer.name, tournamentDataFromServer.tournament_date, tournamentDataFromServer.type);
        
        const editTitleIcon = document.getElementById('edit-title-icon');
        if (isEditMode) {
            editTitleIcon.style.display = 'inline';
        }
        
        fullRender();
        loadTournamentPhotos(id);

    } catch(error) {
        console.error('Error loading tournament:', error);
        alert(error.message);
    }
}

function updateTitleDisplay(name, dateStr, type) {
    document.getElementById('main-tournament-title').textContent = name;
    const date = new Date(dateStr + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const typeLabel = type === 'single' ? 'Single Elimination' : 'Double Elimination';
    document.getElementById('main-tournament-subtitle').textContent = `${formattedDate} • ${typeLabel}`;
}

function toggleTitleEdit(editing) {
    const displayArea = document.getElementById('title-display-area');
    const subtitle = document.getElementById('main-tournament-subtitle');
    const editArea = document.getElementById('title-edit-area');

    if (editing) {
        const currentSession = tournamentEngine.getCurrentSessionState();
        document.getElementById('edit-name-input').value = document.getElementById('main-tournament-title').textContent;
        document.getElementById('edit-date-input').value = currentSession.currentState.tournament_date;
        displayArea.style.display = 'none';
        subtitle.style.display = 'none';
        editArea.style.display = 'flex';
    } else {
        displayArea.style.display = 'flex';
        subtitle.style.display = 'block';
        editArea.style.display = 'none';
    }
}

async function loadTournamentPhotos(id) {
    // ... (função inalterada)
}

function fullRender() {
    // ... (função inalterada)
}

async function handlePhotoUpload(event) {
    // ... (função inalterada)
}

function undoAction() {
    // ... (função inalterada)
}

function redoAction() {
    // ... (função inalterada)
}

function backToAction() {
    // ... (função inalterada)
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tournamentId = params.get('id');
    isEditMode = params.get('edit') === 'true';

    if (tournamentId) {
        loadAndDisplayBracket(tournamentId);
        
        if (isEditMode) {
            setupInteractivity(() => {
                fullRender();
                saveCurrentTournamentState();
            });
            document.getElementById('undo-btn').addEventListener('click', undoAction);
            document.getElementById('redo-btn').addEventListener('click', redoAction);
            document.getElementById('save-btn').addEventListener('click', saveCurrentTournamentState);
            
            const photoForm = document.getElementById('photo-upload-form');
            if (photoForm) {
                photoForm.addEventListener('submit', handlePhotoUpload);
            }

            const editTitleIcon = document.getElementById('edit-title-icon');
            const saveTitleBtn = document.getElementById('save-title-btn');
            const cancelTitleBtn = document.getElementById('cancel-title-btn');

            editTitleIcon.addEventListener('click', () => toggleTitleEdit(true));
            cancelTitleBtn.addEventListener('click', () => toggleTitleEdit(false));

            saveTitleBtn.addEventListener('click', () => {
                const newName = document.getElementById('edit-name-input').value;
                const newDate = document.getElementById('edit-date-input').value;
                
                const currentSession = tournamentEngine.getCurrentSessionState();
                currentSession.currentState.tournament_date = newDate;
                
                tournamentEngine.initializeBracket(currentSession); // Recarrega a sessão com a nova data
                
                updateTitleDisplay(newName, newDate, currentSession.currentState.type);
                saveCurrentTournamentState(); 
                toggleTitleEdit(false);
            });
        }
        
        document.getElementById('back-to-list-btn').addEventListener('click', backToAction);
    } else {
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.style.display = 'none';
        }
        loadTournamentList();
    }
});

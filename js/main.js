// js/main.js - Versão com a correção no envio de dados para a API

import { renderBracket, renderRanking } from './bracket_render.js';
import { setupInteractivity } from './interactivity.js';
import * as tournamentEngine from './results.js';

const API_URL = 'api/api.php';
let currentTournamentId = null;
let isEditMode = false;

// Variável para guardar a data do torneio carregado
let loadedTournamentDate = null; 

function updateButtonStates() {
    const { canUndo, canRedo } = tournamentEngine.getHistoryState();
    document.getElementById('undo-btn').disabled = !canUndo;
    document.getElementById('redo-btn').disabled = !canRedo;
}

async function saveCurrentTournamentState() {
    const currentSession = tournamentEngine.getCurrentSessionState();
    if (!currentSession.currentState || !currentSession.currentState.type || !currentTournamentId) return;

    // --- INÍCIO DA CORREÇÃO ---
    // Usamos a data que guardámos ao carregar o torneio, garantindo que ela nunca é perdida.
    const payload = {
        public_id: currentTournamentId,
        bracket_data: currentSession,
        name: document.getElementById('main-tournament-title').textContent,
        date: loadedTournamentDate,
        type: currentSession.currentState.type
    };
    // --- FIM DA CORREÇÃO ---

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || "Failed to save.");
        }
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
        loadedTournamentDate = tournamentDataFromServer.tournament_date; // Guarda a data
        
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
        document.getElementById('edit-name-input').value = document.getElementById('main-tournament-title').textContent;
        document.getElementById('edit-date-input').value = loadedTournamentDate;
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
    const showPhotosBtn = document.getElementById('show-photos-btn');
    try {
        const response = await fetch(`${API_URL}?action=get_photos&id=${id}`);
        const mediaFiles = await response.json();
        if (mediaFiles.length > 0) {
            showPhotosBtn.style.display = 'block';
            const photoModal = document.getElementById('photo-carousel-modal');
            const closeModalBtn = photoModal.querySelector('.modal-close-btn');
            const swiperWrapper = photoModal.querySelector('.swiper-wrapper');
            showPhotosBtn.onclick = () => {
                swiperWrapper.innerHTML = mediaFiles.map(fileName => {
                    const extension = fileName.split('.').pop().toLowerCase();
                    if (['mp4', 'webm', 'mov'].includes(extension)) {
                        return `<div class="swiper-slide"><video src="uploads/${fileName}" controls></video></div>`;
                    } else {
                        return `<div class="swiper-slide"><img src="uploads/${fileName}" alt="Tournament Media"></div>`;
                    }
                }).join('');
                photoModal.style.display = 'flex';
                new Swiper('.swiper-container', {
                    loop: mediaFiles.length > 1,
                    pagination: { el: '.swiper-pagination', clickable: true },
                    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                });
            };
            closeModalBtn.onclick = () => {
                photoModal.style.display = 'none';
                swiperWrapper.innerHTML = '';
            };
        } else {
            showPhotosBtn.style.display = 'none';
        }
    } catch(error) {
        console.error("Error loading media:", error);
        showPhotosBtn.style.display = 'none';
    }
}

function fullRender() {
    const currentSession = tournamentEngine.getCurrentSessionState();
    const currentData = currentSession.currentState;
    if (!currentData || !currentData.type) return;

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

    renderRanking(currentData.ranking, '#ranking-table');
    if (isEditMode) {
        updateButtonStates();
    }
}

async function handlePhotoUpload(event) {
    event.preventDefault();
    const form = event.target;
    const photoInput = document.getElementById('photo-input');
    const files = photoInput.files;

    if (files.length === 0) {
        alert("Please select files to upload.");
        return;
    }
    if (!currentTournamentId) {
        alert("Cannot upload: No active tournament ID.");
        return;
    }

    const uploadPromises = [];
    for (const file of files) {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('public_id', currentTournamentId);

        const uploadPromise = fetch(`${API_URL}?action=upload`, {
            method: 'POST',
            body: formData
        }).then(response => response.json().then(data => ({ok: response.ok, data, fileName: file.name})));
        
        uploadPromises.push(uploadPromise);
    }

    try {
        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(r => r.ok).length;
        const failedUploads = results.filter(r => !r.ok);
        let summaryMessage = `${successfulUploads} of ${results.length} files uploaded successfully.`;
        if (failedUploads.length > 0) {
            summaryMessage += '\n\nFailed uploads:\n';
            failedUploads.forEach(fail => {
                summaryMessage += `- ${fail.fileName}: ${fail.data.message}\n`;
            });
        }
        alert(summaryMessage);
        form.reset();
        loadTournamentPhotos(currentTournamentId);
    } catch (error) {
        console.error("Error during batch upload:", error);
        alert(`An unexpected error occurred during upload.`);
    }
}

function undoAction() {
    tournamentEngine.undo();
    fullRender();
    saveCurrentTournamentState();
}

function redoAction() {
    tournamentEngine.redo();
    fullRender();
    saveCurrentTournamentState();
}

function backToAction() {
    if (isEditMode) {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'index.html';
    }
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
                
                loadedTournamentDate = newDate; // Atualiza a data guardada
                
                const currentSession = tournamentEngine.getCurrentSessionState();
                const currentType = currentSession.currentState.type;
                
                updateTitleDisplay(newName, newDate, currentType);
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

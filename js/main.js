// js/main.js - Versão com lógica do carrossel de fotos

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
        name: document.querySelector('#app-container h1').textContent,
        date: currentSession.currentState.tournament_date || new Date().toISOString().slice(0, 10),
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
        
        document.querySelector('#app-container h1').textContent = tournamentDataFromServer.name;
        
        fullRender();
        loadTournamentPhotos(id);

    } catch(error) {
        console.error('Error loading tournament:', error);
        alert(error.message);
    }
}

async function loadTournamentPhotos(id) {
    const showPhotosBtn = document.getElementById('show-photos-btn');
    try {
        const response = await fetch(`${API_URL}?action=get_photos&id=${id}`);
        const photos = await response.json();

        if (photos.length > 0) {
            showPhotosBtn.style.display = 'block';
            
            const photoModal = document.getElementById('photo-carousel-modal');
            const closeModalBtn = photoModal.querySelector('.modal-close-btn');
            const swiperWrapper = photoModal.querySelector('.swiper-wrapper');

            showPhotosBtn.onclick = () => {
                swiperWrapper.innerHTML = photos.map(fileName => `
                    <div class="swiper-slide">
                        <img src="uploads/${fileName}" alt="Tournament Photo">
                    </div>
                `).join('');
                
                photoModal.style.display = 'flex';

                new Swiper('.swiper-container', {
                    loop: photos.length > 1,
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
        console.error("Error loading photos:", error);
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
    const file = photoInput.files[0];

    if (!file) {
        alert("Please select a photo to upload.");
        return;
    }
    if (!currentTournamentId) {
        alert("Cannot upload photo: No active tournament ID.");
        return;
    }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('public_id', currentTournamentId);

    try {
        const response = await fetch(`${API_URL}?action=upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert(result.message);
        form.reset();
        loadTournamentPhotos(currentTournamentId); // Recarrega as fotos para mostrar o botão se for a primeira
    } catch (error) {
        console.error("Error uploading photo:", error);
        alert(`Upload failed: ${error.message}`);
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

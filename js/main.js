// js/main.js - Versão com a correção no envio de dados e feedback visual

import { renderBracket, renderRanking } from './bracket_render.js';
import { setupInteractivity } from './interactivity.js';
import * as tournamentEngine from './results.js';
import { showSpinner, hideSpinner, showToast } from './ui_helpers.js';

const API_URL = 'api/api.php';
let currentTournamentId = null;
let isEditMode = false;
let loadedTournamentDate = null; 
let swiperInstance = null;

async function handlePhotoDelete(event) {
    const button = event.target.closest('.delete-photo-btn');
    if (!button) return;

    const filename = button.dataset.filename;
    if (!filename || !currentTournamentId) return;

    if (!confirm(`Are you sure you want to delete this media? This action is irreversible.`)) {
        return;
    }

    showSpinner();
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete_photo',
                public_id: currentTournamentId,
                filename: filename
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        showToast(result.message);

        // Remove o slide do DOM e atualiza o Swiper
        const slideToRemove = button.closest('.swiper-slide');
        if (slideToRemove) {
            const slideIndex = parseInt(slideToRemove.dataset.swiperSlideIndex, 10);
            slideToRemove.remove();
            swiperInstance.update();

            // Se não houver mais slides, fecha o modal
            if (swiperInstance.slides.length === 0) {
                document.getElementById('photo-carousel-modal').style.display = 'none';
                document.getElementById('show-photos-btn').style.display = 'none';
            }
        }

    } catch (error) {
        console.error('Error deleting photo:', error);
        showToast(`Could not delete media: ${error.message}`, 'error');
    } finally {
        hideSpinner();
    }
}


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
        date: loadedTournamentDate,
        type: currentSession.currentState.type
    };

    showSpinner();
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
        showToast("Changes saved successfully!");
    } catch (error) {
        console.error('Save failed:', error);
        showToast(`Error saving: ${error.message}`, 'error');
    } finally {
        hideSpinner();
    }
}

async function loadTournamentList() {
    const listContainer = document.getElementById('tournament-list');
    const appContainer = document.getElementById('app-container');
    const listContainerWrapper = document.getElementById('tournament-list-container');
    
    listContainerWrapper.style.display = 'block';
    appContainer.style.display = 'none';
    
    showSpinner();
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
        listContainer.innerHTML = '<h2>All Tournaments</h2><p>Could not load tournaments. Please try again later.</p>';
        showToast("Could not load tournaments.", 'error');
    } finally {
        hideSpinner();
    }
}

async function loadAndDisplayBracket(id) {
    document.getElementById('tournament-list-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';

    const adminControls = document.querySelector('.header-buttons-left');
    adminControls.style.display = isEditMode ? 'flex' : 'none';
    
    const photoManager = document.getElementById('admin-photo-manager');
    photoManager.style.display = isEditMode ? 'block' : 'none';

    const backButton = document.getElementById('back-to-list-btn');
    backButton.textContent = isEditMode ? "Back to Admin" : "Back to List";

    showSpinner();
    try {
        const response = await fetch(`${API_URL}?id=${id}`);
        if (!response.ok) throw new Error('Tournament not found.');
        
        const tournamentDataFromServer = await response.json();
        
        const sessionData = tournamentDataFromServer.bracket_data;
        loadedTournamentDate = tournamentDataFromServer.tournament_date; 
        
        tournamentEngine.initializeBracket(sessionData);
        currentTournamentId = id;
        
        updateTitleDisplay(tournamentDataFromServer.name, tournamentDataFromServer.tournament_date, tournamentDataFromServer.type);
        
        document.getElementById('edit-title-icon').style.display = isEditMode ? 'inline' : 'none';
        
        fullRender();
        loadTournamentPhotos(id);

    } catch(error) {
        console.error('Error loading tournament:', error);
        showToast(error.message, 'error');
    } finally {
        hideSpinner();
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
                    const deleteButtonHTML = isEditMode ? `<button class="delete-photo-btn" data-filename="${fileName}">&times;</button>` : '';
                    const extension = fileName.split('.').pop().toLowerCase();
                    const mediaElement = ['mp4', 'webm', 'mov'].includes(extension)
                        ? `<video src="uploads/${fileName}" controls></video>`
                        : `<img src="uploads/${fileName}" alt="Tournament Media">`;

                    return `<div class="swiper-slide">${deleteButtonHTML}${mediaElement}</div>`;
                }).join('');

                photoModal.style.display = 'flex';

                if (swiperInstance) swiperInstance.destroy(true, true);
                swiperInstance = new Swiper('.swiper-container', {
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
        showToast("Please select files to upload.", 'error');
        return;
    }
    if (!currentTournamentId) {
        showToast("Cannot upload: No active tournament ID.", 'error');
        return;
    }

    showSpinner();
    const uploadPromises = Array.from(files).map(file => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('public_id', currentTournamentId);

        return fetch(`${API_URL}?action=upload`, {
            method: 'POST',
            body: formData
        }).then(response => response.json().then(data => ({ok: response.ok, data, fileName: file.name})));
    });

    try {
        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(r => r.ok).length;
        const failedUploads = results.filter(r => !r.ok);
        
        if(successfulUploads > 0) {
            showToast(`${successfulUploads} of ${results.length} files uploaded successfully.`);
        }
        if(failedUploads.length > 0) {
            let errorMsg = `Failed to upload ${failedUploads.length} file(s).`;
            console.error("Failed uploads:", failedUploads);
            showToast(errorMsg, 'error', 5000);
        }

        form.reset();
        loadTournamentPhotos(currentTournamentId);
    } catch (error) {
        console.error("Error during batch upload:", error);
        showToast(`An unexpected error occurred during upload.`, 'error');
    } finally {
        hideSpinner();
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

    // Adiciona o listener para o carrossel usando delegação de eventos
    document.getElementById('photo-carousel-modal').addEventListener('click', handlePhotoDelete);


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
            document.getElementById('photo-upload-form')?.addEventListener('submit', handlePhotoUpload);
            
            document.getElementById('edit-title-icon').addEventListener('click', () => toggleTitleEdit(true));
            document.getElementById('cancel-title-btn').addEventListener('click', () => toggleTitleEdit(false));
            document.getElementById('save-title-btn').addEventListener('click', () => {
                const newName = document.getElementById('edit-name-input').value;
                const newDate = document.getElementById('edit-date-input').value;
                loadedTournamentDate = newDate;
                const currentType = tournamentEngine.getCurrentSessionState().currentState.type;
                updateTitleDisplay(newName, newDate, currentType);
                saveCurrentTournamentState(); 
                toggleTitleEdit(false);
            });
        }
        
        document.getElementById('back-to-list-btn').addEventListener('click', backToAction);

    } else {
        document.getElementById('app-container').style.display = 'none';
        loadTournamentList();
    }
});

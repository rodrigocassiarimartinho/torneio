// js/admin.js - Lógica completa para a página de administração, incluindo Delete

import * as tournamentEngine from './results.js';
// ... (outros imports inalterados)

const API_URL = 'api/api.php';

async function loadAdminTournamentList() {
    const listContainer = document.getElementById('admin-tournament-list');
    try {
        const response = await fetch(`${API_URL}?action=list`);
        const tournaments = await response.json();
        if (tournaments.length === 0) {
            listContainer.innerHTML = '<p>No tournaments found.</p>';
            return;
        }

        let html = '<ul>';
        tournaments.forEach(t => {
            html += `
                <li class="admin-list-item">
                    <span class="tournament-name">${t.name}</span>
                    <div class="admin-links">
                        <a href="index.html?id=${t.public_id}" target="_blank">View</a>
                        <a href="index.html?id=${t.public_id}&edit=true" class="edit-link">Edit</a>
                        <button class="delete-link" data-id="${t.public_id}">Delete</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        listContainer.innerHTML = html;
    } catch (error) {
        listContainer.innerHTML = '<p>Could not load tournaments.</p>';
        console.error("Error loading tournament list for admin:", error);
    }
}

async function deleteTournament(id) {
    if (!confirm(`Are you sure you want to delete tournament ${id}? This action is irreversible.`)) {
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', public_id: id })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert(result.message);
        loadAdminTournamentList(); // Recarrega a lista para remover o item apagado
    } catch (error) {
        console.error('Error deleting tournament:', error);
        alert(`Could not delete tournament: ${error.message}`);
    }
}

async function createNewTournament() {
    // ... (função inalterada)
}

// --- Lógica de Inicialização da Página de Admin ---
document.addEventListener('DOMContentLoaded', () => {
    const adminListContainer = document.getElementById('admin-tournament-list');

    document.getElementById('generate-btn').addEventListener('click', createNewTournament);
    
    // Adiciona um único listener para a lista inteira (event delegation)
    adminListContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-link')) {
            const tournamentId = event.target.dataset.id;
            deleteTournament(tournamentId);
        }
    });

    loadAdminTournamentList();
});

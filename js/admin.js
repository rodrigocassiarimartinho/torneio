// js/admin.js - Lógica completa para a página de administração com feedback visual

import { buildSingleBracketStructure } from './structures/single_bracket_structure.js';
import { buildDoubleBracketStructure } from './structures/double_bracket_structure.js';
import { populateSingleBracket } from './logic/single_player_logic.js';
import { populateDoubleBracket } from './logic/double_player_logic.js';
import { parsePlayerInput } from './parsing.js';
import * as tournamentEngine from './results.js';
import { showSpinner, hideSpinner, showToast } from './ui_helpers.js';

const API_URL = 'api/api.php';

async function loadAdminTournamentList() {
    const listContainer = document.getElementById('admin-tournament-list');
    showSpinner();
    try {
        const response = await fetch(`${API_URL}?action=list`);
        const tournaments = await response.json();

        if (tournaments.length === 0) {
            listContainer.innerHTML = '<p>No tournaments found.</p>';
            return;
        }

        let tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th class="actions-column">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        tournaments.forEach(t => {
            const date = new Date(t.tournament_date + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const typeLabel = t.type.charAt(0).toUpperCase() + t.type.slice(1);

            tableHtml += `
                <tr>
                    <td><span class="tournament-name">${t.name}</span></td>
                    <td>${formattedDate}</td>
                    <td>${typeLabel}</td>
                    <td class="actions-column">
                        <a href="index.html?id=${t.public_id}" target="_blank" class="admin-btn-compact view-btn" title="View as public">View</a>
                        <a href="index.html?id=${t.public_id}&edit=true" class="admin-btn-compact edit-btn" title="Edit this tournament">Edit</a>
                        <button class="admin-btn-compact delete-btn" data-id="${t.public_id}" title="Delete this tournament">Delete</button>
                    </td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        listContainer.innerHTML = tableHtml;

    } catch (error) {
        listContainer.innerHTML = '<p>Could not load tournaments.</p>';
        showToast("Error loading tournaments.", "error");
        console.error("Error loading tournament list for admin:", error);
    } finally {
        hideSpinner();
    }
}

async function deleteTournament(id, name) {
    if (!confirm(`Are you sure you want to delete the tournament "${name}"? This action is irreversible.`)) {
        return;
    }

    showSpinner();
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', public_id: id })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        showToast(result.message);
        loadAdminTournamentList(); 
    } catch (error) {
        console.error('Error deleting tournament:', error);
        showToast(`Could not delete tournament: ${error.message}`, 'error');
    } finally {
        hideSpinner();
    }
}

async function createNewTournament() {
    const name = document.getElementById('tournament-name').value.trim();
    const date = document.getElementById('tournament-date').value;
    const playerInput = document.getElementById('player-list').value;
    const type = document.querySelector('input[name="bracket-type"]:checked').value;

    if (!name || !date || !playerInput) {
        showToast("Please fill all tournament details: Name, Date, and Player List.", "error");
        return;
    }
    
    const { unseededPlayers, seededPlayers } = parsePlayerInput(playerInput);
    const playerCount = unseededPlayers.length + seededPlayers.length;
    if (playerCount < 2) {
        showToast("Please enter at least 2 players.", "error");
        return;
    }

    let populatedBracket;
    if (type === 'single') {
        const structure = buildSingleBracketStructure(playerCount);
        populatedBracket = populateSingleBracket(structure, playerInput);
    } else {
        const structure = buildDoubleBracketStructure(playerCount);
        populatedBracket = populateDoubleBracket(structure, playerInput);
    }
    
    tournamentEngine.initializeBracket(populatedBracket);
    
    const finalBracketSession = tournamentEngine.getCurrentSessionState();

    const payload = {
        name: name,
        date: date,
        type: type,
        bracket_data: finalBracketSession
    };
    
    showSpinner();
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        // A notificação de sucesso pode não ser vista devido ao redirecionamento,
        // mas é bom tê-la caso o redirecionamento falhe.
        showToast(`Tournament "${name}" created successfully!`);
        window.location.href = `index.html?id=${result.id}&edit=true`;

    } catch (error) {
        console.error('Error creating tournament:', error);
        showToast(`Could not create tournament: ${error.message}`, 'error');
        hideSpinner(); // Esconde o spinner apenas em caso de erro
    }
}

function main() {
    const generateBtn = document.getElementById('generate-btn');
    const adminListContainer = document.getElementById('admin-tournament-list');

    if (generateBtn) {
        generateBtn.addEventListener('click', createNewTournament);
    }

    if (adminListContainer) {
        adminListContainer.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('delete-btn')) {
                const tournamentId = target.dataset.id;
                const tournamentName = target.closest('tr').querySelector('.tournament-name').textContent;
                deleteTournament(tournamentId, tournamentName);
            }
        });
        loadAdminTournamentList();
    }
}

document.addEventListener('DOMContentLoaded', main);

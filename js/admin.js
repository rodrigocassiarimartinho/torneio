// js/admin.js - Lógica completa para a página de administração

import { buildSingleBracketStructure } from './structures/single_bracket_structure.js';
import { buildDoubleBracketStructure } from './structures/double_bracket_structure.js';
import { populateSingleBracket } from './logic/single_player_logic.js';
import { populateDoubleBracket } from './logic/double_player_logic.js';
import { parsePlayerInput } from './parsing.js';
import * as tournamentEngine from './results.js';

const API_URL = 'api/api.php';

/**
 * Busca e exibe a lista de torneios com links de Edição e Visualização.
 */
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

/**
 * Coleta os dados do formulário, cria uma nova chave e a salva via API.
 */
async function createNewTournament() {
    // ... (A função createNewTournament que já tínhamos permanece exatamente a mesma)
    const name = document.getElementById('tournament-name').value.trim();
    const date = document.getElementById('tournament-date').value;
    const playerInput = document.getElementById('player-list').value;
    const type = document.querySelector('input[name="bracket-type"]:checked').value;

    if (!name || !date || !playerInput) {
        alert("Please fill all tournament details: Name, Date, and Player List.");
        return;
    }
    
    const { unseededPlayers, seededPlayers } = parsePlayerInput(playerInput);
    const playerCount = unseededPlayers.length + seededPlayers.length;
    if (playerCount < 2) {
        alert("Please enter at least 2 players.");
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
    const finalBracketData = tournamentEngine.getCurrentData();

    const payload = {
        name: name,
        date: date,
        type: type,
        bracket_data: finalBracketData
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert(`Tournament "${name}" created successfully! Redirecting to the bracket page.`);
        window.location.href = `index.html?id=${result.id}&edit=true`;

    } catch (error) {
        console.error('Error creating tournament:', error);
        alert(`Could not create tournament: ${error.message}`);
    }
}

// --- Lógica de Inicialização da Página de Admin ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generate-btn').addEventListener('click', createNewTournament);
    loadAdminTournamentList();
});

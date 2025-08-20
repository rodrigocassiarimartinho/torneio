// js/admin.js - Versão com redirecionamento para o modo de edição

import { buildSingleBracketStructure } from './structures/single_bracket_structure.js';
import { buildDoubleBracketStructure } from './structures/double_bracket_structure.js';
import { populateSingleBracket } from './logic/single_player_logic.js';
import { populateDoubleBracket } from './logic/double_player_logic.js';
import { parsePlayerInput } from './parsing.js';
import * as tournamentEngine from './results.js';

const API_URL = 'api/api.php';

async function createNewTournament() {
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

        alert(`Tournament "${name}" created successfully!`);
        // --- MUDANÇA AQUI ---
        // Redireciona para a URL de visualização COM o modo de edição ativado
        window.location.href = `index.html?id=${result.id}&edit=true`;

    } catch (error) {
        console.error('Error creating tournament:', error);
        alert(`Could not create tournament: ${error.message}`);
    }
}

document.getElementById('generate-btn').addEventListener('click', createNewTournament);

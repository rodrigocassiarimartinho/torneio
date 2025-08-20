// js/admin.js - Lógica exclusiva para a página de administração (admin.html)

import { buildSingleBracketStructure } from './structures/single_bracket_structure.js';
import { buildDoubleBracketStructure } from './structures/double_bracket_structure.js';
import { populateSingleBracket } from './logic/single_player_logic.js';
import { populateDoubleBracket } from './logic/double_player_logic.js';
import { parsePlayerInput } from './parsing.js';
import * as tournamentEngine from './results.js';

const API_URL = 'api/api.php';

async function createNewTournament() {
    // 1. Coleta todos os dados do formulário de admin
    const name = document.getElementById('tournament-name').value.trim();
    const date = document.getElementById('tournament-date').value;
    const playerInput = document.getElementById('player-list').value;
    const type = document.querySelector('input[name="bracket-type"]:checked').value;

    if (!name || !date || !playerInput) {
        alert("Please fill all tournament details: Name, Date, and Player List.");
        return;
    }
    
    // 2. Gera a estrutura da chave
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
    
    // 3. Pede ao motor para processar e estabilizar a chave
    tournamentEngine.initializeBracket(populatedBracket);
    const finalBracketData = tournamentEngine.getCurrentData();

    // 4. Prepara os dados para enviar à API
    const payload = {
        name: name,
        date: date,
        type: type,
        bracket_data: finalBracketData
    };

    // 5. Envia o novo torneio para a API para ser salvo
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        // 6. Se tudo deu certo, redireciona o admin para a página pública da nova chave
        alert(`Tournament "${name}" created successfully!`);
        window.location.href = `index.html?id=${result.id}`;

    } catch (error) {
        console.error('Error creating tournament:', error);
        alert(`Could not create tournament: ${error.message}`);
    }
}

// Adiciona o listener de evento apenas ao botão da página de admin
document.getElementById('generate-btn').addEventListener('click', createNewTournament);

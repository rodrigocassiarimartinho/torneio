// js/main.js - Lógica exclusiva para a página pública (index.html)

import { renderBracket } from './bracket_render.js';
import { setupInteractivity } from './interactivity.js';
import * as tournamentEngine from './results.js';

const API_URL = 'api/api.php';

/**
 * Busca a lista de todos os torneios na API e os exibe na página.
 */
async function loadTournamentList() {
    const listContainer = document.getElementById('tournament-list');
    listContainer.innerHTML = '<h2>All Tournaments</h2><p>Loading...</p>';
    
    try {
        const response = await fetch(`${API_URL}?action=list`);
        const tournaments = await response.json();

        if (tournaments.length === 0) {
            listContainer.innerHTML = '<h2>All Tournaments</h2><p>No tournaments found.</p>';
            return;
        }

        let html = '<h2>All Tournaments</h2><ul>';
        tournaments.forEach(t => {
            const date = new Date(t.tournament_date + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
            const typeLabel = t.type === 'single' ? 'Single Elimination' : 'Double Elimination';
            
            html += `
                <li>
                    <a href="?id=${t.public_id}">
                        <span class="tournament-name">${t.name}</span>
                        <span class="tournament-details">${typeLabel} - ${formattedDate}</span>
                    </a>
                </li>
            `;
        });
        html += '</ul>';
        listContainer.innerHTML = html;

    } catch (error) {
        listContainer.innerHTML = '<h2>All Tournaments</h2><p>Could not load tournaments.</p>';
        console.error("Error loading tournament list:", error);
    }
}

/**
 * Carrega e exibe uma chave de torneio específica.
 */
async function loadAndDisplayBracket(id) {
    document.getElementById('tournament-list-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';

    try {
        const response = await fetch(`${API_URL}?id=${id}`);
        if (!response.ok) throw new Error('Tournament not found.');
        
        const tournamentData = await response.json();
        
        // Inicializa o motor com os dados carregados
        tournamentEngine.initializeBracket(tournamentData.bracket_data);
        
        // Atualiza o título principal da página
        document.querySelector('#app-container h1').textContent = tournamentData.name;
        
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

    // Lógica de visibilidade dos contêineres e títulos
    const mainBracketTitle = document.getElementById('main-bracket-title');
    document.getElementById('losers-bracket-container').style.display = currentData.type === 'double' ? 'block' : 'none';
    document.getElementById('grand-final-container').style.display = currentData.type === 'double' ? 'block' : 'none';

    if (currentData.type === 'double') {
        mainBracketTitle.style.display = 'block';
        mainBracketTitle.textContent = 'Winners Bracket';
        renderBracket(currentData.winnersBracket, '#winners-bracket-matches');
        renderBracket(currentData.losersBracket, '#losers-bracket-matches');
        renderBracket(currentData.grandFinal, '#final-bracket-matches');
    } else {
        mainBracketTitle.style.display = 'none';
        renderBracket(currentData.rounds, '#winners-bracket-matches');
    }

    const { canUndo, canRedo } = tournamentEngine.getHistoryState();
    document.getElementById('undo-btn').disabled = !canUndo;
    document.getElementById('redo-btn').disabled = !canRedo;
}

// --- Lógica de Inicialização da Página Pública ---
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tournamentId = params.get('id');

    if (tournamentId) {
        // Se há um ID na URL, carrega a chave específica
        loadAndDisplayBracket(tournamentId);
    } else {
        // Senão, mostra a lista de todos os torneios
        loadTournamentList();
    }
});

// Setup dos botões e interatividade para a visualização da chave
setupInteractivity(fullRender);
document.getElementById('undo-btn').addEventListener('click', () => { 
    tournamentEngine.undo(); 
    fullRender();
    // Aqui poderíamos adicionar um save automático para o admin
});
document.getElementById('redo-btn').addEventListener('click', () => { 
    tournamentEngine.redo(); 
    fullRender(); 
    // Aqui poderíamos adicionar um save automático para o admin
});
document.getElementById('reset-btn').addEventListener('click', () => {
    // Um reset na página pública simplesmente volta para a lista de torneios
    window.location.href = 'index.html'; 
});

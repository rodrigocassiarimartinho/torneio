// js/main.js - Versão Final e Integrada (Estratégia 4.0)

// Importa apenas os "chefes de departamento" de cada módulo validado
import { buildSingleBracketStructure } from './structures/single_bracket_structure.js';
import { buildDoubleBracketStructure } from './structures/double_bracket_structure.js';
import { populateSingleBracket } from './logic/single_player_logic.js';
import { populateDoubleBracket } from './logic/double_player_logic.js';
import { renderBracket } from './bracket_render.js';
import { parsePlayerInput } from './parsing.js';
import { setupInteractivity } from './interactivity.js';
import { resolveInitialByes } from './results.js';

// Variável de estado global
let currentTournamentData = {};

// Funções "getter" e "setter" para o estado, para manter a modularidade
const getTournamentData = () => currentTournamentData;
const setTournamentData = (newData) => {
    currentTournamentData = newData;
};


// --- FUNÇÕES DE ORQUESTRAÇÃO ---

function startTournament() {
    const playerInput = document.getElementById('player-list').value;
    const tournamentType = document.querySelector('input[name="bracket-type"]:checked').value;
    
    const { unseededPlayers, seededPlayers } = parsePlayerInput(playerInput);
    const playerCount = unseededPlayers.length + seededPlayers.length;

    if (playerCount < 2) {
        alert("Por favor, insira pelo menos 2 jogadores.");
        return;
    }

    // Prepara a interface
    document.getElementById('setup').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('winners-bracket-container').style.display = 'block';
    document.getElementById('losers-bracket-container').style.display = tournamentType === 'double' ? 'block' : 'none';
    document.getElementById('grand-final-container').style.display = tournamentType === 'double' ? 'block' : 'none';
    const mainBracketTitle = document.getElementById('main-bracket-title');
    mainBracketTitle.style.display = tournamentType === 'double' ? 'block' : 'none';
    mainBracketTitle.textContent = 'Chave dos Vencedores';
    
    // Orquestração da criação da chave
    let populatedBracket;
    if (tournamentType === 'single') {
        const structure = buildSingleBracketStructure(playerCount);
        populatedBracket = populateSingleBracket(structure, playerInput);
    } else {
        const structure = buildDoubleBracketStructure(playerCount);
        populatedBracket = populateDoubleBracket(structure, playerInput);
    }
    
    // Resolve os byes iniciais antes de definir o estado final
    const finalInitialState = resolveInitialByes(populatedBracket);
    setTournamentData(finalInitialState);
    
    fullRender();
}

function resetTournament() {
    currentTournamentData = {};
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('setup').style.display = 'block';
    document.getElementById('player-list').value = '';
    
    document.getElementById('winners-bracket-matches').innerHTML = '';
    document.getElementById('losers-bracket-matches').innerHTML = '';
    document.getElementById('final-bracket-matches').innerHTML = '';
}

function fullRender() {
    if (!currentTournamentData.type) return;

    if (currentTournamentData.type === 'single') {
        renderBracket(currentTournamentData.rounds, '#winners-bracket-matches');
    } else if (currentTournamentData.type === 'double') {
        renderBracket(currentTournamentData.winnersBracket, '#winners-bracket-matches');
        renderBracket(currentTournamentData.losersBracket, '#losers-bracket-matches');
        renderBracket(currentTournamentData.grandFinal, '#final-bracket-matches');
    }
}


// --- INICIALIZAÇÃO ---
document.getElementById('generate-btn').addEventListener('click', startTournament);
document.getElementById('reset-btn').addEventListener('click', resetTournament);

// A interatividade é "ligada" uma única vez, passando as funções de controlo
setupInteractivity(getTournamentData, setTournamentData, fullRender);

window.addEventListener('resize', () => {
    if (!currentTournamentData.type) return;
    fullRender();
});

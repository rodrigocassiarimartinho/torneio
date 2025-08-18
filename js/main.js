// js/main.js - Versão com título em inglês

import { buildSingleBracketStructure } from './structures/single_bracket_structure.js';
import { buildDoubleBracketStructure } from './structures/double_bracket_structure.js';
import { populateSingleBracket } from './logic/single_player_logic.js';
import { populateDoubleBracket } from './logic/double_player_logic.js';
import { renderBracket } from './bracket_render.js';
import { parsePlayerInput } from './parsing.js';
import { setupInteractivity } from './interactivity.js';
import { stabilizeBracket } from './results.js';

let currentTournamentData = {};

const getTournamentData = () => currentTournamentData;
const setTournamentData = (newData) => {
    currentTournamentData = newData;
};

function startTournament() {
    const playerInput = document.getElementById('player-list').value;
    const tournamentType = document.querySelector('input[name="bracket-type"]:checked').value;
    
    const { unseededPlayers, seededPlayers } = parsePlayerInput(playerInput);
    const playerCount = unseededPlayers.length + seededPlayers.length;

    if (playerCount < 2) {
        alert("Please enter at least 2 players.");
        return;
    }

    document.getElementById('setup').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('winners-bracket-container').style.display = 'block';
    document.getElementById('losers-bracket-container').style.display = tournamentType === 'double' ? 'block' : 'none';
    document.getElementById('grand-final-container').style.display = tournamentType === 'double' ? 'block' : 'none';
    
    const mainBracketTitle = document.getElementById('main-bracket-title');
    mainBracketTitle.style.display = 'block'; // Garante que o título seja sempre visível
    
    if (tournamentType === 'double') {
        mainBracketTitle.textContent = 'Winners Bracket';
    } else {
        mainBracketTitle.textContent = 'Main Bracket';
    }
    
    let populatedBracket;
    if (tournamentType === 'single') {
        const structure = buildSingleBracketStructure(playerCount);
        populatedBracket = populateSingleBracket(structure, playerInput);
    } else {
        const structure = buildDoubleBracketStructure(playerCount);
        populatedBracket = populateDoubleBracket(structure, playerInput);
    }
    
    const finalInitialState = stabilizeBracket(populatedBracket);
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

document.getElementById('generate-btn').addEventListener('click', startTournament);
document.getElementById('reset-btn').addEventListener('click', resetTournament);

setupInteractivity(getTournamentData, setTournamentData, fullRender);

window.addEventListener('resize', () => {
    if (!currentTournamentData.type) return;
    fullRender();
});

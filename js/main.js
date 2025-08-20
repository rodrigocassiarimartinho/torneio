// js/main.js - Versão com botão "voltar" inteligente

// ... (imports e variáveis globais inalterados) ...

// ... (funções updateButtonStates, saveCurrentTournamentState, loadTournamentList inalteradas) ...

async function loadAndDisplayBracket(id) {
    document.getElementById('tournament-list-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';

    const adminControls = document.querySelector('.header-buttons-left');
    adminControls.style.display = isEditMode ? 'flex' : 'none';

    // --- INÍCIO DA MUDANÇA ---
    const backButton = document.getElementById('back-to-list-btn');
    if (isEditMode) {
        backButton.textContent = "Back to Admin";
    } else {
        backButton.textContent = "Back to List";
    }
    // --- FIM DA MUDANÇA ---

    try {
        const response = await fetch(`${API_URL}?id=${id}`);
        // ... (resto da função inalterado)
    } catch(error) {
        // ... (resto da função inalterado)
    }
}

// ... (função fullRender inalterada) ...

function undoAction() { /* ... */ }
function redoAction() { /* ... */ }

function backToAction() {
    // Agora verifica o modo para decidir para onde voltar
    if (isEditMode) {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'index.html';
    }
}

// --- Lógica de Inicialização da Página Pública ---
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tournamentId = params.get('id');
    isEditMode = params.get('edit') === 'true';

    if (tournamentId) {
        loadAndDisplayBracket(tournamentId);
        
        if (isEditMode) {
            // ... (setup da interatividade inalterado)
        }
        
        // O event listener do botão de voltar agora chama a nova função
        document.getElementById('back-to-list-btn').addEventListener('click', backToAction);

    } else {
        // ... (lógica de loadTournamentList inalterada)
    }
});

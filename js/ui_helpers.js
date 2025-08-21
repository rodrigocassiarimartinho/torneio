// js/ui_helpers.js
// Módulo para controlar elementos de feedback visual da UI.

/**
 * Exibe um overlay de carregamento (spinner).
 */
export function showSpinner() {
    const spinner = document.getElementById('spinner-overlay');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

/**
 * Esconde o overlay de carregamento (spinner).
 */
export function hideSpinner() {
    const spinner = document.getElementById('spinner-overlay');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

/**
 * Exibe uma notificação temporária (toast).
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} [type='success'] - O tipo de notificação ('success' ou 'error').
 * @param {number} [duration=3000] - A duração em milissegundos.
 */
export function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Animação de entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Agendamento para remover o toast
    setTimeout(() => {
        toast.classList.remove('show');
        // Espera a animação de saída terminar para remover o elemento
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

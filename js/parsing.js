// js/parsing.js
export function parsePlayerInput(input) {
    // Normaliza CRLF e garante string
    const normalized = (input || '').replace(/\r/g, '');
    const lines = normalized
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const seededPlayers = [];
    const unseededPlayers = [];
    const warnings = [];

    // Aceita: "1. Nome", "1) Nome", "1 - Nome", "1 Nome"
    const seedRegex = /^(\d+)\s*(?:[.)-]\s*|\s+)?(.+)?$/;

    const seenSeeds = new Set();

    lines.forEach((line, idx) => {
        const match = line.match(seedRegex);
        if (match) {
            const seed = parseInt(match[1], 10);
            const name = (match[2] || '').trim();

            if (!name) {
                // Linha com número mas sem nome — trata como aviso e coloca como unseeded
                warnings.push(`Linha ${idx + 1}: seed ${seed} sem nome.`);
                unseededPlayers.push({ name: '', seed: seed });
                return;
            }

            if (Number.isNaN(seed) || seed <= 0) {
                warnings.push(`Linha ${idx + 1}: seed inválida (${match[1]}). Será tratada como não-seeded.`);
                unseededPlayers.push({ name, seed: null });
                return

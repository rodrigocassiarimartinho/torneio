// js/parsing.js
export function parsePlayerInput(input) {
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    const seededPlayers = [], unseededPlayers = [];
    const seedRegex = /^\s*(\d+)\.\s*(.*)/;
    lines.forEach(line => {
        const match = line.match(seedRegex);
        if (match) {
            seededPlayers.push({ seed: parseInt(match[1]), name: match[2].trim() });
        } else {
            unseededPlayers.push({ name: line, seed: null });
        }
    });
    seededPlayers.sort((a, b) => a.seed - b.seed);
    return { seededPlayers, unseededPlayers };
}

// js/utils.js
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function generateSeedOrder(numSeeds) {
    if (numSeeds < 2) return [];
    if (numSeeds === 2) return [1, 2];
    const prevOrder = generateSeedOrder(numSeeds / 2);
    const newOrder = [];
    for (const seed of prevOrder) {
        newOrder.push(seed);
        newOrder.push(numSeeds + 1 - seed);
    }
    return newOrder;
}

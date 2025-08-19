// js/logic/double_player_logic.js
// Contém o algoritmo para popular a primeira rodada da chave dos vencedores,
// distribuindo jogadores e byes de acordo com as regras de seeding.
// A lógica é idêntica à da eliminação simples.

import { getNextPowerOfTwo } from '../math.js';
import { generateSeedOrder, shuffleArray } from '../utils.js';
import { parsePlayerInput } from '../parsing.js';

export function populateDoubleBracket(structure, playerList) {
    const { seededPlayers, unseededPlayers } = parsePlayerInput(playerList);
    const allPlayers = [...seededPlayers, ...unseededPlayers];
    const bracketSize = getNextPowerOfTwo(allPlayers.length);
    const byesCount = bracketSize - allPlayers.length;

    const seeds = [...seededPlayers];
    let others = [...unseededPlayers];
    const byes = Array.from({ length: byesCount }, (_, i) => ({ name: `BYE_${i + 1}`, isBye: true }));
    let playerSlots = new Array(bracketSize).fill(null);

    const numSeeds = seeds.length > 0 ? getNextPowerOfTwo(seeds.length) : 0;
    if (numSeeds > 0) {
        const seedOrder = generateSeedOrder(numSeeds);
        const slotsPerSubBracket = bracketSize / numSeeds;
        seedOrder.forEach((seedValue) => {
            const player = seeds.find(p => p.seed === seedValue);
            if (player) {
                const orderIndex = seedOrder.indexOf(seedValue);
                const slotIndex = orderIndex * slotsPerSubBracket;
                playerSlots[slotIndex] = player;
            }
        });
    }

    let byesToDistribute = [...byes];
    seeds.sort((a, b) => a.seed - b.seed).forEach(seed => {
        if (byesToDistribute.length > 0) {
            const p_slot = playerSlots.findIndex(p => p && p.seed === seed.seed);
            if (p_slot !== -1) {
                const o_slot = (p_slot % 2 === 0) ? p_slot + 1 : p_slot - 1;
                if (playerSlots[o_slot] === null) {
                    playerSlots[o_slot] = byesToDistribute.shift();
                }
            }
        }
    });

    shuffleArray(others);
    for (let i = 0; i < bracketSize; i += 2) {
        if (playerSlots[i] === null && playerSlots[i+1] === null && others.length > 0) {
            playerSlots[i] = others.shift();
        }
    }

    const finalDistributionPool = [...others, ...byesToDistribute];
    shuffleArray(finalDistributionPool);
    for (let i = 0; i < bracketSize; i++) {
        if (playerSlots[i] === null) {
            playerSlots[i] = finalDistributionPool.shift() || null;
        }
    }
    
    structure.winnersBracket[0].forEach((match, index) => {
        match.p1 = playerSlots[index * 2];
        match.p2 = playerSlots[index * 2 + 1];
    });

    return { type: 'double', ...structure };
}

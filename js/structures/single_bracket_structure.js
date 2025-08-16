// js/single_elimination_structure.js

/**
 * Gera a estrutura completa de uma chave de eliminação simples.
 * @param {number} totalPlayers - número de jogadores
 * @param {number} [numRounds] - número de rodadas (opcional). Se não fornecido, calcula automaticamente.
 * @returns {Object} - objeto com o array de rodadas, cada uma uma lista de partidas
 */
function generateSingleEliminationBracket(totalPlayers, numRounds) {
  const playerCount = Math.max(1, Math.floor(totalPlayers));
  const bracketSize = getNextPowerOfTwo(playerCount);
  const totalRounds = numRounds || getBracketRounds(bracketSize);
  const bracket = [];

  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = getMatchesCountInRound(round, bracketSize);
    const rodada = [];
    for (let matchIdx = 0; matchIdx < matchesInRound; matchIdx++) {
      rodada.push({
        id: `r${round}_m${matchIdx}`,
        player1: null,            // ID do jogador na rodada
        player2: null,
        seedPlayer1: null,          // Seed ou seed ranking do jogador 1
        seedPlayer2: null,
        scorePlayer1: null,         // Placar do jogador 1
        scorePlayer2: null,
        status: 'pending',          // 'pending', 'finished', etc.
        sourcePlayer1: `winner of r${round - 1}_m${Math.floor(matchIdx / 2)}`,
        sourcePlayer2: `winner of r${round - 1}_m${Math.floor(matchIdx / 2)}`
      });
    }
    bracket.push(rodada);
  }

  return {
    size: bracketSize,
    totalRounds,
    rounds: bracket,
  };
}

/* -------- funções auxiliares -------- */

function getNextPowerOfTwo(n) {
  const N = Math.max(1, Math.floor(n));
  let p = 1;
  while (p < N) p <<= 1;
  return p;
}

function getBracketRounds(bracketSize) {
  return Math.log2(bracketSize);
}

function getMatchesCountInRound(roundNumber, totalSize) {
  if (roundNumber === 1) return totalSize / 2;
  const matches = totalSize / Math.pow(2, roundNumber);
  return Math.ceil(matches);
}

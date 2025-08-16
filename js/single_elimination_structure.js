// js/single_elimination_structure.js

/**
 * Gera a estrutura completa de uma chave de eliminação simples.
 * @param {number} totalPlayers - número de jogadores
 * @param {number} [numRounds] - número de rodadas (opcional). Se não fornecido, calcula automaticamente.
 * @returns {Object} - objeto com o array de rodadas, cada uma uma lista de partidas.
 */
function generateSingleEliminationBracket(totalPlayers, numRounds) {
  // Garantir entrada numérica válida
  const playerCount = Math.max(1, Math.floor(totalPlayers));
  // Calcula o tamanho da chave (potência de dois >= totalPlayers)
  const bracketSize = getNextPowerOfTwo(playerCount);
  // Se não passar numRounds, calcular automaticamente
  const totalRounds = numRounds || getBracketRounds(bracketSize);
  
  // Criar array de rodadas: cada rodada uma lista de partidas
  const bracket = [];
  
  // Gerar as rodadas
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = getMatchesCountInRound(round, bracketSize);
    const rodada = [];
    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
      // Placeholder de partida: IDs genéricos ou vazios
      rodada.push({
        id: `r${round}_m${matchIndex}`,
        player1: null,
        player2: null,
        // Placeholder para indicar origem, por exemplo: "winner of r1_m0"
        sourcePlayer1: `winner of r${round - 1}_m${Math.floor(matchIndex / 2)}`,
        sourcePlayer2: `winner of r${round - 1}_m${Math.floor(matchIndex / 2)}`,
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

/* --- funções auxiliares --- */

function getNextPowerOfTwo(n) {
  const N = Math.max(1, Math.floor(n));
  let p = 1;
  while (p < N) p <<= 1;
  return p;
}

/**
 * Calcula o número total de rodadas necessárias para a chave
 * de tamanho brackeSize. Para eliminação simples, é sempre log2.
 */
function getBracketRounds(bracketSize) {
  return Math.log2(bracketSize);
}

/**
 * Retorna o número de partidas na rodada, que é half do tamanho
 * da rodada anterior (quando esse é o caso) ou 1 na final.
 */
function getMatchesCountInRound(round, totalSize) {
  // Na primeira rodada, há totalSize/2 partidas
  if (round === 1) return totalSize / 2;
  // Nas próximas, diminui até 1 na final
  const remainingMatches = totalSize / Math.pow(2, round);
  return Math.ceil(remainingMatches);
}

// js/single_elimination_structure.js

/**
 * Gera a estrutura completa de uma chave de eliminação simples.
 * @param {number} totalPlayers - número de jogadores
 * @param {number} [numRounds] - número de rodadas (opcional). Se não fornecido, calcula automaticamente.
 * @returns {Object} - objeto com o array de rodadas, cada uma uma lista de partidas
 */
function generateSingleEliminationBracket(totalPlayers, numRounds) {
  const playerCount = Math.max(1, Math.floor(totalPlayers));
  // Tamanho da chave: próxima potência de dois >= totalPlayers
  const bracketSize = getNextPowerOfTwo(playerCount);
  // Calcula o número de rodadas total, se não passar explicitamente
  const totalRounds = numRounds || getBracketRounds(bracketSize);

  // Array que conterá todas as rodadas, cada uma uma lista de partidas
  const bracket = [];

  // Para cada rodada, gerar as partidas
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = getMatchesCountInRound(round, bracketSize);
    const rodada = [];
    for (let matchIdx = 0; matchIdx < matchesInRound; matchIdx++) {
      // Placeholder: cada partida com IDs genéricos
      rodada.push({
        id: `r${round}_m${matchIdx}`,
        player1: null,
        player2: null,
        // Indica origem dos jogadores na próxima fase
        sourcePlayer1: `winner of r${round - 1}_m${Math.floor(matchIdx / 2)}`,
        sourcePlayer2: `winner of r${round - 1}_m${Math.floor(matchIdx / 2)}`,
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

/* --- funções auxiliares --- */

 /**
  * Calcula a próxima potência de dois >= n
  */
function getNextPowerOfTwo(n) {
  const N = Math.max(1, Math.floor(n));
  let p = 1;
  while (p < N) p <<= 1;
  return p;
}

/**
 * Retorna o número de rodadas necessárias para a chave
 * com tamanho bracketSize. Para eliminação simples,
 * será sempre log2(bracketSize).
 */
function getBracketRounds(bracketSize) {
  return Math.log2(bracketSize);
}

/**
 * Calcula o número de partidas na rodada, dado o número da rodada
 * e o tamanho total da chave.
 */
function getMatchesCountInRound(roundNumber, totalSize) {
  // Na primeira rodada, há totalSize/2 partidas
  if (roundNumber === 1) return totalSize / 2;
  // Na rodada seguinte, há metade do número anterior, até a final
  const remainingMatches = totalSize / Math.pow(2, roundNumber);
  // Sempre arredonda para cima no caso de divisões não exatas
  return Math.ceil(remainingMatches);
}

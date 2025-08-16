// js/math.js
// Utilitários matemáticos para o dimensionamento das chaves (winners/losers).
// Todas as funções assumem `bracketSize` como o tamanho da chave (slots),
// geralmente a próxima potência de dois >= número de jogadores.
// As funções são pequenas, puras e bem documentadas.

 /**
  * Retorna a menor potência de 2 maior ou igual a bracketSize.
  * Exemplo: getNextPowerOfTwo(6) => 8, getNextPowerOfTwo(8) => 8
  * @param {number} bracketSize - tamanho desejado
  * @returns {number} - próxima potência de dois >= bracketSize
  */
export function getNextPowerOfTwo(bracketSize) {
  const n = Number(bracketSize) || 0;
  if (n < 1) return 1;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * Verifica se um número é potência de dois.
 * Exemplo: isPowerOfTwo(8) => true, isPowerOfTwo(6) => false
 * @param {number} bracketSize - valor a verificar
 * @returns {boolean} - true se potência de dois, senao false
 */
export function isPowerOfTwo(bracketSize) {
  const n = Number(bracketSize) || 0;
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Retorna o número de rondas na chave dos vencedores.
 * Exemplo: se bracketSize=8, retorna 3 (8->4->2->1).
 * Para bracketSize < 2, retorna 0.
 * @param {number} bracketSize - tamanho da bracket
 * @returns {number} - número de rondas
 */
export function getWinnersBracketRoundsCount(bracketSize) {
  const size = Number(bracketSize) || 0;
  if (size < 2) return 0;
  const adj = isPowerOfTwo(size) ? size : getNextPowerOfTwo(size);
  return Math.log2(adj);
}

/**
 * Retorna o número de rondas na chave dos perdedores (para double-elim).
 * Fórmula: 2 * log2(bracketSize) - 2 (válido para bracketSize >= 4).
 * Para bracketSize < 4, retorna 0.
 * @param {number} bracketSize - tamanho da bracket
 * @returns {number} - número de rondas no bracket dos perdedores
 */
export function getLosersBracketRoundsCount(bracketSize) {
  const size = Number(bracketSize) || 0;
  if (size < 4) return 0;
  const adj = isPowerOfTwo(size) ? size : getNextPowerOfTwo(size);
  return 2 * Math.log2(adj) - 2;
}

/**
 * Número de partidas na rodada vRoundIndex (1-based) da chave dos vencedores.
 * Exemplo: 1 => bracketSize/1, 2 => bracketSize/2, etc.
 * @param {number} vRoundIndex - índice da rodada (1 = primeira)
 * @param {number} bracketSize - tamanho da bracket
 * @returns {number} - quantidade de partidas nessa rodada
 */
export function getWinnersRoundMatchCount(vRoundIndex, bracketSize) {
  const r = Number(vRoundIndex) || 1;
  const size = Number(bracketSize) || 1;
  const adj = isPowerOfTwo(size) ? size : getNextPowerOfTwo(size);
  return Math.floor(adj / Math.pow(2, r));
}

/**
 * Número de partidas na rodada pRoundIndex (1-based) da chave dos perdedores.
 * Baseado em uma fórmula aproximada para brackets de potência de dois.
 * @param {number} pRoundIndex - índice da rodada
 * @param {number} bracketSize - tamanho da bracket
 * @returns {number} - quantidade de partidas nessa rodada
 */
export function getLosersRoundMatchCount(pRoundIndex, bracketSize) {
  const p = Number(pRoundIndex) || 1;
  const size = Number(bracketSize) || 1;
  const adj = isPowerOfTwo(size) ? size : getNextPowerOfTwo(size);
  // Esta fórmula funciona para o padrão de loser's bracket em double-elim
  return Math.floor(adj / Math.pow(2, Math.ceil(p / 2) + 1));
}

/**
 * Retorna a rodada de destino do perdedor na chave dos perd

// js/double_elimination_structure.js

/**
 * Gera a estrutura completa de chaves dupla-eliminação.
 * @param {number} totalPlayers - número de jogadores
 * @param {number} [numWinnersRounds] - número de rodadas na chave dos vencedores (opcional). Se não, calcula automaticamente.
 * @param {number} [numLosersRounds] - número de rodadas na chave dos perdedores (opcional). Se não, calcula automaticamente.
 * @returns {Object} - estrutura contendo rodadas vencedoras e perdedoras
 */
function generateDoubleEliminationBracket(totalPlayers, numWinnersRounds, numLosersRounds) {
  const playerCount = Math.max(1, Math.floor(totalPlayers));
  const bracketSize = getNextPowerOfTwo(playerCount);
  const totalWinnersRounds = numWinnersRounds || getWinnersBracketRoundsCount(bracketSize);
  const totalLosersRounds = numLosersRounds || getLosersBracketRoundsCount(bracketSize);

  const winnersRounds = [];
  const losersRounds = [];

  // Gerar rodada vencedores
  for (let r = 1; r <= totalWinnersRounds; r++) {
    const matchesInRound = getMatchesCountInRound(r, bracketSize);
    const rodada = [];
    for (let m = 0; m < matchesInRound; m++) {
      rodada.push({
        id: `w_r${r}_m${m}`,
        player1: null,
        player2: null,
        seedPlayer1: null,
        seedPlayer2: null,
        scorePlayer1: null,
        scorePlayer2: null,
        status: 'pending',
        // Fonte das entradas na próxima fase
        sourcePlayer1: `winner of w_r${r - 1}_m${Math.floor(m / 2)}`,
        sourcePlayer2: `winner of w_r${r - 1}_m${Math.floor(m / 2)}`
      });
    }
    winnersRounds.push(rodada);
  }

  // Gerar rodada perdedores
  for (let r = 1; r <= totalLosersRounds; r++) {
    const matchesInRound = getLosersMatchesCount(r, bracketSize);
    const rodada = [];
    for (let m = 0; m < matchesInRound; m++) {
      rodada.push({
        id: `l_r${r}_m${m}`,
        player1: null,
        player2: null,
        seedPlayer1: null,
        seedPlayer2: null,
        scorePlayer1: null,
        scorePlayer2: null,
        status: 'pending',
        sourcePlayer1: `loser of w_r${getLoserSourceRound(r)}_m${Math.floor(m / 2)}`,
        sourcePlayer2: `loser of w_r${getLoserSourceRound(r)}_m${Math.floor(m / 2)}`
      });
    }
    losersRounds.push(rodada);
  }

  return {
    size: bracketSize,
    winnersRounds,
    losersRounds
  };
}

/**
 * Funções auxiliares
 */

function getNextPowerOfTwo(n) {
  const N = Math.max(1, Math.floor(n));
  let p = 1;
  while (p < N) p <<= 1;
  return p;
}

function getWinnersBracketRoundsCount(bracketSize) {
  return Math.log2(bracketSize);
}

function getLosersBracketRoundsCount(bracketSize) {
  return Math.max(0, 2 * Math.log2(bracketSize) - 2);
}

function getMatchesCountInRound(round, totalSize) {
  if (round === 1) return totalSize / 2;
  return Math.ceil(totalSize / Math.pow(2, round));
}

function getLosersMatchesCount(r, totalSize) {
  const p = Math.ceil(r / 2);
  return Math.ceil(totalSize / Math.pow(2, p + 1));
}

function getLoserSourceRound(r) {
  return r;
}

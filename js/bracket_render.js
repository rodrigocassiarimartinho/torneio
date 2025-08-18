// js/bracket_render.js - Versão final com todas as melhorias visuais

const CONFIG = {
    SVG_WIDTH: 300,
    SVG_HEIGHT: 65,
    ID_COLUMN_WIDTH: 35,
    SCORE_BOX_WIDTH: 55,
    SCORE_BOX_HEIGHT: 30,
    MATCH_MARGIN_X: 20,
    VERTICAL_GAP: 20,
    ROUND_GAP: 40,
};

function createMatchSVG(matchData) {
    // Bloco de código específico para a caixa do campeão
    if (matchData.isChampionBox) {
        const winner = matchData.p1 || { name: 'TBD', isPlaceholder: true };
        const winnerName = winner.name.length > 25 ? winner.name.substring(0, 22) + '...' : winner.name;
        const nameClass = winner.isPlaceholder ? 'svg-text-name svg-text-placeholder' : 'svg-text-name';

        // CORREÇÕES APLICADAS AQUI:
        return `
            <svg width="${CONFIG.SVG_WIDTH}" height="${CONFIG.SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="${CONFIG.SVG_WIDTH - 1}" height="${CONFIG.SVG_HEIGHT - 1}" rx="6" fill="#041A4A" stroke="#041A4A" stroke-width="1"/>
                <text x="50%" y="22" dominant-baseline="middle" text-anchor="middle" font-size="16" font-weight="600" fill="#FFFFFF">Champion</text>
                <text x="50%" y="49" dominant-baseline="middle" text-anchor="middle" class="${nameClass}" font-size="18" fill="#FFFFFF">${winnerName}</text>
            </svg>
        `;
    }

    // Lógica para partidas normais
    const p1_Y = 18, p2_Y = 47;
    let p1 = { name: 'Bye', seed: null, ...matchData.p1 };
    let p2 = { name: 'Bye', seed: null, ...matchData.p2 };

    if (p1.isBye) p1.name = 'Bye';
    if (p2.isBye) p2.name = 'Bye';
    if (p1.name.length > 30) p1.name = p1.name.substring(0, 27) + '...';
    if (p2.name.length > 30) p2.name = p2.name.substring(0, 27) + '...';

    const seedX = CONFIG.ID_COLUMN_WIDTH + 5;
    const nameX = CONFIG.ID_COLUMN_WIDTH + 30;

    const seed1HTML = p1.seed ? `<text x="${seedX}" y="${p1_Y}" dominant-baseline="middle" class="svg-text-seed" fill="#041A4A">[${p1.seed}]</text>` : '';
    const seed2HTML = p2.seed ? `<text x="${seedX}" y="${p2_Y}" dominant-baseline="middle" class="svg-text-seed" fill="#041A4A">[${p2.seed}]</text>` : '';
    const name1Class = (p1.isPlaceholder || p1.name === 'Bye') ? 'svg-text-name svg-text-placeholder' : 'svg-text-name';
    const name2Class = (p2.isPlaceholder || p2.name === 'Bye') ? 'svg-text-name svg-text-placeholder' : 'svg-text-name';

    let scoreOptions = `<option value="--">--</option><option value="WO">WO</option>`;
    for(let i = 0; i <= 31; i++) { scoreOptions += `<option value="${i}">${i}</option>`; }

    const isDisabled = name1Class.includes('placeholder') || name2Class.includes('placeholder') || p1.name === 'Bye' || p2.name === 'Bye';
    const isByeMatch = p1.isBye || p2.isBye;
    let scoreInputsHTML = '';

    if (!isByeMatch) {
        const scoreInput1 = `<foreignObject x="${CONFIG.SVG_WIDTH - CONFIG.SCORE_BOX_WIDTH - 7}" y="${p1_Y - CONFIG.SCORE_BOX_HEIGHT/2}" width="${CONFIG.SCORE_BOX_WIDTH}" height="${CONFIG.SCORE_BOX_HEIGHT}"><select class="score-select" data-match-id="${matchData.id}" data-player-slot="p1" ${isDisabled ? 'disabled' : ''}>${scoreOptions}</select></foreignObject>`;
        const scoreInput2 = `<foreignObject x="${CONFIG.SVG_WIDTH - CONFIG.SCORE_BOX_WIDTH - 7}" y="${p2_Y - CONFIG.SCORE_BOX_HEIGHT/2}" width="${CONFIG.SCORE_BOX_WIDTH}" height="${CONFIG.SCORE_BOX_HEIGHT}"><select class="score-select" data-match-id="${matchData.id}" data-player-slot="p2" ${isDisabled ? 'disabled' : ''}>${scoreOptions}</select></foreignObject>`;
        scoreInputsHTML = scoreInput1 + scoreInput2;
    }

    return `<svg width="${CONFIG.SVG_WIDTH}" height="${CONFIG.SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="${CONFIG.SVG_WIDTH - 1}" height="${CONFIG.SVG_HEIGHT - 1}" rx="6" fill="#E9ECEF" stroke="#DEE2E6" stroke-width="1"/><path d="M 0 6 C 0 2.686 2.686 0 6 0 H ${CONFIG.ID_COLUMN_WIDTH} V ${CONFIG.SVG_HEIGHT} H 6 C 2.686 ${CONFIG.SVG_HEIGHT} 0 ${CONFIG.SVG_HEIGHT-2.686} 0 ${CONFIG.SVG_HEIGHT-6} V 6 Z" fill="#D9A42A"/><text x="${CONFIG.ID_COLUMN_WIDTH / 2}" y="${CONFIG.SVG_HEIGHT / 2}" dominant-baseline="middle" text-anchor="middle" class="svg-text-id" fill="#041A4A">M${matchData.id}</text><line x1="${CONFIG.ID_COLUMN_WIDTH + 5}" y1="${CONFIG.SVG_HEIGHT / 2}" x2="${CONFIG.SVG_WIDTH - CONFIG.SCORE_BOX_WIDTH - 20}" y2="${CONFIG.SVG_HEIGHT / 2}" stroke="#DEE2E6" stroke-width="1" stroke-dasharray="3 3"/><g>${seed1HTML}<text x="${nameX}" y="${p1_Y}" dominant-baseline="middle" class="${name1Class}" fill="#041A4A">${p1.name}</text></g><g>${seed2HTML}<text x="${nameX}" y="${p2_Y}" dominant-baseline="middle" class="${name2Class}" fill="#041A4A">${p2.name}</text></g>${scoreInputsHTML}</svg>`;
}

function layoutBracket(targetSelector) {
    const matchesContainer = document.querySelector(targetSelector);
    if (!matchesContainer) return;

    const rounds = Array.from(matchesContainer.querySelectorAll('.round'));
    if (rounds.length === 0 || rounds[0].children.length === 0) { return; };
    
    const blockHeight = CONFIG.SVG_HEIGHT + CONFIG.VERTICAL_GAP;
    const firstRoundMatchCount = rounds[0].children.length;
    const totalBracketHeight = firstRoundMatchCount * blockHeight;

    rounds.forEach((roundEl) => {
        const matchesInThisRound = Array.from(roundEl.children);
        const numMatches = matchesInThisRound.length;
        if (numMatches === 0) return;

        const roundWidth = CONFIG.SVG_WIDTH + (CONFIG.MATCH_MARGIN_X * 2);
        roundEl.style.width = `${roundWidth}px`;
        
        const slotHeight = totalBracketHeight / numMatches;

        matchesInThisRound.forEach((match, matchIndex) => {
            const centerY = (matchIndex * slotHeight) + (slotHeight / 2);
            const topPos = centerY - (CONFIG.SVG_HEIGHT / 2);
            match.style.top = `${topPos}px`;
            match.style.left = `${CONFIG.MATCH_MARGIN_X}px`;
        });
    });

    const wrapperEl = matchesContainer.closest('.bracket-wrapper');
    const svgEl = wrapperEl.querySelector('.connector-svg');

    matchesContainer.style.height = `${totalBracketHeight}px`;
    wrapperEl.style.height = `${totalBracketHeight + 40}px`;
    svgEl.style.height = `${totalBracketHeight + 40}px`;
}

function drawConnectors(targetSelector) {
    const matchesContainer = document.querySelector(targetSelector);
    if (!matchesContainer) return;

    const wrapper = matchesContainer.closest('.bracket-wrapper');
    const svg = wrapper.querySelector('.connector-svg');
    if (!svg || !wrapper) return;
    svg.innerHTML = ''; 

    const rounds = matchesContainer.querySelectorAll('.round');
    const horizontalMidpoint = CONFIG.ROUND_GAP / 2;

    for (let r = 0; r < rounds.length; r++) {
        const currentRoundMatches = Array.from(rounds[r].querySelectorAll('.match'));
        
        currentRoundMatches.forEach((match) => {
            const matchRect = match.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();
            const startY = matchRect.top + matchRect.height / 2 - wrapperRect.top;
            
            if (r < rounds.length - 1) {
                const isChampionBox = !!match.querySelector('rect[fill="#041A4A"]');
                if(!isChampionBox) {
                    const startX = matchRect.right - wrapperRect.left;
                    const endX = startX + horizontalMidpoint;
                    createLine(startX, startY, endX, startY, svg);
                }
            }
            
            if (r > 0) {
                const endX = matchRect.left - wrapperRect.left;
                const startX = endX - horizontalMidpoint;
                createLine(startX, startY, endX, startY, svg);
            }
        });
    }

    for (let r = 0; r < rounds.length - 1; r++) {
        const currentRoundMatches = rounds[r].querySelectorAll('.match');
        const nextRoundMatches = rounds[r+1].querySelectorAll('.match');

        if (nextRoundMatches.length === currentRoundMatches.length / 2) {
             nextRoundMatches.forEach((childMatch, childIndex) => {
                const parent1 = currentRoundMatches[childIndex * 2];
                const parent2 = currentRoundMatches[childIndex * 2 + 1];
                if(parent1 && parent2) {
                    const p1Rect = parent1.getBoundingClientRect();
                    const p2Rect = parent2.getBoundingClientRect();
                    const wrapperRect = wrapper.getBoundingClientRect();

                    const midX = p1Rect.right - wrapperRect.left + horizontalMidpoint;
                    const y1 = p1Rect.top + p1Rect.height / 2 - wrapperRect.top;
                    const y2 = p2Rect.top + p2Rect.height / 2 - wrapperRect.top;
                    createLine(midX, y1, midX, y2, svg);
                }
             });
        }
    }
}

function createLine(x1, y1, x2, y2, svg) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
    path.setAttribute('stroke', '#d0d6db');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);
}

function updateDropdownValues(roundsData, targetSelector) {
    if(!roundsData) return;
    const container = document.querySelector(targetSelector);
    if(!container) return;
    
    const allMatches = roundsData.flat();
    const selects = container.querySelectorAll('.score-select');

    selects.forEach(select => {
        const matchId = parseInt(select.dataset.matchId);
        const playerSlot = select.dataset.playerSlot;
        const match = allMatches.find(m => m && m.id === matchId);
        if (match && match[playerSlot] && match[playerSlot].score !== undefined) {
            select.value = match[playerSlot].score;
        } else {
            select.value = "--";
        }
    });
}

export function runLayoutAndDraw(targetSelector, roundsData) {
    layoutBracket(targetSelector);
    window.requestAnimationFrame(() => {
        drawConnectors(targetSelector);
        updateDropdownValues(roundsData, targetSelector);
    });
}

export function renderBracket(roundsData, targetSelector) {
    const container = document.querySelector(targetSelector);
    if (!container) return;
    container.innerHTML = '';
    if (!roundsData || roundsData.length === 0) return;

    roundsData.forEach(roundData => {
        const roundEl = document.createElement('div');
        roundEl.className = 'round';
        (roundData || []).forEach(matchData => {
            if (!matchData) return;
            const matchEl = document.createElement('div');
            matchEl.className = 'match';
            matchEl.id = `match-${matchData.id}`;
            matchEl.innerHTML = createMatchSVG(matchData);
            roundEl.appendChild(matchEl);
        });
        container.appendChild(roundEl);
    });
    
    runLayoutAndDraw(targetSelector, roundsData);
}

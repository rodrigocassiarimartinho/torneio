// js/bracket_render.js - Versão com a correção do espaçamento horizontal

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
    const p1_Y = 18, p2_Y = 47;
    let p1 = { name: 'BYE', seed: null, ...matchData.p1 };
    let p2 = { name: 'BYE', seed: null, ...matchData.p2 };

    if (p1.isBye) p1.name = 'BYE';
    if (p2.isBye) p2.name = 'BYE';

    if (p1.name.length > 30) p1.name = p1.name.substring(0, 27) + '...';
    if (p2.name.length > 30) p2.name = p2.name.substring(0, 27) + '...';

    const seedX = CONFIG.ID_COLUMN_WIDTH + 5;
    const nameX = CONFIG.ID_COLUMN_WIDTH + 30;
    const seed1HTML = p1.seed ? `<text x="${seedX}" y="${p1_Y}" dominant-baseline="middle" class="svg-text-seed" fill="#041A4A">[${p1.seed}]</text>` : '';
    const seed2HTML = p2.seed ? `<text x="${seedX}" y="${p2_Y}" dominant-baseline="middle" class="svg-text-seed" fill="#041A4A">[${p2.seed}]</text>` : '';
    
    const name1Class = (p1.isPlaceholder || p1.name === 'BYE') ? 'svg-text-name svg-text-placeholder' : 'svg-text-name';
    const name2Class = (p2.isPlaceholder || p2.name === 'BYE') ? 'svg-text-name svg-text-placeholder' : 'svg-text-name';

    let scoreOptions = `<option value="--">--</option><option value="WO">WO</option>`;
    for(let i = 0; i <= 31; i++) { scoreOptions += `<option value="${i}">${i}</option>`; }
    const isDisabled = name1Class.includes('placeholder') || name2Class.includes('placeholder') || p1.name === 'BYE' || p2.name === 'BYE';

    const scoreInput1 = `<foreignObject x="${CONFIG.SVG_WIDTH - CONFIG.SCORE_BOX_WIDTH - 7}" y="${p1_Y - CONFIG.SCORE_BOX_HEIGHT/2}" width="${CONFIG.SCORE_BOX_WIDTH}" height="${CONFIG.SCORE_BOX_HEIGHT}"><select class="score-select" data-match-id="${matchData.id}" data-player-slot="p1" ${isDisabled ? 'disabled' : ''}>${scoreOptions}</select></foreignObject>`;
    const scoreInput2 = `<foreignObject x="${CONFIG.SVG_WIDTH - CONFIG.SCORE_BOX_WIDTH - 7}" y="${p2_Y - CONFIG.SCORE_BOX_HEIGHT/2}" width="${CONFIG.SCORE_BOX_WIDTH}" height="${CONFIG.SCORE_BOX_HEIGHT}"><select class="score-select" data-match-id="${matchData.id}" data-player-slot="p2" ${isDisabled ? 'disabled' : ''}>${scoreOptions}</select></foreignObject>`;

    return `<svg width="${CONFIG.SVG_WIDTH}" height="${CONFIG.SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="${CONFIG.SVG_WIDTH - 1}" height="${CONFIG.SVG_HEIGHT - 1}" rx="6" fill="#E9ECEF" stroke="#DEE2E6" stroke-width="1"/><path d="M 0 6 C 0 2.686 2.686 0 6 0 H ${CONFIG.ID_COLUMN_WIDTH} V ${CONFIG.SVG_HEIGHT} H 6 C 2.686 ${CONFIG.SVG_HEIGHT} 0 ${CONFIG.SVG_HEIGHT-2.686} 0 ${CONFIG.SVG_HEIGHT-6} V 6 Z" fill="#D9A42A"/><text x="${CONFIG.ID_COLUMN_WIDTH / 2}" y="${CONFIG.SVG_HEIGHT / 2}" dominant-baseline="middle" text-anchor="middle" class="svg-text-id" fill="#041A4A">M${matchData.id}</text><line x1="${CONFIG.ID_COLUMN_WIDTH + 5}" y1="${CONFIG.SVG_HEIGHT / 2}" x2="${CONFIG.SVG_WIDTH - CONFIG.SCORE_BOX_WIDTH - 20}" y2="${CONFIG.SVG_HEIGHT / 2}" stroke="#DEE2E6" stroke-width="1" stroke-dasharray="3 3"/><g>${seed1HTML}<text x="${nameX}" y="${p1_Y}" dominant-baseline="middle" class="${name1Class}" fill="#041A4A">${p1.name}</text></g><g>${seed2HTML}<text x="${nameX}" y="${p2_Y}" dominant-baseline="middle" class="${name2Class}" fill="#041A4A">${p2.name}</text></g>${scoreInput1}${scoreInput2}</svg>`;
}

function layoutBracket(targetSelector) {
    const matchesContainer = document.querySelector(targetSelector);
    if (!matchesContainer) return;
    const rounds = Array.from(matchesContainer.querySelectorAll('.round'));
    if (rounds.length === 0 || rounds[0].children.length === 0) {
        matchesContainer.style.height = 'auto';
        const wrapperEl = matchesContainer.closest('.bracket-wrapper');
        if(wrapperEl) wrapperEl.style.height = 'auto';
        return;
    };
    
    const blockHeight = CONFIG.SVG_HEIGHT + CONFIG.VERTICAL_GAP;
    const firstRoundMatchCount = rounds[0].children.length;
    const totalBracketHeight = firstRoundMatchCount * blockHeight;

    rounds.forEach((roundEl, roundIndex) => {
        const matchesInThisRound = Array.from(roundEl.children);
        const numMatches = matchesInThisRound.length;
        if (numMatches === 0) return;
        
        // **INÍCIO DA CORREÇÃO**
        // A largura da coluna da rodada NÃO deve incluir o espaçamento entre as rodadas.
        const roundColumnWidth = CONFIG.SVG_WIDTH + (CONFIG.MATCH_MARGIN_X * 2);
        roundEl.style.width = `${roundColumnWidth}px`;
        // **FIM DA CORREÇÃO**
        
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
    // ... (função inalterada, já está correta)
}

function createLine(x1, y1, x2, y2, svg) {
    // ... (função inalterada)
}

export function runLayoutAndDraw(targetSelector, roundsData) {
    layoutBracket(targetSelector);
    window.requestAnimationFrame(() => {
        drawConnectors(targetSelector);
        updateDropdownValues(roundsData, targetSelector);
    });
}

function updateDropdownValues(roundsData, targetSelector) {
    // ... (função inalterada)
}

export function renderBracket(roundsData, targetSelector) {
    // ... (função inalterada)
}

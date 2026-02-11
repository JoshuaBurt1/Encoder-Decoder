const CoordinateMappers = {
    shell: (n) => {
        if (n <= 0) return { x: 0, y: 0 };
        if (n === 1) return { x: 0, y: 0 };

        let k = Math.floor(Math.sqrt(n - 1));
        let offset = n - (k * k);
        if (offset <= k + 1) { 
            return { x: k, y: offset - 1 };
        } else {
            let xCoord = k - (offset - (k + 1));
            return { x: xCoord, y: k };
        }
    }
};

const MP_EXPONENTS = new Set([
    2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 
    3217, 4253, 4423, 9689, 9941, 11213, 19937, 21701, 23209, 44497, 86243, 
    110503, 132049, 216091, 756839, 859433, 1257787, 1398269, 2976221, 
    3021377, 6972593, 13466917, 20996011, 24036583, 25964951, 30402457, 
    32582657, 37156667, 42643801, 43112609, 57885161, 74207281, 77232917, 82589933, 136279841
]);

function findConnectedSets(grid, targetSequence) {
    const rows = grid.length;
    if (rows === 0) return [];
    const cols = grid[0].length;
    const seqLen = targetSequence.length;
    
    // Count occurrences needed (like Counter in Python)
    const targetCounts = {};
    targetSequence.forEach(val => targetCounts[val] = (targetCounts[val] || 0) + 1);

    const allPaths = [];
    const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    function dfs(r, c, currentPath, currentCounts) {
        if (currentPath.length === seqLen) {
            allPaths.push([...currentPath]);
            return;
        }

        for (let [dr, dc] of directions) {
            let nr = r + dr, nc = c + dc;
            
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                // Ensure we don't reuse the same cell in a single path
                if (!currentPath.some(p => p.r === nr && p.c === nc)) {
                    let val = grid[nr][nc].val;
                    if (targetCounts[val] && (currentCounts[val] || 0) < targetCounts[val]) {
                        currentCounts[val] = (currentCounts[val] || 0) + 1;
                        currentPath.push({ r: nr, c: nc });
                        dfs(nr, nc, currentPath, currentCounts);
                        // Backtrack
                        currentPath.pop();
                        currentCounts[val] -= 1;
                    }
                }
            }
        }
    }

    // Start DFS from any cell containing a number in our target sequence
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let val = grid[r][c].val;
            if (targetCounts[val]) {
                dfs(r, c, [{ r: r, c: c }], { [val]: 1 });
            }
        }
    }

    return allPaths;
}

function renderWithMatrixHighlighting(data) {
    let output = `VALUE | SHELL EQ | [R,C] | (P, S, PS) | HEX\n${"-".repeat(80)}\n`;

    data.forEach((row, i) => {
        // Check neighbors for highlighting (Vertical & Diagonal)
        const neighbors = data.filter(other => Math.abs(other.y - row.y) === 1);
        
        // Define which values in this row deserve highlighting
        const checkValue = (val) => {
            const isExact = MP_EXPONENTS.has(val) || val === 2434;
            const isAnagram = Array.from(MP_EXPONENTS).some(mp => getSortKey(mp) === getSortKey(val));
            return { isExact, isAnagram };
        };

        // Helper to wrap text in <span> based on coordinate rules
        const style = (val) => {
            const status = checkValue(val);
            if (!status.isExact && !status.isAnagram) return val;
            
            // Logic: Highlighting triggers if neighbor also has a special value 
            // in a nearby column (e.g., Total column, or R column)
            const color = status.isAnagram ? '#00ffff' : '#ffff00';
            return `<span style="background-color:${color}; font-weight:bold;">${val}</span>`;
        };

        // Construct the row string using the styled values
        const shellStr = `${row.total}=${row.shell.base}*${row.shell.base}${row.shell.op}${row.shell.val}`;
        
        output += `${style(row.total).toString().padStart(5)} | ` +
                  `${shellStr.padEnd(15)} | ` +
                  `[R:${style(row.coords.r)}, C:${style(row.coords.c)}] | ` +
                  `(P:${style(row.math.p)}, S:${style(row.math.s)}, PS:${style(row.math.ps)}) | ` +
                  `{L:${row.hex.L}, ${row.hex.sum}+${row.hex.off}}\n`;
    });

    return output;
}
function applyMPHighlighting(text, targetSet) {
    const lines = text.split('\n');
    const grid = lines.map(line => line.split(''));
    const highlightMap = grid.map(line => line.map(() => ({ active: false, color: 'yellow' })));
    
    // 1. Map all numbers found in the text to a 'Matrix' coordinate system
    const numberPositions = [];
    lines.forEach((line, y) => {
        const regex = /\d+/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            numberPositions.push({
                val: parseInt(match[0]),
                y: y,
                xStart: match.index,
                xEnd: match.index + match[0].length - 1
            });
        }
    });

    // 2. Identify 'Sequences' (The Snaking Logic)
    // We treat numberPositions as a graph. 
    // Two numbers are "connected" if they are within 1 row and 1 "column" block of each other
    const sequenceToFind = [4, 3, 4, 2]; // Your vertical string test
    
    // (Logic for findConnectedSets would go here, checking numberPositions 
    // instead of a strict 2D array to account for text spacing)
    
    // 3. Apply standard MP Highlights (Exact & Anagram)
    const mpSortKeys = new Map();
    targetSet.forEach(val => mpSortKeys.set(getSortKey(val), val));

    numberPositions.forEach(num => {
        let type = targetSet.has(num.val) ? 'exact' : (mpSortKeys.has(getSortKey(num.val)) ? 'anagram' : null);
        
        // If it's a target number, highlight it
        if (type) {
            const color = (type === 'anagram') ? 'cyan' : 'yellow';
            for (let x = num.xStart; x <= num.xEnd; x++) {
                highlightMap[num.y][x].active = true;
                highlightMap[num.y][x].color = color;
            }
        }
    });

    // 4. Final Render
    return grid.map((line, y) => line.map((char, x) => {
        const cell = highlightMap[y][x];
        return cell.active ? `<span style="background-color: ${cell.color === 'cyan' ? '#00ffff' : '#ffff00'}; color: black; font-weight: bold;">${char}</span>` : char;
    }).join('')).join('\n');
}

// --- CALCULATION LOGIC ---
const charts = {
    hebrew: { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 },
    greek: { 'α': 1, 'β': 2, 'γ': 3, 'δ': 4, 'ε': 5, 'ζ': 7, 'η': 8, 'θ': 9, 'ι': 10, 'κ': 20, 'λ': 30, 'μ': 40, 'ν': 50, 'ξ': 60, 'ο': 70, 'π': 80, 'ρ': 100, 'σ': 200, 'ς': 200, 'τ': 300, 'υ': 400, 'φ': 500, 'χ': 600, 'ψ': 700, 'ω': 800 },
    arabic: { 'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9, 'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90, 'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000 },
    indian: { 'क': 1, 'ख': 2, 'ग': 3, 'घ': 4, 'ङ': 5, 'च': 6, 'छ': 7, 'ज': 8, 'झ': 9, 'ञ': 0, 'ट': 1, 'ठ': 2, 'ड': 3, 'ढ': 4, 'ण': 5, 'त': 6, 'थ': 7, 'द': 8, 'ध': 9, 'न': 0, 'प': 1, 'फ': 2, 'ब': 3, 'भ': 4, 'म': 5, 'य': 1, 'र': 2, 'ल': 3, 'व': 4, 'श': 5, 'ष': 6, 'स': 7, 'ह': 8 }
};

// Add helper at the top level
const getSortKey = (num) => num.toString().split('').sort().join('');

function performCalculation() {
    const rawText = document.getElementById('gematriaEntry').value;
    const system = document.getElementById('scriptSelect').value;
    const breakdownEl = document.getElementById('breakdownArea');
    const resultEl = document.getElementById('gematriaResult');
    const chart = charts[system];

    if (!rawText.trim()) return;

    const segments = rawText.split(/([,;.:])/).filter(s => s && s.trim().length > 0);
    const punctuationMarkers = [',', ';', '.', ':'];
    
    let globalTotal = 0;
    let activeLetterCount = 0;
    let stepByStepArr = [];
    let wordSummationArr = [];
    let punctuationLinesRaw = [];

    // Include your test value in the MP set for this session
    const activeTargets = new Set(MP_EXPONENTS);
    segments.forEach(segment => {
        if (punctuationMarkers.includes(segment)) return;

        const words = segment.trim().split(/\s+/).filter(w => w.length > 0);
        let segmentSum = 0;
        let segmentWordTotals = [];

        words.forEach(word => {
            const normalizedWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            let wordTotal = 0;
            let wordSteps = [];

            for (let c of normalizedWord) {
                if (chart[c] !== undefined) {
                    const val = chart[c];
                    wordTotal += val;
                    activeLetterCount++;
                    wordSteps.push(`${c}(${val})`);
                }
            }

            if (wordTotal > 0) {
                const stepsString = wordSteps.join(' + ');
                stepByStepArr.push(`${wordTotal} = ${stepsString} : \u200E${word}`);               

                // --- GEOMETRY CALCULATIONS ---
                const sPos = CoordinateMappers.shell(wordTotal);
                const R = Math.floor(sPos.y) + 1;
                const C = Math.floor(sPos.x) + 1;
                const prod = R * C;
                const sum = R + C;
                const ps = prod + sum;

                const root = Math.floor(Math.sqrt(wordTotal));
                const rem = wordTotal - (root * root);
                let shellEq = (rem > root) 
                    ? `${wordTotal}=${root+1}*${root+1}-${(root+1)**2 - wordTotal}` 
                    : `${wordTotal}=${root}*${root}+${rem}`;

                let hexLayer = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - wordTotal))) / 6);
                let s = BigInt(Math.max(0, hexLayer - 1));
                let hexSum = Number(3n * s * s - 3n * s + 1n);
                let hexOffset = wordTotal - hexSum;

                // FIXED: String assembly
                const wordEntry = `${shellEq.padEnd(15)} | R:${R}, C:${C} | ` +
                                `(${R}*${C}=${prod}, ${R}+${C}=${sum}, PS:${ps}) | ` +
                                `L:${hexLayer}, ${hexSum}+${hexOffset}`;
                wordSummationArr.push(wordEntry);
                
                segmentWordTotals.push(wordTotal);
                segmentSum += wordTotal;
                globalTotal += wordTotal;
            }
        });

        if (segmentWordTotals.length > 0) {
            punctuationLinesRaw.push({ eq: segmentWordTotals.join(' + '), sum: segmentSum });
        }
    });

    // --- FREQUENCY LOGIC ---
    const charFrequencyMap = {};
    const occurrenceOrder = [];
    for (let char of rawText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()) {
        if (chart[char] !== undefined) {
            if (!charFrequencyMap[char]) {
                charFrequencyMap[char] = 0;
                occurrenceOrder.push(char);
            }
            charFrequencyMap[char]++;
        }
    }
    const charData = occurrenceOrder.map(c => ({ char: c, freq: charFrequencyMap[c], product: chart[c] * charFrequencyMap[c] }));
    const formatFreqWrapped = (dataArr) => {
        let lines = [], currentLine = "";
        dataArr.forEach(item => {
            const entry = `\u200E${item.char}*${item.freq}=${item.product}`;
            if ((currentLine + entry).length > 256) { lines.push(currentLine.trim()); currentLine = entry + "; "; }
            else { currentLine += entry + "; "; }
        });
        if (currentLine) lines.push(currentLine.trim().replace(/;$/, ''));
        return lines.join('\n');
    };

    // --- FINAL OUTPUT ASSEMBLY ---
    let output = `CHARACTER BREAKDOWN:\n${stepByStepArr.join('\n')}\n\n`;
    output += `FREQUENCY (ORDER OF OCCURRENCE):\n${formatFreqWrapped(charData)}\n\n`;
    output += `FREQUENCY (HIGHEST FREQUENCY):\n${formatFreqWrapped([...charData].sort((a,b) => b.freq - a.freq))}\n\n`;

    output += `WORD SUMMATION (SQUARE & HEXAGONAL GEOMETRY):\n`;
    output += `SHELL EQ.      | SQUARE [R,C] | (R*C=P, R+C=S, PS) | HEXAGON {L, S+O}\n`;
    output += `${"-".repeat(100)}\n`;
    output += `${wordSummationArr.join('\n')}\n\n`;

    output += `PUNCTUATION SUMMATION:\n`;
    const formattedPunctuation = punctuationLinesRaw.map(item => {
        const sPos = CoordinateMappers.shell(item.sum);
        const R = Math.floor(sPos.y) + 1;
        const C = Math.floor(sPos.x) + 1;
        const prod = R * C; const sum = R + C; const ps = prod + sum;
        const root = Math.floor(Math.sqrt(item.sum));
        const rem = item.sum - (root * root);
        const shellEq = `${item.sum}=${root}*${root}+${rem}`;

        let hexLayer = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - item.sum))) / 6);
        let s = BigInt(Math.max(0, hexLayer - 1));
        let hexSum = Number(3n * s * s - 3n * s + 1n);
        let hexOffset = item.sum - hexSum;

        return `${item.eq} = ${item.sum} | ${shellEq} | [R:${R}, C:${C}] | (${R}*${C}=${prod}, ${R}+${C}=${sum}, PS:${ps}) | {L:${hexLayer}, ${hexSum}+${hexOffset}}`;
    });
    output += `${formattedPunctuation.join('\n')}\n\n`;

    output += `CUMULATIVE PUNCTUATION SUMMATION:\n`;
    let runningCumulative = 0;
    const formattedCumulative = punctuationLinesRaw.map(item => {
        runningCumulative += Number(item.sum);
        const sPos = CoordinateMappers.shell(runningCumulative);
        const R = Math.floor(sPos.y) + 1;
        const C = Math.floor(sPos.x) + 1;
        const prod = R * C; const sum = R + C; const ps = prod + sum;
        const root = Math.floor(Math.sqrt(runningCumulative));
        const rem = runningCumulative - (root * root);
        const shellEq = `${runningCumulative}=${root}*${root}+${rem}`;

        let hexLayer = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - runningCumulative))) / 6);
        let s = BigInt(Math.max(0, hexLayer - 1));
        let hexSum = Number(3n * s * s - 3n * s + 1n);
        let hexOffset = runningCumulative - hexSum;

        return `${item.sum} -> ${runningCumulative} | ${shellEq} | [R:${R}, C:${C}] | (${R}*${C}=${prod}, ${R}+${C}=${sum}, PS:${ps}) | {L:${hexLayer}, ${hexSum}+${hexOffset}}`;
    });
    output += `${formattedCumulative.join('\n')}`;

    breakdownEl.innerHTML = applyMPHighlighting(output, activeTargets);    
    resultEl.innerText = globalTotal;
    document.getElementById('wordCount').innerText = wordSummationArr.length;
    document.getElementById('letterCount').innerText = activeLetterCount;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateBtn').addEventListener('click', performCalculation);
});
const CoordinateMappers = {
    shell: (n) => {
        if (n <= 1) return { x: 0, y: 0 };
        let k = Math.floor(Math.sqrt(n - 1));
        let offset = n - (k * k);
        return (offset <= k + 1) ? { x: k, y: offset - 1 } : { x: k - (offset - (k + 1)), y: k };
    }
};

// --- CALCULATION LOGIC ---
const charts = {
    hebrew: { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 },
    greek: { 'α': 1, 'β': 2, 'γ': 3, 'δ': 4, 'ε': 5, 'ζ': 7, 'η': 8, 'θ': 9, 'ι': 10, 'κ': 20, 'λ': 30, 'μ': 40, 'ν': 50, 'ξ': 60, 'ο': 70, 'π': 80, 'ρ': 100, 'σ': 200, 'ς': 200, 'τ': 300, 'υ': 400, 'φ': 500, 'χ': 600, 'ψ': 700, 'ω': 800 },
    arabic: { 'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9, 'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90, 'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000 },
    indian: { 'क': 1, 'ख': 2, 'ग': 3, 'घ': 4, 'ङ': 5, 'च': 6, 'छ': 7, 'ज': 8, 'झ': 9, 'ञ': 0, 'ट': 1, 'ठ': 2, 'ड': 3, 'ढ': 4, 'ण': 5, 'त': 6, 'थ': 7, 'द': 8, 'ध': 9, 'न': 0, 'प': 1, 'फ': 2, 'ब': 3, 'भ': 4, 'म': 5, 'य': 1, 'र': 2, 'ल': 3, 'व': 4, 'श': 5, 'ष': 6, 'स': 7, 'ह': 8 }
};
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

    const pad = (str, len) => str.toString().padEnd(len, ' ');
    const alignNum = (num, len) => num.toString().padStart(len, ' ');

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
                    wordTotal += chart[c];
                    activeLetterCount++;
                    wordSteps.push(`${c}(${chart[c]})`);
                }
            }

            if (wordTotal > 0) {
                stepByStepArr.push(`${word}: ${wordSteps.join(' + ')} = ${wordTotal}`);
                
                const sPos = CoordinateMappers.shell(wordTotal);
                const R = Math.floor(sPos.y) + 1;
                const C = Math.floor(sPos.x) + 1;
                const prod = R * C;
                const sum = R + C;
                const prodSum = prod + sum;

                let hexLayer = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - wordTotal))) / 6);
                let s = BigInt(Math.max(0, hexLayer - 1));
                let hexSum = Number(3n * s * s - 3n * s + 1n);
                let hexOffset = wordTotal - hexSum;

                // --- WORD TABLE ENTRY (MUST BE INSIDE LOOP) ---
                const wordEntry = `${alignNum(wordTotal, 7)} | ` +
                                `${pad(word, 15)} | ` +
                                `[R:${alignNum(R, 2)}, C:${alignNum(C, 2)}] | ` +
                                `(P:${alignNum(prod, 5)}, S:${alignNum(sum, 4)}, PS:${alignNum(prodSum, 5)}) | ` +
                                `{L:${alignNum(hexLayer, 2)}, ${alignNum(hexSum, 5)}+${alignNum(hexOffset, 4)}}`;
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
            if ((currentLine + entry).length > 65) { lines.push(currentLine.trim()); currentLine = entry + "; "; }
            else { currentLine += entry + "; "; }
        });
        if (currentLine) lines.push(currentLine.trim().replace(/;$/, ''));
        return lines.join('\n');
    };

    // --- OUTPUT ASSEMBLY ---
    let output = `CHARACTER BREAKDOWN:\n${stepByStepArr.join('\n')}\n\n`;
    output += `FREQUENCY (ORDER OF OCCURRENCE):\n${formatFreqWrapped(charData)}\n\n`;

    // WORD TABLE
    output += `WORD SUMMATION (SQUARE & HEXAGONAL GEOMETRY):\n`;
    output += `${pad("VALUE", 7)} | ${pad("WORD", 15)} | ${pad("SQUARE [R, C]", 13)} | ${pad("P + S = PS", 23)} | ${pad("HEX {L, S+O}", 18)}\n`;
    output += `${"-".repeat(95)}\n`;
    output += `${wordSummationArr.join('\n')}\n\n`;

    // PUNCTUATION TABLE
    output += `PUNCTUATION SUMMATION:\n`;
    output += `${pad("EQUATION", 45)} | ${pad("SUM", 7)} | ${pad("SQUARE [R, C]", 13)} | ${pad("P + S = PS", 23)} | ${pad("HEX {L, S+O}", 18)}\n`;
    output += `${"-".repeat(130)}\n`;

    const formattedPunctuation = punctuationLinesRaw.map(item => {
        const sPos = CoordinateMappers.shell(item.sum);
        const R = Math.floor(sPos.y) + 1;
        const C = Math.floor(sPos.x) + 1;
        const prod = R * C; const sum = R + C; const ps = prod + sum;
        let hexLayer = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - item.sum))) / 6);
        let s = BigInt(Math.max(0, hexLayer - 1));
        let hexSum = Number(3n * s * s - 3n * s + 1n);
        let hexOffset = item.sum - hexSum;

        return `${pad(item.eq.trim(), 45)} | ` +
            `${alignNum(item.sum, 7)} | ` +
            `[R:${alignNum(R, 2)}, C:${alignNum(C, 2)}] | ` +
            `(P:${alignNum(prod, 5)}, S:${alignNum(sum, 4)}, PS:${alignNum(ps, 5)}) | ` +
            `{L:${alignNum(hexLayer, 2)}, ${alignNum(hexSum, 5)}+${alignNum(hexOffset, 4)}}`;
    });
    output += `${formattedPunctuation.join('\n')}\n\n`;

    // CUMULATIVE TABLE
    output += `CUMULATIVE PUNCTUATION SUMMATION:\n`;
    output += `${pad("EQUATION", 45)} | ${pad("SEG | TOTAL", 13)} | ${pad("SQUARE [R, C]", 13)} | ${pad("P + S = PS", 23)} | ${pad("HEX {L, S+O}", 18)}\n`;
    output += `${"-".repeat(140)}\n`;

    let runningCumulative = 0;
    const formattedCumulative = punctuationLinesRaw.map(item => {
        runningCumulative += Number(item.sum);
        const sPos = CoordinateMappers.shell(runningCumulative);
        const R = Math.floor(sPos.y) + 1;
        const C = Math.floor(sPos.x) + 1;
        const prod = R * C; const sum = R + C; const ps = prod + sum;
        let hexLayer = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - runningCumulative))) / 6);
        let s = BigInt(Math.max(0, hexLayer - 1));
        let hexSum = Number(3n * s * s - 3n * s + 1n);
        let hexOffset = runningCumulative - hexSum;

        const totals = `${alignNum(item.sum, 5)} | ${alignNum(runningCumulative, 5)}`;

        return `${pad(item.eq.trim(), 45)} | ` +
            `${totals} | ` +
            `[R:${alignNum(R, 2)}, C:${alignNum(C, 2)}] | ` +
            `(P:${alignNum(prod, 5)}, S:${alignNum(sum, 4)}, PS:${alignNum(ps, 5)}) | ` +
            `{L:${alignNum(hexLayer, 2)}, ${alignNum(hexSum, 5)}+${alignNum(hexOffset, 4)}}`;
    });
output += `${formattedCumulative.join('\n')}`;

    // FINAL UPDATE
    breakdownEl.innerText = output;
    resultEl.innerText = globalTotal;
    document.getElementById('wordCount').innerText = wordSummationArr.length;
    document.getElementById('letterCount').innerText = activeLetterCount;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateBtn').addEventListener('click', performCalculation);
});
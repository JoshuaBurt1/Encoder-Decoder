// --- MODULAR PLOTTING ENGINE ---
const CoordCache = new Map();
const CoordinateMappers = {
    shell: (n) => {
        // Handle 0 or 1 cases
        if (n <= 1) return { x: 0, y: 0 };

        // k is the side length of the inner completed square
        let k = Math.floor(Math.sqrt(n - 1));
        let offset = n - (k * k);

        // If offset is within the first 'arm' of the shell
        if (offset <= k + 1) {
            return { x: k, y: offset - 1 };
        } else {
            // Otherwise, it turns the corner
            return { x: k - (offset - (k + 1)), y: k };
        }
    },
    hexagon: (n) => {
        const nBI = BigInt(n);
        const key = `hex_${nBI}`;
        if (CoordCache.has(key)) return CoordCache.get(key);

        let nNum = Number(nBI);
        if (nNum <= 1) return { x: 0, y: 0 };
        
        let layer = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - nNum))) / 6);
        let prevTotal = 3 * (layer - 2) * (layer - 1) + 1;
        let offset = nNum - prevTotal - 1;
        
        let q = 0, r = -(layer - 1);
        const dirs = [{dq:1,dr:0}, {dq:0,dr:1}, {dq:-1,dr:1}, {dq:-1,dr:0}, {dq:0,dr:-1}, {dq:1,dr:-1}];
        let sideLen = layer - 1, side = Math.floor(offset / sideLen), steps = offset % sideLen;
        
        for (let i = 0; i < side; i++) { q += dirs[i].dq * sideLen; r += dirs[i].dr * sideLen; }
        q += dirs[side].dq * steps; r += dirs[side].dr * steps;
        
        const res = { x: (Math.sqrt(3) * q + Math.sqrt(3)/2 * r), y: (1.5 * r) };
        CoordCache.set(key, res);
        return res;
    }
};

function renderGridToCanvas(canvasId, dataPoints, markerColor = "#00ff88", mappingType = 'shell') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const shouldConnect = document.getElementById('toggleConnect')?.checked;
    const showAllLines = document.getElementById('toggleShowAllLines')?.checked;

    // 1. Resize and Clear
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 300; 
    ctx.fillStyle = "#ffffff"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (dataPoints.length === 0) return;

    // 2. Map Data to Coordinates
    const mapper = CoordinateMappers[mappingType];
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    
    const coordsList = dataPoints.map(val => {
        const c = mapper(val);
        minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
        minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
        return c;
    });

    // 3. Calculate Scaling and Centering
    const padding = 40;
    const rangeX = (maxX - minX) || 1;
    const rangeY = (maxY - minY) || 1;
    
    const stepSize = Math.min(
        (canvas.width - padding * 2) / rangeX, 
        (canvas.height - padding * 2) / rangeY,
        40 // Max step size to prevent massive dots on small data
    );
    
    // centerX/Y now represents the middle of the data bounds
    const centerX = canvas.width / 2 - ((minX + maxX) / 2) * stepSize;
    const centerY = canvas.height / 2 - ((minY + maxY) / 2) * stepSize;

    // 4. Draw Subtle Background Grid
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    // Draw reference points for first 50 values or max data point
    const gridLimit = Math.max(...dataPoints, 50);
    for (let i = 1; i <= gridLimit; i++) {
        const gc = mapper(i);
        ctx.strokeRect(centerX + gc.x * stepSize - 1, centerY + gc.y * stepSize - 1, 2, 2);
    }

    // 5. Draw Lines (Web)
    if (showAllLines && dataPoints.length > 1) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
        ctx.beginPath();
        for (let i = 0; i < coordsList.length; i++) {
            for (let j = i + 1; j < coordsList.length; j++) {
                ctx.moveTo(centerX + coordsList[i].x * stepSize, centerY + coordsList[i].y * stepSize);
                ctx.lineTo(centerX + coordsList[j].x * stepSize, centerY + coordsList[j].y * stepSize);
            }
        }
        ctx.stroke();
    }

    // 6. Draw Path (Connect Order)
    if (shouldConnect && dataPoints.length > 1) {
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        coordsList.forEach((c, i) => {
            if (i === 0) ctx.moveTo(centerX + c.x * stepSize, centerY + c.y * stepSize);
            else ctx.lineTo(centerX + c.x * stepSize, centerY + c.y * stepSize);
        });
        ctx.stroke();
    }

    // 7. Draw Markers & Labels
    dataPoints.forEach((val, i) => {
        const c = coordsList[i];
        const px = centerX + c.x * stepSize;
        const py = centerY + c.y * stepSize;

        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "10px monospace";
        ctx.fillStyle = "#666";
        ctx.fillText(val, px + 6, py - 6);
    });
}


// --- CALCULATION LOGIC ---
let valuesToPlot = [];
const charts = {
    hebrew: { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 },
    greek: { 'α': 1, 'β': 2, 'γ': 3, 'δ': 4, 'ε': 5, 'ζ': 7, 'η': 8, 'θ': 9, 'ι': 10, 'κ': 20, 'λ': 30, 'μ': 40, 'ν': 50, 'ξ': 60, 'ο': 70, 'π': 80, 'ρ': 100, 'σ': 200, 'ς': 200, 'τ': 300, 'υ': 400, 'φ': 500, 'χ': 600, 'ψ': 700, 'ω': 800 },
    arabic: { 'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9, 'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90, 'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000 },
    indian: { 'क': 1, 'ख': 2, 'ग': 3, 'घ': 4, 'ङ': 5, 'च': 6, 'छ': 7, 'ज': 8, 'झ': 9, 'ञ': 0, 'ट': 1, 'ठ': 2, 'ड': 3, 'ढ': 4, 'ण': 5, 'त': 6, 'थ': 7, 'द': 8, 'ध': 9, 'न': 0, 'प': 1, 'फ': 2, 'ब': 3, 'भ': 4, 'म': 5, 'य': 1, 'र': 2, 'ल': 3, 'व': 4, 'श': 5, 'ष': 6, 'स': 7, 'ह': 8 }
};
function performCalculation() {
    const rawText = document.getElementById('gematriaEntry').value;
    const system = document.getElementById('scriptSelect').value;
    const resultEl = document.getElementById('gematriaResult');
    const breakdownEl = document.getElementById('breakdownArea');
    const statusEl = document.getElementById('gematriaStatus');
    const wordCountEl = document.getElementById('wordCount');
    const letterCountEl = document.getElementById('letterCount');

    if (!rawText.trim()) {
        statusEl.innerText = "Error: Please enter text.";
        statusEl.style.color = "#e74c3c";
        return;
    }

    const chart = charts[system];
    const punctuationMarkers = [',', ';', '.', ':'];
    const segments = rawText.split(/([,;.:])/).filter(s => s && s.trim().length > 0);

    let globalTotal = system === 'indian' ? "" : 0;
    let stepByStepArr = [];
    let wordSummationArr = [];
    let punctuationLinesRaw = []; 
    let activeLetterCount = 0;

    // Formatting Helpers
    const pad = (str, len) => str.toString().padEnd(len, ' ');
    const alignNum = (num, len) => num.toString().padStart(len, ' ');

    segments.forEach(segment => {
        if (punctuationMarkers.includes(segment)) return;

        const words = segment.trim().split(/\s+/).filter(w => w.length > 0);
        let segmentSum = system === 'indian' ? "" : 0;
        let segmentWordTotals = [];

        words.forEach(word => {
            const normalizedWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            let wordTotal = system === 'indian' ? "" : 0;
            let wordSteps = [];
            let validCharInWord = false;

            for (let c of normalizedWord) {
                if (chart[c] !== undefined) {
                    validCharInWord = true;
                    activeLetterCount++;
                    wordSteps.push(`${c}(${chart[c]})`);
                    if (system === 'indian') wordTotal += chart[c].toString();
                    else wordTotal += chart[c];
                }
            }

            if (validCharInWord) {
                const connector = system === 'indian' ? ' → ' : ' + ';
                stepByStepArr.push(`${word}: ${wordSteps.join(connector)} = ${wordTotal}`);
                
                const nNum = Number(wordTotal);
                const sPos = CoordinateMappers.shell(nNum);
                
                // Format Square Meta: [R: 1, C: 1]
                const squareMeta = `[R:${alignNum(Math.floor(sPos.y) + 1, 2)}, C:${alignNum(Math.floor(sPos.x) + 1, 2)}]`;
                
                let hexLayer = 1, hexSum = 0, hexOffset = nNum;
                if (nNum > 1) {
                    hexLayer = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - nNum))) / 6);
                    let s = BigInt(hexLayer - 1);
                    hexSum = Number(3n * s * s - 3n * s + 1n);
                    hexOffset = nNum - hexSum;
                }
                const hexMeta = `{L:${alignNum(hexLayer, 2)}, S:${alignNum(hexSum, 4)}+${alignNum(hexOffset, 3)}}`;

                // Aligned Word Summation: Value aligns by place value, then Word, then Metadata
                wordSummationArr.push(`${alignNum(wordTotal, 6)} = ${pad(word, 15)} ${pad(squareMeta, 16)} ${hexMeta}`);
                
                segmentWordTotals.push(wordTotal);
                if (system === 'indian') {
                    segmentSum += wordTotal.toString();
                    globalTotal += wordTotal.toString();
                } else {
                    segmentSum += wordTotal;
                    globalTotal += wordTotal;
                }
            }
        });

        if (segmentWordTotals.length > 0) {
            const equation = segmentWordTotals.join(' + ');
            punctuationLinesRaw.push({ eq: equation, sum: segmentSum });
        }
    });

    // Wrapped Frequency Formatting Helper
    const formatFreqWrapped = (dataArr) => {
        let lines = [];
        let currentLine = "";
        dataArr.forEach((item, idx) => {
            const entry = `\u200E${item.char}*${item.freq}=${item.product}`;
            if ((currentLine + entry).length > 65) {
                lines.push(currentLine.trim());
                currentLine = entry + "; ";
            } else {
                currentLine += entry + "; ";
            }
        });
        if (currentLine) lines.push(currentLine.trim().replace(/;$/, ''));
        return lines.join('\n');
    };

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

    const charData = occurrenceOrder.map(c => ({
        char: c, 
        freq: charFrequencyMap[c], 
        product: system === 'indian' ? chart[c].toString().repeat(charFrequencyMap[c]) : chart[c] * charFrequencyMap[c]
    }));

    // Output Assembly
    let output = `CHARACTER BREAKDOWN:\n${stepByStepArr.join('\n')}\n\n`;
    output += `FREQUENCY (ORDER OF OCCURRENCE):\n${formatFreqWrapped(charData)}\n\n`;
    output += `FREQUENCY (HIGHEST FREQUENCY):\n${formatFreqWrapped([...charData].sort((a,b) => b.freq - a.freq))}\n\n`;
    output += `FREQUENCY (ALPHABETIC):\n${formatFreqWrapped([...charData].sort((a,b) => a.char.localeCompare(b.char)))}\n\n`;
    output += `WORD SUMMATION:\n${wordSummationArr.join('\n')}\n\n`;
    
    const formattedPunctuation = punctuationLinesRaw.map(item => `${item.eq.trim().padEnd(45)} = ${alignNum(item.sum, 8)}`);
    output += `PUNCTUATION SUMMATION:\n${formattedPunctuation.join('\n')}\n\n`;

    let runningCumulative = 0;
    const formattedCumulative = punctuationLinesRaw.map(item => {
        runningCumulative += Number(item.sum);
        return `${item.eq.trim().padEnd(45)} = ${alignNum(item.sum, 8)} | ${alignNum(runningCumulative, 8)}`;
    });
    output += `CUMULATIVE PUNCTUATION SUMMATION:\n${formattedCumulative.join('\n')}`;

    // Update UI
    breakdownEl.innerText = output;
    resultEl.innerText = globalTotal || "0";
    statusEl.innerText = "Calculation complete.";
    statusEl.style.color = "#FFD700";
    letterCountEl.innerText = activeLetterCount;
    wordCountEl.innerText = rawText.trim().split(/\s+/).length;

    // Trigger Plots
    const getVals = (arr) => arr.map(i => parseInt(i.split('=')[0])).filter(v => !isNaN(v));
    // --- TRIGGER THE MODULAR PLOTS ---

    // 1. Word Totals (Existing logic)
    const wordValues = wordSummationArr.map(s => parseInt(s.split('=')[0].trim()));

    // 2. Character Frequency Grids: Plot individual characters as they occur
    // We iterate through the raw text to get the value of every valid character in order
    const individualCharValues = [];
    for (let char of rawText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()) {
        if (chart[char] !== undefined) {
            individualCharValues.push(chart[char]);
        }
    }

    // 3. Punctuation/Segment Totals (Existing logic)
    const punctValues = punctuationLinesRaw.map(i => parseInt(i.sum));

    // Character Occurrences (Blue) - Now plotting individualCharValues
    renderGridToCanvas('freqPlotCanvas', individualCharValues, "#3498db", 'shell');
    renderGridToCanvas('freqHexCanvas', individualCharValues, "#3498db", 'hexagon');
    // Word Totals (Green)
    renderGridToCanvas('wordPlotCanvas', wordValues, "#00ff88", 'shell');
    renderGridToCanvas('wordHexCanvas', wordValues, "#00ff88", 'hexagon');

    // Punctuation Segments (Red)
    renderGridToCanvas('punctPlotCanvas', punctValues, "#e74c3c", 'shell');
    renderGridToCanvas('punctHexCanvas', punctValues, "#e74c3c", 'hexagon');
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateBtn').addEventListener('click', performCalculation);

    // This ensures that clicking the checkboxes immediately updates the lines
    const toggleConnect = document.getElementById('toggleConnect');
    const toggleShowAll = document.getElementById('toggleShowAllLines');

    if (toggleConnect) toggleConnect.addEventListener('change', performCalculation);
    if (toggleShowAll) toggleShowAll.addEventListener('change', performCalculation);
});
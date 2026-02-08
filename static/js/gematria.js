const charts = {
    hebrew: {
        'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
        'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
        'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200,
        'ש': 300, 'ת': 400
    },
    greek: {
        'α': 1, 'β': 2, 'γ': 3, 'δ': 4, 'ε': 5, 'ζ': 7, 'η': 8, 'θ': 9, 'ι': 10,
        'κ': 20, 'λ': 30, 'μ': 40, 'ν': 50, 'ξ': 60, 'ο': 70, 'π': 80, 'ρ': 100,
        'σ': 200, 'ς': 200, 'τ': 300, 'υ': 400, 'φ': 500, 'χ': 600, 'ψ': 700, 'ω': 800
    },
    arabic: {
        'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
        'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90,
        'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000
    },
    indian: {
        'क': 1, 'ख': 2, 'ग': 3, 'घ': 4, 'ङ': 5, 'च': 6, 'छ': 7, 'ज': 8, 'झ': 9, 'ञ': 0,
        'ट': 1, 'ठ': 2, 'ड': 3, 'ढ': 4, 'ण': 5, 'त': 6, 'थ': 7, 'द': 8, 'ध': 9, 'न': 0,
        'प': 1, 'फ': 2, 'ब': 3, 'भ': 4, 'म': 5, 'य': 1, 'र': 2, 'ल': 3, 'व': 4, 'श': 5, 'ष': 6, 'स': 7, 'ह': 8
    }
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
    const segments = rawText.split(/([,;.:])/);

    let globalTotal = system === 'indian' ? "" : 0;
    let stepByStepArr = [];
    let wordSummationArr = [];
    let punctuationLinesRaw = []; 
    let activeLetterCount = 0;

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
                wordSummationArr.push(`${word} = ${wordTotal}`);
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

    // 1. Format Standard Punctuation Summation
    const formattedPunctuation = punctuationLinesRaw.map(item => {
        return `${item.eq.trim().padEnd(30)} = ${item.sum.toString().padStart(8)}`;
    });

    // 2. Format Cumulative Punctuation Summation (Linear Alignment)
    let runningCumulative = 0;
    const formattedCumulative = punctuationLinesRaw.map(item => {
        let cumPart = "";
        if (system !== 'indian') {
            runningCumulative += item.sum;
            cumPart = ` | ${runningCumulative.toString().padStart(8)}`;
        }
        return `${item.eq.trim().padEnd(30)} = ${item.sum.toString().padStart(8)}${cumPart}`;
    });

    letterCountEl.innerText = activeLetterCount;
    wordCountEl.innerText = rawText.trim().split(/\s+/).length;

    let output = `CHARACTER BREAKDOWN:\n${stepByStepArr.join('\n')}\n\n`;
    output += `WORD SUMMATION:\n${wordSummationArr.join('\n')}\n\n`;
    output += `PUNCTUATION SUMMATION:\n${formattedPunctuation.join('\n')}\n\n`;
    output += `CUMULATIVE PUNCTUATION SUMMATION:\n${formattedCumulative.join('\n')}`;

    breakdownEl.innerText = output;
    resultEl.innerText = globalTotal || "0";
    statusEl.innerText = "Calculation complete.";
    statusEl.style.color = "#FFD700";
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateBtn').addEventListener('click', performCalculation);
});
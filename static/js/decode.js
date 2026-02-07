import { applyShift } from './shiftCipher_eng.js';
import { applySubstitution } from './substitutionCipher.js';
import { applyPermutation } from './permutationCipher.js';

const dictionary = ["and", "or", "the", "my", "this", "is", "in", "with", "from", "that"];

// 1. Manual Shift Only (The "Shift" Button)
window.handleManualShift = function() {
    const text = document.getElementById('cipherEntry').value;
    const s = parseInt(document.getElementById('decodeShift').value) || 0;
    const output = document.getElementById('decodeResult');
    const statusEl = document.getElementById('decodeStatus');

    if (!text.trim()) {
        statusEl.innerText = "Error: Please enter ciphertext.";
        return;
    }

    output.innerText = applyShift(text, -s);
    statusEl.innerText = `Applied ${s} character shift.`;
};

// 2. Decoding (The "Run Decoding" Button)
window.handleDecoding = function() {
    const text = document.getElementById('cipherEntry').value;
    const type = document.getElementById('cipherSelect').value;
    const output = document.getElementById('decodeResult');
    const statusEl = document.getElementById('decodeStatus');

    if (!text.trim()) {
        statusEl.innerText = "Error: Ciphertext entry is empty.";
        return;
    }

    statusEl.innerText = "";

    if (type === 'shift') {
        // Run the Auto-brute-force here
        let bestShift = 0;
        let maxMatches = 0;

        for (let s = 0; s < 26; s++) {
            const test = applyShift(text, -s);
            const matches = test.toLowerCase().split(/\W+/).filter(w => dictionary.includes(w)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                bestShift = s;
            }
        }

        document.getElementById('decodeShift').value = bestShift;
        output.innerText = applyShift(text, -bestShift);
        statusEl.innerText = `Auto-Detected Shift: ${bestShift} (${maxMatches} matches)`;
    } 
    else if (type === 'substitution') {
        const keyRaw = document.getElementById('subKey').value;
        const keyArr = keyRaw.split(',').filter(x => x.trim() !== "").map(n => parseInt(n.trim()));
        if (keyArr.length !== 29) {
            statusEl.innerText = "Error: Substitution key must have 29 values.";
            return;
        }
        output.innerText = applySubstitution(text, keyArr, true);
        statusEl.innerText = "Substitution reversed.";
    } 
    else if (type === 'permutation') {
        const keyRaw = document.getElementById('permKey').value;
        const keyArr = keyRaw.split(',').filter(x => x.trim() !== "").map(n => parseInt(n.trim()));
        const m = parseInt(document.getElementById('permBlockSize').value);

        if (keyArr.length !== m) {
            console.log(`Error: Key length must match block size (${m}).`);

            statusEl.innerText = `Error: Key length must match block size (${m}).`;
            return;
        }
        output.innerText = applyPermutation(text, keyArr, true);
        statusEl.innerText = "Permutation reversed.";
    }
};
// Add this function to decode.js

window.runFrequencyAnalysis = function() {
    const text = document.getElementById('cipherEntry').value.toLowerCase();
    const section = document.getElementById('frequencySection');
    const chart = document.getElementById('chartContainer');
    const labels = document.getElementById('chartLabels');
    
    if (!text.trim()) return;
    section.classList.remove('hidden');
    chart.innerHTML = '';
    labels.innerHTML = '';

    const englishFreq = {
        'a': 8.12, 'b': 1.49, 'c': 2.71, 'd': 4.32, 'e': 12.02, 'f': 2.30, 'g': 2.03, 'h': 5.92,
        'i': 7.31, 'j': 0.10, 'k': 0.69, 'l': 3.98, 'm': 2.61, 'n': 6.95, 'o': 7.68, 'p': 1.82,
        'q': 0.11, 'r': 6.02, 's': 6.28, 't': 9.10, 'u': 2.88, 'v': 1.11, 'w': 2.09, 'x': 0.17,
        'y': 2.11, 'z': 0.07
    };

    const counts = {};
    let totalAlpha = 0;
    
    // Count occurrences
    for (let char of text) {
        if (/[a-z]/.test(char)) {
            counts[char] = (counts[char] || 0) + 1;
            totalAlpha++;
        }
    }

    // Generate Chart Bars
    "abcdefghijklmnopqrstuvwxyz".split('').forEach(letter => {
        const observed = totalAlpha ? ((counts[letter] || 0) / totalAlpha * 100) : 0;
        const expected = englishFreq[letter];

        // Container for the two bars (Actual vs Expected)
        const barGroup = document.createElement('div');
        barGroup.style.cssText = "flex: 1; display: flex; align-items: flex-end; gap: 1px; height: 100%;";

        // Actual frequency bar (Blue)
        const observedBar = document.createElement('div');
        observedBar.style.height = `${observed * 8}px`; // Scale for visibility
        observedBar.style.background = "var(--primary)";
        observedBar.title = `${letter.toUpperCase()}: ${observed.toFixed(1)}%`;
        observedBar.style.flex = "1";

        // Expected frequency bar (Gray)
        const expectedBar = document.createElement('div');
        expectedBar.style.height = `${expected * 8}px`;
        expectedBar.style.background = "#e2e8f0";
        expectedBar.style.flex = "1";

        barGroup.appendChild(expectedBar);
        barGroup.appendChild(observedBar);
        chart.appendChild(barGroup);

        // Label
        const label = document.createElement('div');
        label.style.flex = "1";
        label.innerText = letter.toUpperCase();
        labels.appendChild(label);
    });
};

// Update handleDecoding or add a listener to trigger this
document.getElementById('cipherEntry').addEventListener('input', runFrequencyAnalysis);
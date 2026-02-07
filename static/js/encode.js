import { applyShift } from './shiftCipher_eng.js';
import { applySubstitution, generateRandomSubKey } from './substitutionCipher.js';
import { applyPermutation, generateRandomPermKey } from './permutationCipher.js';

window.handleRandomKey = function() {
    const type = document.getElementById('cipherSelect').value;
    if (type === 'substitution') {
        document.getElementById('subKey').value = generateRandomSubKey();
    } else if (type === 'permutation') {
        const m = parseInt(document.getElementById('permBlockSize').value) || 5;
        document.getElementById('permKey').value = generateRandomPermKey(m);
    }
};

window.handleEncoding = function() {
    const text = document.getElementById('plainEntry').value;
    const type = document.getElementById('cipherSelect').value;
    const output = document.getElementById('encodeResult');
    const statusEl = document.getElementById('encodeStatus');
    let result = "";

    statusEl.innerText = "";

    if (!text.trim()) {
        statusEl.style.color = "var(--error)";
        statusEl.innerText = "Error: Plaintext entry is empty.";
        return;
    }

    if (type === 'shift') {
        const s = parseInt(document.getElementById('encodeShift').value) || 0;
        result = applyShift(text, s);
    } else if (type === 'substitution') {
        const keyRaw = document.getElementById('subKey').value;
        const keyArr = keyRaw.split(',').filter(x => x.trim() !== "").map(n => parseInt(n.trim()));
        if (keyArr.length !== 29) {
            statusEl.style.color = "var(--error)";
            statusEl.innerText = "Error: Substitution key must have 29 values.";
            return;
        }
        result = applySubstitution(text, keyArr);
    } else if (type === 'permutation') {
        const m = parseInt(document.getElementById('permBlockSize').value);
        const keyRaw = document.getElementById('permKey').value;
        const keyArr = keyRaw.split(',').filter(x => x.trim() !== "").map(n => parseInt(n.trim()));

        if (keyArr.length !== m) {
            statusEl.style.color = "var(--error)";
            statusEl.innerText = `Error: Key length must match Block Size (${m}).`;
            return;
        }
        result = applyPermutation(text, keyArr);
    }

    // --- BOUNDARY HIGHLIGHTING LOGIC ---
    if (result.length > 0) {
        if (result.length === 1) {
            // Special case for 1-character messages: Combining Light Blue (start) and Yellow (end)
            const char = result === ' ' ? '&nbsp;' : result;
            output.innerHTML = `<span style="background: linear-gradient(90deg, #d1ecf1 50%, #ffeaa7 50%); color: #2c3e50; font-weight: bold; border-radius: 2px;">${char}</span>`;
        } else {
            const firstChar = result[0];
            const lastChar = result[result.length - 1];
            const middlePart = result.slice(1, -1);

            // Highlight firstChar light blue and lastChar yellow.
            output.innerHTML = `<span style="background-color: #d1ecf1; color: #0c5460; font-weight: bold; border-radius: 2px;">${firstChar === ' ' ? '&nbsp;' : firstChar}</span>${middlePart}<span style="background-color: #ffeaa7; color: #d35400; font-weight: bold; border-radius: 2px;">${lastChar === ' ' ? '&nbsp;' : lastChar}</span>`;
        }
    } else {
        output.innerText = "Your encoded text will appear here...";
    }
};

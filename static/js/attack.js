import { applyShift } from './shiftCipher_eng.js';
import { applySubstitution } from './substitutionCipher.js';
import { applyPermutation } from './permutationCipher.js';


window.handlePlaintextAttack = function() {
    const plain = document.getElementById('attackPlain').value;
    const cipher = document.getElementById('attackCipher').value;
    const type = document.getElementById('attackType').value;
    const output = document.getElementById('attackResult');
    const statusEl = document.getElementById('attackStatus');

    if (!plain || !cipher) {
        statusEl.innerText = "Error: Both fields required.";
        return;
    }

    let recoveredKey = null;

    if (type === 'shift') {
        const pMatch = plain.match(/[a-z]/i);
        const cMatch = cipher.match(/[a-z]/i);

        if (pMatch && cMatch) {
            const pCode = pMatch[0].toLowerCase().charCodeAt(0);
            const cCode = cMatch[0].toLowerCase().charCodeAt(0);
            const shift = (cCode - pCode + 26) % 26;
            
            // VERIFICATION
            const testCipher = applyShift(plain, shift);
            if (testCipher === cipher) {
                output.innerText = `Verified Shift Key: ${shift}`;
                statusEl.style.color = "var(--success)";
                statusEl.innerText = "Full Text Match Confirmed.";
            } else {
                output.innerText = `Possible Shift: ${shift}`;
                statusEl.style.color = "var(--error)";
                statusEl.innerText = "Warning: Key only matches partial text.";
            }
        }
    } 
    else if (type === 'substitution') {
        const alphabet = "abcdefghijklmnopqrstuvwxyz ,.";
        let mapping = new Array(29).fill(null);
        let recoveredCount = 0;

        // Force both to lowercase to avoid case-sensitivity issues
        const p = plain.toLowerCase();
        const c = cipher.toLowerCase();

        for (let i = 0; i < p.length; i++) {
            const pIdx = alphabet.indexOf(p[i]);
            const cIdx = alphabet.indexOf(c[i]);

            // Only process if the character exists in our defined 29-char alphabet
            if (pIdx !== -1 && cIdx !== -1) {
                if (mapping[pIdx] === null) {
                    mapping[pIdx] = cIdx;
                    recoveredCount++;
                } else if (mapping[pIdx] !== cIdx) {
                    // This error triggers if 'a' maps to 'x' once, but then 'a' maps to 'y' later
                    statusEl.style.color = "var(--error)";
                    statusEl.innerText = `Inconsistent mapping for '${p[i]}': already maps to index ${mapping[pIdx]}, but found ${cIdx} at position ${i}.`;
                    return;
                }
            }
        }

        const keyString = mapping.map(val => (val === null ? "?" : val)).join(',');
        output.innerText = keyString;
        statusEl.style.color = recoveredCount === 29 ? "var(--success)" : "#f39c12";
        statusEl.innerText = `Recovered ${recoveredCount}/29 characters. Case-insensitive mapping complete.`;
    }
    else if (type === 'permutation') {
        const m = parseInt(document.getElementById('attackM').value);
        if (plain.length < m) {
            statusEl.innerText = `Error: Plaintext too short for block size ${m}.`;
            return;
        }

        const pBlock = plain.substring(0, m);
        const cBlock = cipher.substring(0, m);
        let keyArr = [];

        try {
            for (let i = 0; i < m; i++) {
                const charToFind = cBlock[i];
                const originalIndex = pBlock.indexOf(charToFind);
                if (originalIndex === -1) throw new Error();
                keyArr.push(originalIndex);
            }

            // VERIFICATION
            const testCipher = applyPermutation(plain, keyArr);
            if (testCipher.trim() === cipher.trim()) {
                output.innerText = `Verified Permutation Key: ${keyArr.join(',')}`;
                statusEl.style.color = "var(--success)";
                statusEl.innerText = "Full Text Match Confirmed.";
            } else {
                output.innerText = `Potential Key: ${keyArr.join(',')}`;
                statusEl.style.color = "#f39c12";
                statusEl.innerText = "Partial Match: Key works for block 1 but fails later.";
            }
        } catch (e) {
            statusEl.innerText = "Error: Character mapping impossible.";
        }
    }
};

window.toggleAttackInputs = function() {
    const type = document.getElementById('attackType').value;
    document.getElementById('attackPermGroup').classList.toggle('hidden', type !== 'permutation');
};

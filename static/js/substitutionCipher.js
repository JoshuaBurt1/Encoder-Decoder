/**
 * Logic for the Substitution Cipher
 */
const z29 = "abcdefghijklmnopqrstuvwxyz ,.".split('');

export function generateRandomSubKey() {
    let key = Array.from(Array(z29.length).keys());
    for (let i = key.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [key[i], key[j]] = [key[j], key[i]];
    }
    return key.join(',');
}

export function applySubstitution(text, keyArray, reverse = false) {
    let cleaned = text.toLowerCase().split('').filter(c => z29.includes(c));
    return cleaned.map(char => {
        const index = z29.indexOf(char);
        if (reverse) {
            const originalIndex = keyArray.indexOf(index);
            return z29[originalIndex];
        } else {
            const newIndex = keyArray[index];
            return z29[newIndex];
        }
    }).join('');
}
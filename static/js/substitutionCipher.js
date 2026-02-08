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
    return text.split('').map(char => {
        const lowerChar = char.toLowerCase();
        const index = z29.indexOf(lowerChar);

        if (index === -1) return char;

        let targetIndex;
        if (reverse) {
            targetIndex = keyArray.indexOf(index);
        } else {
            targetIndex = keyArray[index];
        }

        const resultChar = z29[targetIndex];

        return char === char.toUpperCase() && char !== char.toLowerCase() 
            ? resultChar.toUpperCase() 
            : resultChar;
    }).join('');
}
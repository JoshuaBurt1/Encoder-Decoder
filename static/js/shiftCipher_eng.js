/**
 * Logic for the Shift (Caesar) Cipher
 */
export function applyShift(text, s) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const start = (code >= 65 && code <= 90) ? 65 : 97;
            return String.fromCharCode(((code - start + (s % 26) + 26) % 26) + start);
        }
        return char;
    }).join('');
}
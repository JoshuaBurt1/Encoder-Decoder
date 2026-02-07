/**
 * Logic for the Permutation Cipher
 */
export function generateRandomPermKey(m) {
    let key = Array.from(Array(m).keys());
    for (let i = key.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [key[i], key[j]] = [key[j], key[i]];
    }
    return key.join(',');
}

export function applyPermutation(text, keyArray, reverse = false) {
    const m = keyArray.length;
    
    // Padding: add spaces to reach a multiple of m
    let paddedText = text;
    const paddingNeeded = (m - (text.length % m)) % m;
    paddedText += " ".repeat(paddingNeeded);

    // Split into blocks of size m
    let blocks = [];
    for (let i = 0; i < paddedText.length; i += m) {
        blocks.push(paddedText.substring(i, i + m));
    }

    // Permute blocks
    return blocks.map(block => {
        let newBlock = new Array(m);
        for (let i = 0; i < m; i++) {
            if (reverse) {
                // To reverse, put the character back in its original position
                newBlock[keyArray[i]] = block[i];
            } else {
                // To encrypt, move the character at index i to its new position
                newBlock[i] = block[keyArray[i]];
            }
        }
        return newBlock.join('');
    }).join('');
}
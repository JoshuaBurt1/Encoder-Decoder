window.toggleKeyInputs = function() {
    const type = document.getElementById('cipherSelect').value;
    document.getElementById('shiftInputGroup').classList.toggle('hidden', type !== 'shift');
    document.getElementById('substitutionInputGroup').classList.toggle('hidden', type !== 'substitution');
    document.getElementById('permInputGroup').classList.toggle('hidden', type !== 'permutation');
};

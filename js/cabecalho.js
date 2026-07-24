// Arquivo: js/cabecalho.js
document.addEventListener("DOMContentLoaded", function() {
    fetch('cabecalho.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('cabecalho-container').innerHTML = data;
        })
        .catch(error => console.error('Erro ao carregar o cabeçalho:', error));
});
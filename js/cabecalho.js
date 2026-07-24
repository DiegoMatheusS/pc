// Aguarda o HTML da página carregar
document.addEventListener('DOMContentLoaded', function() {
    
    // Todo o HTML do seu cabeçalho guardado nesta variável
    const htmlDoCabecalho = `
        <header class="cabecalho">
            <div class="logo">PC Builder</div>
            <nav class="menu">
                <ul>
                    <li><a href="pcbuild.html" class="destaque">Monte seu pc</a></li>
                    <li><a href="index.html">Início</a></li>
                    <li><a href="#">Montados</a></li>
                    
                    <!-- 🌟 O BOTÃO PEÇAS -->
                    <li class="menu-item-dropdown">
                        <a href="#" style="cursor: pointer;">Peças ▾</a>
                        
                        <div class="dropdown-conteudo">
                            <a href="#">⚙️ Processadores</a>
                            <a href="#">❄️ Coolers de processador</a>
                            <a href="#">🎮 Placas de vídeo</a>
                            <a href="#">🎛️ Placas-mãe</a>
                            <a href="#">📼 Memórias</a>
                            <a href="#">💾 Armazenamentos</a>
                            <a href="#">🗄️ Gabinetes</a>
                            <a href="#">⚡ Fontes</a>
                            
                            <div class="divisor-dropdown"></div> <!-- A linha que separa as peças dos periféricos -->
                            
                            <a href="#">🖥️ Monitores</a>
                            <a href="#">🖱️ Mouses</a>
                            <a href="#">⌨️ Teclados</a>
                            <a href="#">🎧 Fones de ouvido</a>
                        </div>
                    </li>
                    <!-- 🌟 FIM DO BOTÃO PEÇAS -->

                    <li><a href="#">Notebook</a></li>
                    <li><a href="#">Ofertas</a></li>
                </ul>
            </nav>
        </header>
    `;

    // Procura o local onde o cabeçalho deve entrar
    const container = document.getElementById('cabecalho-dinamico');

    // Se o local existir na página, injeta o HTML lá dentro!
    if (container) {
        container.innerHTML = htmlDoCabecalho;
    }
});
// 1. Nossa "Base de Dados" de peças
        const listaDePecas = [
            {
                nome: "Processador AMD Ryzen 7 5700X",
                preco: "R$ 1.150,00",
                imagemTexto: "Foto CPU" 
            },
            {
                nome: "Water Cooler Sangue Frio 2 240mm",
                preco: "R$ 320,00",
                imagemTexto: "Foto WC"
            },
            {
                nome: "Fonte Gigabyte P550B 550W",
                preco: "R$ 299,00",
                imagemTexto: "Foto Fonte"
            },
            {
                nome: "Gabinete Pichau HX710L",
                preco: "R$ 250,00",
                imagemTexto: "Foto Gabinete"
            }
        ];

        // 2. Encontramos o espaço vazio no HTML
        const espacoOfertas = document.getElementById('container-ofertas');

        // 3. Mandamos o JS criar um card para cada peça da lista
        listaDePecas.forEach(peca => {
            // Criamos a div do card
            const card = document.createElement('div');
            card.className = 'card-produto';
            
            // Colocamos o conteúdo HTML dentro dela, puxando os dados da lista
            card.innerHTML = `
                <div class="imagem-placeholder">${peca.imagemTexto}</div>
                <h3>${peca.nome}</h3>
                <p class="preco">${peca.preco}</p>
                <button class="btn-comprar">Ver Detalhes</button>
            `;
            
            // Injetamos o card pronto lá na página
            espacoOfertas.appendChild(card);
        });
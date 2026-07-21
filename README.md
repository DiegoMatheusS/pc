# PC Builder 3D Simulator

Um simulador web interativo construído com **JavaScript** e **Three.js** que permite aos usuários planejar, montar e validar configurações de hardware de computadores em um ambiente 3D dinâmico.

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-success)
![Three.js](https://img.shields.io/badge/Three.js-Renderização_3D-black?logo=three.js)
![JavaScript](https://img.shields.io/badge/JavaScript-Lógica_e_Física-yellow?logo=javascript)

## Funcionalidades Principais

Este projeto vai muito além de uma simples seleção de peças. Ele atua como um engenheiro virtual, validando a montagem em tempo real:

*   **Renderização 3D Interativa:** Modelos realistas em `.glb` que substituem os _placeholders_ (wireframes) à medida que as peças são selecionadas.
*   **Motor de Compatibilidade Lógica:** Impede montagens impossíveis (ex: CPUs incompatíveis com o soquete da placa-mãe ou memórias DDR4 em slots DDR5).
*   **Física e Clearance (Espaço Físico):** Alertas de colisão se uma Placa de Vídeo for muito grande para o gabinete ou se uma placa E-ATX tentar ser instalada em um chassi compacto.
*   **Calculadora de Energia (HUD Flutuante):** Monitoramento em tempo real do consumo em Watts (W) de todo o sistema. Se a fonte não for suficiente para a carga, o sistema desarma.
*   **Diagnóstico de Fluxo de Ar:** Analisa a orientação das ventoinhas (Exaustão vs Injeção) e calcula automaticamente se o gabinete terá **Pressão Positiva, Negativa ou Neutra**, emitindo alertas sobre acúmulo de poeira.
*   **Animações e Efeitos (RGB):** Quando o botão "Ligar PC" é acionado (após o sistema passar em todos os testes de segurança), as hélices das ventoinhas começam a girar fisicamente e os componentes iluminam-se com efeitos RGB dinâmicos.

## Hardware em Destaque

A lógica do sistema foi mapeada baseando-se em especificações e dimensões de componentes reais. O projeto já suporta perfis de peças como:
*   **Gabinetes:** Estilo Aquário (ex: Pichau HX710L), Compactos e Full-Towers.
*   **Processadores:** Linhas AMD Ryzen (ex: Ryzen 7 5700X) e Intel Core.
*   **Placas-mãe:** Formatos Micro-ATX (ex: Asus B550) até E-ATX.
*   **Refrigeração:** Water Coolers de 240mm (ex: Sangue Frio 2) a 360mm, e Ventoinhas de alto fluxo (ex: Arctic P12 Pro 120mm).
*   **Fontes:** Modelos variados (ex: Gigabyte P550B 550W, fontes 850W+).

## Como Executar o Projeto

Como o projeto utiliza arquivos de modelos 3D (`.glb`) carregados externamente, ele precisa ser executado através de um servidor local devido às políticas de CORS dos navegadores.

1. Clone o repositório:
   ```bash
   git clone [[https://github.com/DiegoMatheusS/pc.git](https://github.com/DiegoMatheusS/pc.git)]

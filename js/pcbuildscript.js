"use strict";
(function() {
    
// ==========================================================================
// 🧠 BANCO DE DADOS (JSON) - CARREGAMENTO DINÂMICO
// ==========================================================================
async function carregarBancoDeDados() {
    try {
        const resposta = await fetch('hardware.json');
        const banco = await resposta.json();
        
       // Função para injetar as opções do JSON no HTML e blindar os eventos
        function popularMenu(idMenu, itensJson) {
            const select = document.getElementById(idMenu);
            if (!select) return;
            
            select.innerHTML = '<option value="">-- Vazio / Selecione --</option>';
            
            itensJson.forEach(item => {
                let opcao = document.createElement('option');
                opcao.value = item.id;
                opcao.text = item.nome;
                
                // 🚀 O TRUQUE DE MESTRE: Esconde os Watts na opção HTML!
                // Se a peça não tiver watts no JSON, ele assume 0 por segurança.
                opcao.setAttribute('data-watts', item.watts || 0); 
                
                select.appendChild(opcao);
            });
        }

        popularMenu('gabinete', banco.gabinete);
        popularMenu('placa-mae', banco.placa_mae);
        popularMenu('processador', banco.processador);
        popularMenu('gpu', banco.gpu);
        popularMenu('fonte', banco.fonte);
        popularMenu('cooler', banco.cooler);
        popularMenu('armazenamento', banco.armazenamento);
        
        // Povoa automaticamente os 4 slots de RAM
        ['ram1', 'ram2', 'ram3', 'ram4'].forEach(id => popularMenu(id, banco.ram));
        
        // Povoa automaticamente todos os 7 slots de Ventoinhas
        ['fan-tras', 'fan-frente1', 'fan-frente2', 'fan-frente3', 'fan-teto1', 'fan-teto2', 'fan-teto3']
            .forEach(id => popularMenu(id, banco.ventoinhas));
        
        // Força o simulador a ler as peças recém-carregadas
        verificarCompatibilidade();
        
    } catch (erro) {
        console.error("Erro ao carregar hardware.json! Verifique se está usando Live Server.", erro);
    }
}
// Dispara o carregamento assim que o site abre
carregarBancoDeDados();

// ==========================================================================
// 1. CONFIGURAÇÃO BÁSICA DO AMBIENTE
// ==========================================================================
const cena = new THREE.Scene();

// 🎨 NOVO: Define o fundo inicial como Cinza Escuro
cena.background = new THREE.Color(0x444444); 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 2.3, 0); 

const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container-3d').appendChild(renderizador.domElement);

const controles = new THREE.OrbitControls(camera, renderizador.domElement);
controles.enableDamping = true;
controles.dampingFactor = 0.05;
controles.target.set(0, 2.3, 0); 

const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.7);
cena.add(luzAmbiente);
const luzAlerta = new THREE.PointLight(0xffffff, 0, 10);
luzAlerta.position.set(2, 2.5, 0);
cena.add(luzAlerta);

// --- GERENCIADOR DE CARREGAMENTO (LOADING SCREEN) ---
const gerenciador = new THREE.LoadingManager();
const telaCarregamento = document.getElementById('tela-carregamento');
const barraProgresso = document.getElementById('barra-progresso');

gerenciador.onProgress = function (url, itensCarregados, itensTotal) {
    if (barraProgresso) barraProgresso.style.width = (itensCarregados / itensTotal * 100) + '%';
};

gerenciador.onLoad = function () {
    if (telaCarregamento) {
        telaCarregamento.style.opacity = '0';
        setTimeout(() => telaCarregamento.style.display = 'none', 500); // Esconde suavemente
    }
};

const carregador = new THREE.GLTFLoader(gerenciador);

// 📦 Variáveis Globais dos Modelos 3D
let modeloPlacaReal = null; 
let modeloProcessadorReal = null; 
let modeloGpuReal = null; 
let modeloFonteReal = null; 
let modeloNvmeReal = null; 
let modeloSsdReal = null;
let modeloAirCoolerReal = null;

// O modelo base da fan vai servir para clonarmos para todos os slots
let modeloFanBase = null;
let carregandoFan = false; 

// 🧠 O NOVO HUB DE VENTOINHAS 
let modelosFansInstalados = {
    'fanTras': null, 'fanFrente1': null, 'fanFrente2': null, 'fanFrente3': null,
    'fanTeto1': null, 'fanTeto2': null, 'fanTeto3': null
};

// 🧠 SISTEMA DE CLONES (MEMÓRIA RAM)
let modeloRamBase = null;
let carregandoRam = false;
let modelosRamInstalados = {
    'ram1': null, 'ram2': null, 'ram3': null, 'ram4': null
};

// ==========================================================================
// 2. MAQUETE FÍSICA: GABINETE SUPERFRAME DRAKOR
// ==========================================================================

const geoGabinete = new THREE.BoxGeometry(2.4, 4.6, 4.5);
const matGabinete = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, wireframe: true });
const slotGabinete = new THREE.Mesh(geoGabinete, matGabinete);
slotGabinete.position.set(0, 2.3, 0); 
cena.add(slotGabinete);

const geoPsuCover = new THREE.BoxGeometry(2.4, 1.2, 4.5);
const matPsuCover = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7 });
const psuCover = new THREE.Mesh(geoPsuCover, matPsuCover);
psuCover.position.set(0, 0.6, 0);
cena.add(psuCover);

const geoPlaca = new THREE.BoxGeometry(0.1, 3.0, 2.4);
const matPlaca = new THREE.MeshBasicMaterial({ color: 0x4444ff, transparent: true, opacity: 0.2, wireframe: true });
const slotPlacaMae = new THREE.Mesh(geoPlaca, matPlaca);
slotPlacaMae.position.set(-1.15, 3.0, 0.8); 
slotPlacaMae.userData = { tipo: 'placa-mae', nome: 'Slot da Placa-Mãe' };
cena.add(slotPlacaMae);

const geoProc = new THREE.BoxGeometry(0.1, 0.6, 0.6);
const matProc = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.2, wireframe: true });
const slotProcessador = new THREE.Mesh(geoProc, matProc);
slotProcessador.position.set(-1.05, 3.4, 1.0); 
slotProcessador.userData = { tipo: 'processador', nome: 'Slot do Processador' };
cena.add(slotProcessador);

// --- MEMÓRIA RAM (4 SLOTS INDIVIDUAIS PERSONALIZÁVEIS) ---
    const geoRam = new THREE.BoxGeometry(0.15, 1, 0.05); 
    const matRamPadrão = new THREE.MeshBasicMaterial({ color: 0x9b59b6, wireframe: true });

    // 🎯 O CONTROLO MESTRE DOS ARAMES:
    // Estava em -1.05. Mudei para -0.90 para puxar os arames roxos para a frente.
    // Vá testando valores como -0.85, -0.80 ou -0.95 até ficarem no sítio perfeito!
    const posXRam = -0.90; 

    const ram1 = new THREE.Mesh(geoRam, matRamPadrão.clone());
    ram1.position.set(posXRam, 3.55, 0.60);
    ram1.userData = { tipo: 'ram', idHtml: 'ram1', nome: 'Slot RAM 1 (Canal A1)' };
    cena.add(ram1);

    const ram2 = new THREE.Mesh(geoRam, matRamPadrão.clone());
    ram2.position.set(posXRam, 3.55, 0.50);
    ram2.userData = { tipo: 'ram', idHtml: 'ram2', nome: 'Slot RAM 2 (A2 - Dual Channel)' };
    cena.add(ram2);

    const ram3 = new THREE.Mesh(geoRam, matRamPadrão.clone());
    ram3.position.set(posXRam, 3.55, 0.40);
    ram3.userData = { tipo: 'ram', idHtml: 'ram3', nome: 'Slot RAM 3 (Canal B1)' };
    cena.add(ram3);

    const ram4 = new THREE.Mesh(geoRam, matRamPadrão.clone());
    ram4.position.set(posXRam, 3.55, 0.30);
    ram4.userData = { tipo: 'ram', idHtml: 'ram4', nome: 'Slot RAM 4 (B2 - Dual Channel)' };
    cena.add(ram4);

// --- ARMAZENAMENTO M.2 NVMe (Na Placa-Mãe) ---
const geoM2 = new THREE.BoxGeometry(0.05, 0.15, 0.6); 
const matM2 = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true }); 
const slotM2 = new THREE.Mesh(geoM2, matM2);
slotM2.position.set(-1.05, 2.6, 1.0); 
slotM2.userData = { tipo: 'armazenamento', idHtml: 'armazenamento', nome: 'Slot M.2 NVMe' };
cena.add(slotM2);

const geoGpu = new THREE.BoxGeometry(1.4, 0.6, 2.6);
const matGpu = new THREE.MeshBasicMaterial({ color: 0xe67e22, transparent: true, opacity: 0.3, wireframe: true });
const slotGpu = new THREE.Mesh(geoGpu, matGpu);
slotGpu.position.set(-0.4, 2.2, 0.5); 
slotGpu.userData = { tipo: 'gpu', nome: 'Slot PCIe (Placa de Vídeo)' };
cena.add(slotGpu);

const geoCooler = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const matCooler = new THREE.MeshBasicMaterial({ color: 0x3498db, transparent: true, opacity: 0.3, wireframe: true });
const slotCooler = new THREE.Mesh(geoCooler, matCooler);
slotCooler.position.set(-0.7, 3.4, 1.0); 
slotCooler.userData = { tipo: 'cooler', nome: 'Bloco de Refrigeração' };
cena.add(slotCooler);

const geoFonte = new THREE.BoxGeometry(1.6, 1.1, 1.6);
const matFonte = new THREE.MeshBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.3, wireframe: true });
const slotFonte = new THREE.Mesh(geoFonte, matFonte);
slotFonte.position.set(-0.4, 0.6, 1.42); 
slotFonte.userData = { tipo: 'fonte', nome: 'Espaço da Fonte' };
cena.add(slotFonte);

// --- SLOT DE ARMAZENAMENTO (SSD SATA) ---
const geoSsd = new THREE.BoxGeometry(0.15, 1.0, 0.7); 
const matSsd = new THREE.MeshBasicMaterial({ color: 0xffa500, wireframe: true }); 
const slotSsd = new THREE.Mesh(geoSsd, matSsd);
slotSsd.position.set(-1.35, 2.5, 1.0); 
slotSsd.userData = { tipo: 'armazenamento', nome: 'Compartimento Traseiro SSD SATA' };
cena.add(slotSsd);

const geoTeto = new THREE.BoxGeometry(2.4, 0.1, 4.5);
const matTeto = new THREE.MeshBasicMaterial({ color: 0x9b59b6, transparent: true, opacity: 0.3, wireframe: true });
const slotTeto = new THREE.Mesh(geoTeto, matTeto);
slotTeto.position.set(0, 4.55, 0); 
slotTeto.userData = { tipo: 'teto', nome: 'Painel Superior (Teto)' };
cena.add(slotTeto);

// --- VENTOINHAS INDIVIDUAIS (ARAMES RESERVAS) ---
const geoFan = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16);
const criarMatFan = () => new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.8 });
const listaFans = []; 

// 1. Fan Traseiro
const fanTras = new THREE.Mesh(geoFan, criarMatFan());
fanTras.rotation.x = Math.PI / 2;
fanTras.position.set(0.10, 3.5, 2); 
fanTras.userData = { tipo: 'fan-tras', nome: 'Ventoinha Traseira' };
cena.add(fanTras);
listaFans.push(fanTras);

// 2. Fans Frontais
const fanFrente1 = new THREE.Mesh(geoFan, criarMatFan());
fanFrente1.rotation.x = Math.PI / 2;
fanFrente1.position.set(0, 3.9, -2.15);
fanFrente1.userData = { tipo: 'fan-frente1', nome: 'Ventoinha Frontal (Topo)' };
cena.add(fanFrente1);
listaFans.push(fanFrente1);

const fanFrente2 = new THREE.Mesh(geoFan, criarMatFan());
fanFrente2.rotation.x = Math.PI / 2;
fanFrente2.position.set(0, 2.8, -2.15); 
fanFrente2.userData = { tipo: 'fan-frente2', nome: 'Ventoinha Frontal (Meio)' };
cena.add(fanFrente2);
listaFans.push(fanFrente2);

const fanFrente3 = new THREE.Mesh(geoFan, criarMatFan());
fanFrente3.rotation.x = Math.PI / 2;
fanFrente3.position.set(0, 1.7, -2.15); 
fanFrente3.userData = { tipo: 'fan-frente3', nome: 'Ventoinha Frontal (Baixo)' };
cena.add(fanFrente3);
listaFans.push(fanFrente3);

// 3. FANS DO TETO INDIVIDUAIS
const fanTeto1 = new THREE.Mesh(geoFan, criarMatFan());
fanTeto1.position.set(0, 4.20, -1.1); 
fanTeto1.visible = false;
fanTeto1.userData = { tipo: 'fan-teto1', nome: 'Ventoinha do Teto 1 (Frente)' };
cena.add(fanTeto1);
listaFans.push(fanTeto1); 

const fanTeto2 = new THREE.Mesh(geoFan, criarMatFan());
fanTeto2.position.set(0, 4.20, 0);
fanTeto2.visible = false;
fanTeto2.userData = { tipo: 'fan-teto2', nome: 'Ventoinha do Teto 2 (Meio)' };
cena.add(fanTeto2);
listaFans.push(fanTeto2);

const fanTeto3 = new THREE.Mesh(geoFan, criarMatFan());
fanTeto3.position.set(0, 4.20, 1.1);
fanTeto3.visible = false;
fanTeto3.userData = { tipo: 'fan-teto3', nome: 'Ventoinha do Teto 3 (Traseira)' };
cena.add(fanTeto3);
listaFans.push(fanTeto3);

// --- RADIADORES DO WATER COOLER ---
const geoRad240 = new THREE.BoxGeometry(1.2, 0.2, 2.4);
const geoRad360 = new THREE.BoxGeometry(1.2, 0.2, 3.5);
const matRad = new THREE.MeshBasicMaterial({ color: 0x95a5a6, wireframe: true, transparent: true, opacity: 0.8 });

const radiador240 = new THREE.Mesh(geoRad240, matRad);
radiador240.position.set(0, 4.40, -0.55);
radiador240.visible = false;
radiador240.userData = { tipo: 'cooler', nome: 'Radiador (240mm)' };
cena.add(radiador240);

const radiador360 = new THREE.Mesh(geoRad360, matRad);
radiador360.position.set(0, 4.40, 0); 
radiador360.visible = false;
radiador360.userData = { tipo: 'cooler', nome: 'Radiador (360mm)' };
cena.add(radiador360);

// 🔴 NOVO: O BOTÃO POWER 3D NO GABINETE
const geoBotao = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
const matBotao = new THREE.MeshBasicMaterial({ color: 0xff0000 }); 
const botaoPower3D = new THREE.Mesh(geoBotao, matBotao);
botaoPower3D.position.set(0.8, 4.6, -2.1); 
botaoPower3D.userData = { tipo: 'botao-power', nome: 'Botão Power do Gabinete' };
cena.add(botaoPower3D);

const objetosInterativos = [slotPlacaMae, slotProcessador, ram1, ram2, ram3, ram4, slotGpu, slotFonte, slotCooler, slotTeto, slotSsd, slotM2, fanTras, fanFrente1, fanFrente2, fanFrente3, fanTeto1, fanTeto2, fanTeto3, radiador240, radiador360, botaoPower3D];

objetosInterativos.forEach(obj => {
    obj.userData.corOriginal = obj.material.color.getHex();
    obj.userData.opacidadeOriginal = obj.material.opacity;
});

// ==========================================================================
// 3. SENSOR DO MOUSE E TOOLTIP
// ==========================================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let toqueInicialX = 0;
let toqueInicialY = 0;

window.addEventListener('pointerdown', (evento) => {
    toqueInicialX = evento.clientX;
    toqueInicialY = evento.clientY;
});

window.addEventListener('pointerup', (evento) => {
    const moveuX = Math.abs(evento.clientX - toqueInicialX);
    const moveuY = Math.abs(evento.clientY - toqueInicialY);

    if (moveuX > 5 || moveuY > 5) return; 
    
    const menuPrincipal = document.getElementById('menu-inferior');
    const menuFlutuante = document.getElementById('menu-flutuante');
    const logsPanel = document.getElementById('painel-logs');

    if (evento.target.id === 'select-flutuante' || 
        (menuPrincipal && menuPrincipal.contains(evento.target)) || 
        (menuFlutuante && menuFlutuante.contains(evento.target)) || 
        (logsPanel && logsPanel.contains(evento.target))) {
        return; 
    }

    mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(evento.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersecoes = raycaster.intersectObjects(objetosInterativos);

    if (intersecoes.length > 0) {
        if (menuPrincipal) menuPrincipal.classList.add('esconder-menu'); 
        
        const objetoAtingido = intersecoes[0].object;
        const alvoId = objetoAtingido.userData.idHtml || objetoAtingido.userData.tipo;
        const tipo = objetoAtingido.userData.tipo;

        if (tipo === 'botao-power') {
            let btnUI = document.getElementById('btn-power');
            if (btnUI && !btnUI.disabled) {
                alternarEnergia();
            } else {
                botaoPower3D.material.color.setHex(0x550000);
                setTimeout(() => botaoPower3D.material.color.setHex(0xff0000), 200);
                if(logsPanel) {
                    logsPanel.style.transition = "transform 0.1s";
                    logsPanel.style.transform = "scale(1.05)";
                    setTimeout(() => logsPanel.style.transform = "scale(1)", 150);
                }
            }
            return; 
        }

        objetosInterativos.forEach(obj => {
            obj.material.color.setHex(0x1a1a1a);
            obj.material.opacity = 0.1;
        });
        objetoAtingido.material.color.setHex(0x00ffff);
        objetoAtingido.material.opacity = 0.8;
        
        const elementoMenu = document.getElementById(`grupo-${alvoId}`);
        if (elementoMenu) elementoMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        document.getElementById('menu-titulo').innerText = objetoAtingido.userData.nome;
        const selectFlutuante = document.getElementById('select-flutuante');
        const selectOriginal = document.getElementById(alvoId);
        
        if (selectOriginal) {
            selectFlutuante.innerHTML = ''; 
            Array.from(selectOriginal.options).forEach(opt => {
                let novaOpcao = document.createElement('option');
                novaOpcao.value = opt.value;
                novaOpcao.text = opt.text;
                selectFlutuante.appendChild(novaOpcao);
            });
            selectFlutuante.value = selectOriginal.value;
            selectFlutuante.dataset.alvo = alvoId;
            selectFlutuante.disabled = selectOriginal.disabled; 
        }

        if (menuFlutuante) {
            menuFlutuante.style.display = 'block';
            menuFlutuante.style.left = (evento.clientX + 15) + 'px';
            menuFlutuante.style.top = (evento.clientY + 15) + 'px';
        }

    } else {
        if (menuPrincipal) menuPrincipal.classList.remove('esconder-menu'); 
        if (menuFlutuante) menuFlutuante.style.display = 'none'; 
        
        objetosInterativos.forEach(obj => {
            obj.material.color.setHex(obj.userData.corOriginal);
            obj.material.opacity = obj.userData.opacidadeOriginal;
        });
    }
});

document.getElementById('select-flutuante').addEventListener('change', function() {
    const componenteAlvo = this.dataset.alvo;
    const selectOriginal = document.getElementById(componenteAlvo);
    
    if (selectOriginal) {
        selectOriginal.value = this.value; 
        verificarCompatibilidade(); 
    }
});

const tooltip3D = document.getElementById('tooltip-3d');
window.addEventListener('mousemove', (evento) => {
    mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(evento.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (typeof menuFlutuante !== 'undefined' && menuFlutuante && menuFlutuante.style.display === 'block') {
        if (tooltip3D) tooltip3D.style.display = 'none';
        return;
    }

    const intersecoes = raycaster.intersectObjects(objetosInterativos);
    if (intersecoes.length > 0) {
        const objetoAtingido = intersecoes[0].object;
        if (objetoAtingido.userData.nome && tooltip3D) {
            tooltip3D.innerText = objetoAtingido.userData.nome;
            tooltip3D.style.display = 'block';
            tooltip3D.style.left = (evento.clientX + 15) + 'px';
            tooltip3D.style.top = (evento.clientY + 15) + 'px';
            document.body.style.cursor = 'pointer';
        }
    } else {
        if (tooltip3D) tooltip3D.style.display = 'none';
        document.body.style.cursor = 'default'; 
    }
});

// ==========================================================================
// 4. LÓGICA, COMPATIBILIDADE E SISTEMA DE VENTOINHAS (.GLB)
// ==========================================================================

function extrairWatts(idMenu) {
    let el = document.getElementById(idMenu);
    if (!el || el.value === "") return 0;
    return parseInt(el.options[el.selectedIndex].getAttribute('data-watts')) || 0;
}

const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
const getEl = (id) => document.getElementById(id);

function atualizarBotao(id, ativo, classeAtiva, classeInativa, texto = null) {
    let btn = getEl(id);
    if (!btn) return;
    btn.disabled = !ativo;
    btn.className = ativo ? classeAtiva : classeInativa;
    if (texto) btn.innerText = texto;
}

function verificarCompatibilidade() {
    let gabineteValue = getVal('gabinete') || "mid-tower";
    let placaMaeValue = getVal('placa-mae');
    let processador = getVal('processador');
    let gpu = getVal('gpu');
    let fonte = getVal('fonte');
    let armazenamento = getVal('armazenamento');
    let cooler = getVal('cooler');




   // =======================================================
    // 👻 CAÇA-FANTASMAS 3D: Controlo de Modelos e Arames
    // =======================================================
    if (typeof modeloGpuReal !== 'undefined' && modeloGpuReal) modeloGpuReal.visible = (gpu !== "");
    if (typeof modeloPlacaReal !== 'undefined' && modeloPlacaReal) modeloPlacaReal.visible = (placaMaeValue !== "");
    if (typeof modeloProcessadorReal !== 'undefined' && modeloProcessadorReal) modeloProcessadorReal.visible = (processador !== "");

    // 🛡️ FUNÇÃO BLINDADA: Força o arame a sumir, mas mantém a peça clicável!
    function alternarArame(slot, estaOcupado) {
        if (!slot) return;
        slot.material.transparent = true; // Obriga o 3D a aceitar a invisibilidade
        
        if (estaOcupado) {
            slot.material.opacity = 0;
            slot.material.wireframe = false; // Desliga os riscos à força!
            slot.userData.opacidadeOriginal = 0;
        } else {
            slot.material.opacity = 0.3;
            slot.material.wireframe = true; // Volta a ligar os riscos
            slot.userData.opacidadeOriginal = 0.3;
        }
        slot.material.needsUpdate = true; // Atualiza os gráficos na hora
    }

    // Variáveis para saber que tipo de SSD temos
    let isM2 = armazenamento.includes("m2") || armazenamento.includes("nvme");
    let isSata = armazenamento.includes("sata");

    // Aplica a magia aos 3 slots rebeldes
    alternarArame(typeof slotCooler !== 'undefined' ? slotCooler : null, cooler !== "");
    alternarArame(typeof slotM2 !== 'undefined' ? slotM2 : null, isM2);
    alternarArame(typeof slotSsd !== 'undefined' ? slotSsd : null, isSata);


    // =======================================================
    // 🧠 1. CÉREBRO DOS RADIADORES E TETO
    // =======================================================
    let selectTeto = getEl('teto'), selectTeto1 = getEl('fan-teto1'), selectTeto2 = getEl('fan-teto2'), selectTeto3 = getEl('fan-teto3');

    if (cooler === 'wc240' || cooler === 'wc360') {
        let is360 = (cooler === 'wc360');
        if (selectTeto) { 
            selectTeto.innerHTML = `<option value="radiador">[ Ocupado pelo Radiador ${is360 ? '360' : '240'}mm ]</option>`; 
            selectTeto.disabled = true; 
        }
        if (selectTeto1) { selectTeto1.disabled = false; if(selectTeto1.parentElement) selectTeto1.parentElement.style.display = 'block'; }
        if (selectTeto2) { selectTeto2.disabled = false; if(selectTeto2.parentElement) selectTeto2.parentElement.style.display = 'block'; }
        if (selectTeto3) { 
            selectTeto3.disabled = false; 
            if(selectTeto3.parentElement) selectTeto3.parentElement.style.display = is360 ? 'block' : 'none'; 
            if (!is360) selectTeto3.value = ""; 
        }

        if (typeof fanTeto1 !== 'undefined') fanTeto1.visible = true;
        if (typeof fanTeto2 !== 'undefined') fanTeto2.visible = true;
        if (typeof fanTeto3 !== 'undefined') fanTeto3.visible = is360;
        
        if (typeof radiador240 !== 'undefined') { radiador240.visible = !is360; radiador240.material.wireframe = false; radiador240.material.color.setHex(0xbdc3c7); }
        if (typeof radiador360 !== 'undefined') { radiador360.visible = is360; radiador360.material.wireframe = false; radiador360.material.color.setHex(0xbdc3c7); }
    } else {
        if (selectTeto && selectTeto.disabled) {
            selectTeto.innerHTML = `<option value="">-- Vazio --</option><option value="2xfan">Instalar 2x Ventoinhas</option><option value="3xfan">Instalar 3x Ventoinhas</option>`;
            selectTeto.disabled = false;
        }
        let valTeto = selectTeto ? selectTeto.value : "";
        let usa2Fans = (valTeto === '2xfan');
        let usa3Fans = (valTeto === '3xfan');

        if (selectTeto1) { selectTeto1.disabled = false; if(selectTeto1.parentElement) selectTeto1.parentElement.style.display = (usa2Fans || usa3Fans) ? 'block' : 'none'; if (!usa2Fans && !usa3Fans) selectTeto1.value = ""; }
        if (selectTeto2) { selectTeto2.disabled = false; if(selectTeto2.parentElement) selectTeto2.parentElement.style.display = (usa2Fans || usa3Fans) ? 'block' : 'none'; if (!usa2Fans && !usa3Fans) selectTeto2.value = ""; }
        if (selectTeto3) { selectTeto3.disabled = false; if(selectTeto3.parentElement) selectTeto3.parentElement.style.display = usa3Fans ? 'block' : 'none'; if (!usa3Fans) selectTeto3.value = ""; }

        if (typeof fanTeto1 !== 'undefined') fanTeto1.visible = (usa2Fans || usa3Fans);
        if (typeof fanTeto2 !== 'undefined') fanTeto2.visible = (usa2Fans || usa3Fans);
        if (typeof fanTeto3 !== 'undefined') fanTeto3.visible = usa3Fans;
        if (typeof radiador240 !== 'undefined') radiador240.visible = false;
        if (typeof radiador360 !== 'undefined') radiador360.visible = false;
    }

    // =======================================================
    // 🌬️ 2. SISTEMA E DISTRIBUIÇÃO DAS VENTOINHAS 3D
    // =======================================================
    let arrayFans = [getVal('fan-tras'), getVal('fan-frente1'), getVal('fan-frente2'), getVal('fan-frente3'), getVal('fan-teto1'), getVal('fan-teto2'), getVal('fan-teto3')];
    let fansIn = arrayFans.filter(f => f.includes('in')).length;
    let fansOut = arrayFans.filter(f => f.includes('out')).length;
    let totalFans = arrayFans.filter(f => f !== "").length;
    let precisaDeFan = totalFans > 0;

    function distribuirFans3D() {
        if (!modeloFanBase) return;

        let tetoAberto = (getVal('teto') === '2xfan' || getVal('teto') === '3xfan' || getVal('cooler') === 'wc240' || getVal('cooler') === 'wc360');
        let teto3Aberto = (getVal('teto') === '3xfan' || getVal('cooler') === 'wc360');

        function aplicarFan(chave, arame, valorMenu, localMontagem, slotDisponivel = true) {
            if (typeof modelosFansInstalados === 'undefined') window.modelosFansInstalados = {};

            if (modelosFansInstalados[chave]) { 
                cena.remove(modelosFansInstalados[chave]); 
                modelosFansInstalados[chave] = null; 
            }
            if (!arame) return;

            if (valorMenu === "") {
                arame.visible = slotDisponivel; 
                arame.material.wireframe = true; 
                arame.material.opacity = 0.3; 
                arame.material.color.setHex(0x00ffff); 
                arame.userData.opacidadeOriginal = 0.3;
                return;
            } else {
                arame.visible = false; 
            }

            let novaFan = modeloFanBase.clone();
            novaFan.position.copy(arame.position);
            novaFan.scale.set(4, 4, 4); 
            novaFan.rotation.set(0, 0, 0); 
            
            if (localMontagem === 'teto') novaFan.rotateX(Math.PI / 2); 
            if (valorMenu.includes("out")) novaFan.rotateY(Math.PI); 
            else if (valorMenu.includes("in")) novaFan.rotateY(0); 

            cena.add(novaFan);
            modelosFansInstalados[chave] = novaFan;
        }

        aplicarFan('fanTras', typeof fanTras !== 'undefined' ? fanTras : null, getVal('fan-tras'), 'parede', true);
        aplicarFan('fanFrente1', typeof fanFrente1 !== 'undefined' ? fanFrente1 : null, getVal('fan-frente1'), 'parede', true);
        aplicarFan('fanFrente2', typeof fanFrente2 !== 'undefined' ? fanFrente2 : null, getVal('fan-frente2'), 'parede', true);
        aplicarFan('fanFrente3', typeof fanFrente3 !== 'undefined' ? fanFrente3 : null, getVal('fan-frente3'), 'parede', true);
        aplicarFan('fanTeto1', typeof fanTeto1 !== 'undefined' ? fanTeto1 : null, getVal('fan-teto1'), 'teto', tetoAberto);
        aplicarFan('fanTeto2', typeof fanTeto2 !== 'undefined' ? fanTeto2 : null, getVal('fan-teto2'), 'teto', tetoAberto);
        aplicarFan('fanTeto3', typeof fanTeto3 !== 'undefined' ? fanTeto3 : null, getVal('fan-teto3'), 'teto', teto3Aberto);
    }

    if (precisaDeFan && typeof modeloFanBase !== 'undefined' && modeloFanBase === null && typeof carregandoFan !== 'undefined' && !carregandoFan) {
        carregandoFan = true;
        if(typeof telaCarregamento !== 'undefined' && telaCarregamento) { telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1'; }
        
        carregador.load('modelos/fan.glb', function(gltf) {
            let modeloOriginal = gltf.scene;
            let caixaContorno = new THREE.Box3().setFromObject(modeloOriginal);
            let centroReal = new THREE.Vector3();
            caixaContorno.getCenter(centroReal);
            modeloOriginal.position.set(-centroReal.x, -centroReal.y, -centroReal.z); 
            
            let envelope = new THREE.Group();
            envelope.add(modeloOriginal);
            
            modeloFanBase = envelope; 
            carregandoFan = false; 
            distribuirFans3D(); 
        }, undefined, function(erro) { console.error("❌ ERRO:", erro); carregandoFan = false; });
    } else if (typeof modeloFanBase !== 'undefined' && modeloFanBase !== null) {
        distribuirFans3D();
    }

    // =======================================================
    // 🧠 3. SISTEMA DE CLONES DA MEMÓRIA RAM (.GLB)
    // =======================================================
    function distribuirRam3D() {
        if (typeof modeloRamBase === 'undefined' || !modeloRamBase) return;
        
        ['ram1', 'ram2', 'ram3', 'ram4'].forEach(id => {
            let valorMenu = getVal(id);
            let arame = getEl(id) ? (id === 'ram1' ? ram1 : id === 'ram2' ? ram2 : id === 'ram3' ? ram3 : ram4) : null;
            
            if (modelosRamInstalados[id]) { cena.remove(modelosRamInstalados[id]); modelosRamInstalados[id] = null; }
            if (!arame) return;

            if (valorMenu === "") {
                arame.visible = true; arame.material.wireframe = true; arame.material.opacity = 0.3;
                arame.material.color.setHex(0x9b59b6); arame.userData.opacidadeOriginal = 0.3;
            } else {
                arame.visible = false;
                let novaRam = modeloRamBase.clone();
                
                // ==========================================
                // 🔎 ESCALA DA RAM
                // A peça estava gigante. Reduzi para 0.15, ajuste se ficar muito pequena/grande
                // ==========================================
                novaRam.scale.set(0.20, 0.20, 0.20); 
                
                // ==========================================
                // 🔄 ROTAÇÃO DA RAM
                // ==========================================
                novaRam.rotation.set(0, 0, 0);
                
                // O Math.PI / 2 (90 graus) vai forçar a RAM a ficar em pé. 
                // Se ela ficar atravessada nos slots, mude o Math.PI/2 para o eixo Y ou Z
                novaRam.rotation.x = Math.PI / 2; 
                novaRam.rotation.y = 0; 
                novaRam.rotation.z = 0; 
                
                // ==========================================
                // ↕️↔️ POSIÇÃO DA RAM
                // Como agora o centro é automático, ela vai colar exatamento no arame roxo!
                // ==========================================
                novaRam.position.copy(arame.position);
                novaRam.position.x += 0;
                novaRam.position.y += 0; // Se precisar afundar mais no slot, use -0.1, etc.
                novaRam.position.z += 0;
                
                cena.add(novaRam);
                modelosRamInstalados[id] = novaRam;
            }
        });
    }

    let precisaDeRam = getVal('ram1') !== "" || getVal('ram2') !== "" || getVal('ram3') !== "" || getVal('ram4') !== "";

    if (precisaDeRam && (typeof modeloRamBase === 'undefined' || modeloRamBase === null) && !carregandoRam) {
        carregandoRam = true;
        if(typeof telaCarregamento !== 'undefined' && telaCarregamento) { telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1'; }
        
        carregador.load('modelos/ram.glb', function(gltf) {
            let modeloOriginal = gltf.scene;
            
            // 🎯 A MÁGICA: CENTRALIZADOR AUTOMÁTICO DE PIVÔ (Resolve a peça a flutuar)
            let caixaContorno = new THREE.Box3().setFromObject(modeloOriginal);
            let centroReal = new THREE.Vector3();
            caixaContorno.getCenter(centroReal);
            modeloOriginal.position.set(-centroReal.x, -centroReal.y, -centroReal.z); 
            
            let envelope = new THREE.Group();
            envelope.add(modeloOriginal);
            
            modeloRamBase = envelope;
            carregandoRam = false;
            distribuirRam3D();
        });
    } else if (typeof modeloRamBase !== 'undefined' && modeloRamBase !== null) {
        distribuirRam3D();
    }

    
    if (precisaDeRam && (typeof modeloRamBase === 'undefined' || modeloRamBase === null) && !carregandoRam) {
        carregandoRam = true;
        if(typeof telaCarregamento !== 'undefined' && telaCarregamento) { telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1'; }
        
        carregador.load('modelos/ram.glb', function(gltf) {
            modeloRamBase = gltf.scene;
            carregandoRam = false;
            distribuirRam3D();
        });
    } else if (typeof modeloRamBase !== 'undefined' && modeloRamBase !== null) {
        distribuirRam3D();
    }

    // =======================================================
    // 📦 4. CARREGAMENTO DOS MODELOS 3D (.GLB) PRINCIPAIS
    // =======================================================
    if (placaMaeValue !== "" && typeof modeloPlacaReal !== 'undefined' && modeloPlacaReal === null) {
        if(typeof telaCarregamento !== 'undefined' && telaCarregamento) { telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1'; }
        carregador.load('modelos/placa.glb', function(gltf) {
            modeloPlacaReal = gltf.scene; modeloPlacaReal.scale.set(0.8, 0.8, 0.8);
            modeloPlacaReal.rotation.set(0, Math.PI / 2, 0); modeloPlacaReal.position.set(-1.05, 3.4, 0.5); 
            cena.add(modeloPlacaReal); if(typeof slotPlacaMae !== 'undefined' && slotPlacaMae) { slotPlacaMae.material.opacity = 0; slotPlacaMae.userData.opacidadeOriginal = 0; }
        });
    }

    if (processador !== "" && typeof modeloProcessadorReal !== 'undefined' && modeloProcessadorReal === null) {
        if(typeof telaCarregamento !== 'undefined' && telaCarregamento) { telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1'; }
        carregador.load('modelos/processador.glb', function(gltf) {
            modeloProcessadorReal = gltf.scene; modeloProcessadorReal.scale.set(0.80, 0.80, 0.80); 
            modeloProcessadorReal.rotation.set(1.55, 1.5, 0); modeloProcessadorReal.rotateX(Math.PI / 2); modeloProcessadorReal.rotateY(Math.PI / 2); 
            modeloProcessadorReal.position.set(-0.90, 3.5, 1.0); cena.add(modeloProcessadorReal); 
            if(typeof slotProcessador !== 'undefined' && slotProcessador) { slotProcessador.material.opacity = 0; slotProcessador.userData.opacidadeOriginal = 0; }
        });
    }

    if (gpu !== "" && typeof modeloGpuReal !== 'undefined' && modeloGpuReal === null) {
        if(typeof telaCarregamento !== 'undefined' && telaCarregamento) { telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1'; }
        
        carregador.load('modelos/placavideo.glb', function(gltf) {
            modeloGpuReal = gltf.scene; 
            modeloGpuReal.scale.set(0.40, 0.40, 0.40);
            
            modeloGpuReal.rotation.set(0, 0, 0); 
            modeloGpuReal.rotation.x = Math.PI; 
            modeloGpuReal.rotation.y = -Math.PI / 2; 
            modeloGpuReal.rotation.z = 0;  
            
            if(typeof slotGpu !== 'undefined' && slotGpu) {
                modeloGpuReal.position.copy(slotGpu.position); 
                modeloGpuReal.position.x += 0.1;
                modeloGpuReal.position.y += 0.5; 
                modeloGpuReal.position.z += 0.3; 
            }

            cena.add(modeloGpuReal); 
            
            if(typeof slotGpu !== 'undefined' && slotGpu) { 
                slotGpu.material.opacity = 0; 
                slotGpu.userData.opacidadeOriginal = 0; 
            }
        });
    }

    // ==========================================
    // 🔌 CARREGAMENTO DA FONTE (PSU)
    // ==========================================
    if (fonte !== "" && typeof modeloFonteReal !== 'undefined' && modeloFonteReal === null) {
        if(typeof telaCarregamento !== 'undefined' && telaCarregamento) { telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1'; }
        
        carregador.load('modelos/fonte.glb', function(gltf) {
            let modeloOriginal = gltf.scene; 
            
            // 🎯 A MÁGICA: CENTRALIZADOR AUTOMÁTICO DE PIVÔ
            let caixaContorno = new THREE.Box3().setFromObject(modeloOriginal);
            let centroReal = new THREE.Vector3();
            caixaContorno.getCenter(centroReal);
            modeloOriginal.position.set(-centroReal.x, -centroReal.y, -centroReal.z); 
            
            let envelope = new THREE.Group();
            envelope.add(modeloOriginal);
            
            modeloFonteReal = envelope; // Agora o modeloReal é o nosso envelope perfeitamente centrado!
            
            // ==========================================
            // 🔎 ESCALA
            // A peça devia estar gigante. Começamos com 0.10. 
            // Se ficar minúscula, suba para 0.3, 0.5, etc.
            // ==========================================
            modeloFonteReal.scale.set(0.10, 0.10, 0.10); 
            
            // ==========================================
            // 🔄 ROTAÇÃO
            // ==========================================
            modeloFonteReal.rotation.set(0, 0, 0);
            
            modeloFonteReal.rotation.x = 0; 
            
            // Se a ventoinha da fonte não estiver a apontar para baixo (ou para cima), 
            // ou se os cabos estiverem virados para fora, experimente Math.PI / 2 ou Math.PI aqui
            modeloFonteReal.rotation.y = 0; 
            
            modeloFonteReal.rotation.z = 0; 
            
            // ==========================================
            // ↕️↔️ POSIÇÃO
            // ==========================================
            if(typeof slotFonte !== 'undefined' && slotFonte) {
                modeloFonteReal.position.copy(slotFonte.position); 
                
                modeloFonteReal.position.x += 0;
                modeloFonteReal.position.y += 0;
                modeloFonteReal.position.z += 0;
            }
            
            cena.add(modeloFonteReal); 
            if(typeof slotFonte !== 'undefined' && slotFonte) { slotFonte.material.opacity = 0; slotFonte.userData.opacidadeOriginal = 0; }
        });
    }

    // ==========================================
    // 💾 CARREGAMENTO DO ARMAZENAMENTO (M.2 e SATA)
    // ==========================================
    if (armazenamento !== "") {
        let isM2 = armazenamento.includes("m2") || armazenamento.includes("nvme");
        let isSata = armazenamento.includes("sata");

        // --- NVMe (M.2) ---
        if (isM2 && typeof modeloNvmeReal !== 'undefined' && modeloNvmeReal === null) {
            carregador.load('modelos/nvme.glb', function(gltf) {
                modeloNvmeReal = gltf.scene; 
                
                // 🔎 1. ESCALA (Tamanho)
                // Reduzi para 0.10 para tirar aquele aspecto de "prancha de surf". 
                // Se ainda ficar grande, mude para 0.05. Se sumir, suba para 0.20.
                modeloNvmeReal.scale.set(0.15, 0.15, 0.15);
                
                // 🔄 2. ROTAÇÃO
                modeloNvmeReal.rotation.set(0, 0, 0);
                
                
                // 1. Mantém o que funcionou para o levantar (exemplo com Z)
                modeloNvmeReal.rotation.z = Math.PI / 2; 
                
                // 🪄 O TOQUE MÁGICO FINAL: Dá uma meia-volta (180º) para a frente aparecer!
                modeloNvmeReal.rotation.y = Math.PI; 
                
                modeloNvmeReal.rotation.x = 0;
                
                // ↕️↔️ 3. POSIÇÃO FINO
                if(typeof slotM2 !== 'undefined' && slotM2) {
                    modeloNvmeReal.position.copy(slotM2.position); 
                    
                    // Ajustes de empurrão (em relação ao slot da placa-mãe):
                    modeloNvmeReal.position.x += 0.2; // Esquerda (-) / Direita (+)
                    modeloNvmeReal.position.y += 0.33; // Baixo (-) / Cima (+)
                    modeloNvmeReal.position.z += 0.1; // Trás (-) / Frente (+)
                }
                
                cena.add(modeloNvmeReal);
                if(typeof slotM2 !== 'undefined' && slotM2) { 
                    slotM2.material.opacity = 0; 
                    slotM2.userData.opacidadeOriginal = 0; 
                }
            });
        }
        
        // --- SSD SATA (2.5") ---
        if (isSata && typeof modeloSsdReal !== 'undefined' && modeloSsdReal === null) {
            carregador.load('modelos/ssd.glb', function(gltf) {
                let modeloOriginal = gltf.scene;
                
                let caixaContorno = new THREE.Box3().setFromObject(modeloOriginal);
                let centroReal = new THREE.Vector3();
                caixaContorno.getCenter(centroReal);
                modeloOriginal.position.set(-centroReal.x, -centroReal.y, -centroReal.z); 
                
                let envelope = new THREE.Group();
                envelope.add(modeloOriginal);
                modeloSsdReal = envelope;
                
                // 🔎 1. ESCALA 
                // Se ele parecer muito pequeno na caixa amarela, aumente para 0.30 ou 0.40
                modeloSsdReal.scale.set(1, 1, 1);
                
                // ==========================================
                // 🔄 2. ROTAÇÃO (Colocar de pé)
                // ==========================================
                modeloSsdReal.rotation.set(0, 0, 0);
                
                // Math.PI / 2 levanta a peça 90 graus. 
                modeloSsdReal.rotation.x = Math.PI / 2; 
                
                modeloSsdReal.rotation.y = 0;
                
                // (Se ele ficar em pé mas de lado/atravessado, tire o Math.PI / 2 do 'x' e coloque aqui no 'z')
                modeloSsdReal.rotation.z = 1.55; 
                
                // ==========================================
                // ↕️↔️ 3. POSIÇÃO FINO (Empurrar para a caixa)
                // ==========================================
                if(typeof slotSsd !== 'undefined' && slotSsd) {
                    modeloSsdReal.position.copy(slotSsd.position);
                    
                    // Pela sua imagem, ele precisa de ir para a ESQUERDA e um pouco para CIMA
                    modeloSsdReal.position.x -= -0.0; // Valor negativo empurra para a Esquerda
                    modeloSsdReal.position.y += 0; // Valor positivo sobe a peça
                    modeloSsdReal.position.z += 0;
                }
                
                cena.add(modeloSsdReal);
                if(typeof slotSsd !== 'undefined' && slotSsd) { 
                    slotSsd.material.opacity = 0; 
                    slotSsd.userData.opacidadeOriginal = 0; 
                }
            });
        }

        if (typeof modeloNvmeReal !== 'undefined' && modeloNvmeReal) modeloNvmeReal.visible = isM2;
        if (typeof modeloSsdReal !== 'undefined' && modeloSsdReal) modeloSsdReal.visible = isSata;
    }

    // ==========================================
    // ❄️ CARREGAMENTO DO AIR COOLER
    // ==========================================
    let isAirCooler = (cooler !== "" && cooler !== "wc240" && cooler !== "wc360");

    if (isAirCooler && typeof modeloAirCoolerReal !== 'undefined' && modeloAirCoolerReal === null) {
        if(typeof telaCarregamento !== 'undefined' && telaCarregamento) { telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1'; }
        
        carregador.load('modelos/aircooler.glb', function(gltf) {
            let modeloOriginal = gltf.scene; 
            
            // 🎯 A MÁGICA: CENTRALIZADOR AUTOMÁTICO DE PIVÔ
            let caixaContorno = new THREE.Box3().setFromObject(modeloOriginal);
            let centroReal = new THREE.Vector3();
            caixaContorno.getCenter(centroReal);
            modeloOriginal.position.set(-centroReal.x, -centroReal.y, -centroReal.z); 
            
            let envelope = new THREE.Group();
            envelope.add(modeloOriginal);
            modeloAirCoolerReal = envelope; 
            
            // 🔎 1. ESCALA (Tamanho)
            // Se parecer um bloco gigante de metal, reduza para 0.05 ou 0.10
            modeloAirCoolerReal.scale.set(0.30, 0.30, 0.30); 


          // 🔄 2. ROTAÇÃO (AGORA EM GRAUS NORMAIS)
            modeloAirCoolerReal.rotation.set(0, 0, 0);
            
            // Basta trocar o número dentro dos parênteses! (Tente 90, -90, 180, 270 ou 0)
            
            // Eixo X (Geralmente é o que deita ou levanta a peça)
            modeloAirCoolerReal.rotation.x = THREE.MathUtils.degToRad(0); 
            
            // Gira de lado
            modeloAirCoolerReal.rotation.y = THREE.MathUtils.degToRad(0); 
            
            // Gira pra cima
            modeloAirCoolerReal.rotation.z = THREE.MathUtils.degToRad(-100);


            
            // ↕️↔️ 3. POSIÇÃO FINO
            if(typeof slotCooler !== 'undefined' && slotCooler) {
                modeloAirCoolerReal.position.copy(slotCooler.position); 
                
                // ⬆️ Se ele ficou enterrado na placa-mãe depois de levantar, suba-o aqui:
                modeloAirCoolerReal.position.y += 0; // (Vá testando 0.5, 1.0, 1.5...)
                
                modeloAirCoolerReal.position.x += 0.5;
                modeloAirCoolerReal.position.z += 0;
            }
            
            cena.add(modeloAirCoolerReal);
        });
    }

    if (typeof modeloAirCoolerReal !== 'undefined' && modeloAirCoolerReal) {
        modeloAirCoolerReal.visible = isAirCooler;
    }

    

    // =======================================================
    // 📏 5. FÍSICA E COMPATIBILIDADE (RAM, GPU e GABINETE)
    // =======================================================
    let errosDeMontagem = [], alertasDeMontagem = [];
    let socketPlaca = "", tamanhoPlaca = "";
    if (placaMaeValue !== "") {
        let partes = placaMaeValue.split("-");
        socketPlaca = partes[0]; tamanhoPlaca = partes[1] || "atx";
    }

    if (gabineteValue === "compacto") {
        if (tamanhoPlaca === "atx" || tamanhoPlaca === "eatx") errosDeMontagem.push(`Erro de Chassi: Placa-mãe ${tamanhoPlaca.toUpperCase()} não entra num gabinete Compacto.`);
        if (gpu === "rtx5070ti" || gpu === "rx9070xt") errosDeMontagem.push("Colisão Física: Placa de Vídeo massiva! Baterá na fonte em chassi Compacto.");
        if (cooler === "wc360") errosDeMontagem.push("Erro de Teto: Radiador de 360mm não cabe num gabinete Compacto.");
    } else if (gabineteValue === "mid-tower") {
        if (tamanhoPlaca === "eatx") errosDeMontagem.push("Falta de Espaço: Gabinete suporta no máximo ATX.");
        if (gpu === "rx9070xt") errosDeMontagem.push("Erro de Comprimento: A GPU colide com as ventoinhas frontais neste chassi.");
    } else if (gabineteValue === "full-tower") {
        if (tamanhoPlaca === "matx") alertasDeMontagem.push("Estética: Placa-mãe Micro-ATX num gabinete Full-Tower deixará muito espaço vazio.");
    }

    if (typeof slotGpu !== 'undefined' && slotGpu) {
        if (gpu === "rx9060xt") slotGpu.scale.set(1, 1, 1);
        else if (gpu === "rtx5070ti") slotGpu.scale.set(1, 1, 1.35);
        else if (gpu === "rx9070xt") slotGpu.scale.set(1, 1, 1.7);
        else slotGpu.scale.set(1, 1, 1);
    }

    // =======================================================
    // 📏 REGRAS DE MEMÓRIA RAM
    // =======================================================
    let totalRamNum = ['ram1', 'ram2', 'ram3', 'ram4'].reduce((soma, id) => soma + (getVal(id) !== "" ? 1 : 0), 0);
    let ddrSuportadoPelaPlaca = (socketPlaca === "am4" || socketPlaca === "lga1200") ? "ddr4" : "ddr5";
    let mhzMaximoDaPlaca = (ddrSuportadoPelaPlaca === "ddr4") ? 3600 : 6400;
    
    let ddrDetectado = "";
    let erroDdr = false;
    let erroMisturaGeracao = false;
    let frequenciasRAM = [];

    ['ram1', 'ram2', 'ram3', 'ram4'].forEach(id => {
        let valor = getVal(id);
        if (valor === "") return;
        
        let info = valor.split("-"); 
        let geracao = info[0];
        let mhz = parseInt(info[info.length - 1]) || 3200;

        if (ddrDetectado !== "" && ddrDetectado !== geracao) erroMisturaGeracao = true;
        
        ddrDetectado = geracao; 
        frequenciasRAM.push(mhz); 

        if (placaMaeValue !== "" && geracao !== ddrSuportadoPelaPlaca) erroDdr = true;
    });

    if (erroMisturaGeracao) errosDeMontagem.push("Incompatibilidade Crítica: Não pode misturar gerações diferentes (DDR4 com DDR5).");
    if (erroDdr) errosDeMontagem.push(`Incompatibilidade Física: Placa-mãe exige ${ddrSuportadoPelaPlaca.toUpperCase()}, mas instalou ${ddrDetectado.toUpperCase()}.`);

    if (frequenciasRAM.length > 0) {
        let menorFrequencia = Math.min(...frequenciasRAM);
        let maiorFrequencia = Math.max(...frequenciasRAM);

        if (menorFrequencia !== maiorFrequencia) {
            alertasDeMontagem.push(`Aviso de RAM: Frequências diferentes detectadas. O sistema limitará todas a ${menorFrequencia}MHz.`);
        }

        if (placaMaeValue !== "" && maiorFrequencia > mhzMaximoDaPlaca) {
            errosDeMontagem.push(`Bloqueio: Frequência da RAM (${maiorFrequencia}MHz) excede o limite da placa-mãe (Máx: ${mhzMaximoDaPlaca}MHz).`);
        }

        if (processador !== "") {
            let cpuSocket = processador.split("-")[0];
            let mhzMaximoCpu = (cpuSocket === "am4") ? 3600 : 6400; 
            
            if (maiorFrequencia > mhzMaximoCpu) {
                errosDeMontagem.push(`Incompatibilidade de CPU: O controlador de memória não suporta ${maiorFrequencia}MHz (Máx: ${mhzMaximoCpu}MHz).`);
            }
        }
    }

    if (totalRamNum === 1) alertasDeMontagem.push("Gargalo de Banda: Single Channel ativo. Perca de desempenho em jogos.");
    if (totalRamNum === 2 && (getVal('ram2') === "" || getVal('ram4') === "")) alertasDeMontagem.push("Otimização: Para Dual Channel, use os slots alternados 2 e 4.");
    if (socketPlaca !== "" && processador !== "" && socketPlaca !== processador) errosDeMontagem.push("Soquetes incompatíveis. CPU não encaixa na Placa-Mãe.");

    // =======================================================
    // ⚡ 6. CALCULADORA DE CONSUMO AUTOMÁTICA
    // =======================================================
    let consumoTotal = extrairWatts('placa-mae') + extrairWatts('processador') + extrairWatts('gpu') + extrairWatts('cooler') + extrairWatts('armazenamento') +
        ['ram1', 'ram2', 'ram3', 'ram4', 'fan-tras', 'fan-frente1', 'fan-frente2', 'fan-frente3', 'fan-teto1', 'fan-teto2', 'fan-teto3'].reduce((s, id) => s + extrairWatts(id), 0);
    
    let limiteFonte = extrairWatts('fonte');
    let elConsumo = getEl('consumo-watts');
    if (elConsumo) { elConsumo.innerText = `Consumo: ${consumoTotal} W`; elConsumo.style.display = consumoTotal > 0 ? "block" : "none"; }

    if (consumoTotal > 0) {
        if (fonte === "") errosDeMontagem.push(`Falta Energia: Sistema consome ~${consumoTotal}W, instale uma fonte.`);
        else if (limiteFonte < consumoTotal) errosDeMontagem.push(`Desarme: O PC exige ~${consumoTotal}W, mas a fonte fornece apenas ${limiteFonte}W.`);
        else if (limiteFonte < (consumoTotal * 1.20)) alertasDeMontagem.push(`Aviso: O PC exige ~${consumoTotal}W. Fonte operando perto do limite, considere upgrade.`);
    }

    if (processador !== "" && cooler === "") errosDeMontagem.push("Risco: Falta refrigeração no CPU.");

    let faltaHardwareEssencial = (placaMaeValue === "" || processador === "" || totalRamNum === 0 || fonte === "" || armazenamento === "");
    if (faltaHardwareEssencial && consumoTotal > 0) {
        let lista = [];
        if (placaMaeValue === "") lista.push("Placa-Mãe");
        if (processador === "") lista.push("Processador");
        if (totalRamNum === 0) lista.push("RAM");
        if (fonte === "") lista.push("Fonte");
        if (armazenamento === "") lista.push("Armazenamento");
        alertasDeMontagem.push(`PC inoperante. Faltam: ${lista.join(", ")}.`);
    }

    // =======================================================
    // 🖥️ 7. ATUALIZAÇÃO DA INTERFACE E LOGS
    // =======================================================
    let conteudoLogs = getEl('conteudo-logs');
    let isLigado = typeof sistemaLigado !== 'undefined' && sistemaLigado;

    if (consumoTotal > 0 || totalFans > 0) {
        let htmlFinal = "";
        
        if (errosDeMontagem.length > 0) {
            if (typeof luzAlerta !== 'undefined') { luzAlerta.intensity = 5; luzAlerta.color.setHex(0xc0392b); }
            errosDeMontagem.forEach(err => htmlFinal += `<div class="log-erro">❌ ${err}</div>`);
        }
        
        if (alertasDeMontagem.length > 0) {
            if (errosDeMontagem.length === 0 && typeof luzAlerta !== 'undefined') { luzAlerta.intensity = 3; luzAlerta.color.setHex(0xf1c40f); }
            alertasDeMontagem.forEach(al => htmlFinal += `<div class="log-alerta">⚠️ ${al}</div>`);
        }
        
        let sistemaPronto = (errosDeMontagem.length === 0 && !faltaHardwareEssencial);
        
        if (sistemaPronto) {
            if (typeof luzAlerta !== 'undefined') { luzAlerta.intensity = 5; luzAlerta.color.setHex(0x27ae60); }
            htmlFinal = `<div class="log-sucesso">✅ SISTEMA PRONTO PARA RECEBER CARGA!</div>` + htmlFinal;
            atualizarBotao('btn-power', !isLigado, "btn-pronto", "btn-desligado", "⚡ LIGAR PC");
            atualizarBotao('btn-relatorio', true, "btn-pronto", "btn-desligado");
        } else {
            atualizarBotao('btn-power', false, "btn-desligado", "btn-desligado", "🔌 LIGAR PC");
            atualizarBotao('btn-relatorio', false, "btn-desligado", "btn-desligado");
        }
        
        if (totalFans > 0) {
            if (fansIn > fansOut) htmlFinal += `<div style="color: #3498db; background: rgba(52, 152, 219, 0.1); padding: 8px; margin-top: 10px; border-left: 4px solid #3498db; font-size: 0.95rem;">💨 <b>Pressão Positiva (${fansIn} In / ${fansOut} Out):</b> Excelente! Expulsa poeira.</div>`;
            else if (fansOut > fansIn) htmlFinal += `<div style="color: #e67e22; background: rgba(230, 126, 34, 0.1); padding: 8px; margin-top: 10px; border-left: 4px solid #e67e22; font-size: 0.95rem;">🌪️ <b>Pressão Negativa (${fansIn} In / ${fansOut} Out):</b> Atenção! Gabinete atuando como aspirador de pó.</div>`;
            else htmlFinal += `<div style="color: #2ecc71; background: rgba(46, 204, 113, 0.1); padding: 8px; margin-top: 10px; border-left: 4px solid #2ecc71; font-size: 0.95rem;">🌬️ <b>Pressão Neutra (${fansIn} In / ${fansOut} Out):</b> Fluxo equilibrado.</div>`;
        }

        if (conteudoLogs) conteudoLogs.innerHTML = htmlFinal;
        
    } else {
        if (conteudoLogs) conteudoLogs.innerHTML = "Aguardando seleção de componentes...";
        if (typeof luzAlerta !== 'undefined') luzAlerta.intensity = 0;
        atualizarBotao('btn-power', false, "btn-desligado", "btn-desligado", "🔌 LIGAR PC");
        atualizarBotao('btn-relatorio', false, "btn-desligado", "btn-desligado");
    }
}
window.verificarCompatibilidade = verificarCompatibilidade;

// ==========================================================================
// 5. MOTOR DE ANIMAÇÃO E SISTEMA DE ENERGIA UNIVERSAL
// ==========================================================================
let sistemaLigado = false;
let tempoRGB = 0; 

function alternarEnergia() {
    let btnUI = document.getElementById('btn-power');
    if (btnUI && btnUI.disabled) return; 
    
    sistemaLigado = !sistemaLigado; 
    
    if (sistemaLigado) {
        if(btnUI) { btnUI.className = "btn-ligado"; btnUI.innerText = "🔴 DESLIGAR PC"; }
        botaoPower3D.material.color.setHex(0x1abc9c); 
        
        cena.background = new THREE.Color(0x444444); 
        
        objetosInterativos.forEach(obj => {
            if (obj !== botaoPower3D) { 
                obj.material.wireframe = false;
                
                // 🎯 A MÁGICA AQUI: Só fica sólido se NÃO for um fantasma!
                if (obj.userData.opacidadeOriginal !== 0) {
                    obj.material.opacity = 0.95;
                }
            }
        });
    } else {
        if(btnUI) { btnUI.className = "btn-pronto"; btnUI.innerText = "⚡ LIGAR PC"; }
        botaoPower3D.material.color.setHex(0xff0000); 
        
        cena.background = new THREE.Color(0x333333); 
        
        objetosInterativos.forEach(obj => {
            if (obj !== botaoPower3D) {
                obj.material.wireframe = true;
                obj.material.opacity = obj.userData.opacidadeOriginal;
                obj.material.color.setHex(obj.userData.corOriginal); 
            }
        });
    }
}

document.getElementById('btn-power').addEventListener('click', alternarEnergia);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});

function animar() {
    requestAnimationFrame(animar);
    controles.update(); 
    
    if (sistemaLigado) {
        tempoRGB += 0.03;
        let r = Math.sin(tempoRGB) * 0.5 + 0.5;
        let g = Math.sin(tempoRGB + 2) * 0.5 + 0.5;
        let b = Math.sin(tempoRGB + 4) * 0.5 + 0.5;
        
        listaFans.forEach(fan => {
            if (fan.visible === true && fan.userData.ligada === true) {
                fan.rotateY(0.4); 
                fan.material.color.setRGB(r, g, b); 
            }
        });
        
        [ram1, ram2, ram3, ram4].forEach(pente => {
            if (!pente.material.wireframe && pente.userData.modelo === 'rgb') { 
                pente.material.color.setRGB(r, g, b); 
            }
        });
        slotGpu.material.color.setRGB(r, g, b);
    } else {
        listaFans.forEach(fan => {
            if (fan.visible === true && fan.userData.ligada === true) {
                fan.rotateY(0.05); 
            }
        });
    }
    renderizador.render(cena, camera);
}

// ==========================================================================
// 6. BOTÃO DE ESCONDER/MOSTRAR MENU (MODO CINEMA)
// ==========================================================================
const btnToggle = document.getElementById('btn-toggle-menu');
const menuPrincipalUI = document.getElementById('menu-inferior');

if (btnToggle && menuPrincipalUI) {
    btnToggle.addEventListener('click', (evento) => {
        evento.stopPropagation(); 
        
        menuPrincipalUI.classList.toggle('esconder-manual');
        btnToggle.classList.toggle('botao-descido');
        
        if (menuPrincipalUI.classList.contains('esconder-manual')) {
            btnToggle.innerHTML = '▲ Mostrar Menu';
        } else {
            btnToggle.innerHTML = '▼ Esconder Menu';
        }
    });
}
animar();
})();

// ==========================================================================
// 8. GERADOR DE RELATÓRIO E PDF
// ==========================================================================

function obterNomePeca(idElemento) {
    let el = document.getElementById(idElemento);
    if (!el || el.value === "") return "Não Instalado";
    return el.options[el.selectedIndex].text;
}

function abrirRelatorio() {
    let btnUI = document.getElementById('btn-relatorio');
    if (btnUI && btnUI.disabled) return; 

    let consumoAtual = document.getElementById('consumo-watts') ? document.getElementById('consumo-watts').innerText.replace('Consumo: ', '') : '0 W';

    let html = `
        <div class="relatorio-secao">
            <h3>🖥️ Componentes Principais</h3>
            <div class="relatorio-item"><strong>Gabinete:</strong> <span>${obterNomePeca('gabinete')}</span></div>
            <div class="relatorio-item"><strong>Placa-Mãe:</strong> <span>${obterNomePeca('placa-mae')}</span></div>
            <div class="relatorio-item"><strong>Processador:</strong> <span>${obterNomePeca('processador')}</span></div>
            <div class="relatorio-item"><strong>Placa de Vídeo:</strong> <span>${obterNomePeca('gpu')}</span></div>
        </div>

        <div class="relatorio-secao">
            <h3>⚡ Memória e Armazenamento</h3>
            <div class="relatorio-item"><strong>Memória RAM:</strong> <span>
                Slot 1: ${obterNomePeca('ram1')}<br>
                Slot 2: ${obterNomePeca('ram2')}<br>
                Slot 3: ${obterNomePeca('ram3')}<br>
                Slot 4: ${obterNomePeca('ram4')}
            </span></div>
            <div class="relatorio-item"><strong>Armazenamento Principal:</strong> <span>${obterNomePeca('armazenamento')}</span></div>
        </div>

        <div class="relatorio-secao">
            <h3>❄️ Energia e Refrigeração</h3>
            <div class="relatorio-item"><strong>Fonte de Alimentação:</strong> <span>${obterNomePeca('fonte')}</span></div>
            <div class="relatorio-item"><strong>Cooler do Processador:</strong> <span>${obterNomePeca('cooler')}</span></div>
            <div class="relatorio-item"><strong>Consumo de Pico Estimado:</strong> <span style="color: #e74c3c; font-weight: bold;">${consumoAtual}</span></div>
        </div>
    `;
    
    document.getElementById('conteudo-relatorio').innerHTML = html;
    document.getElementById('modal-relatorio').style.display = 'block';
}

document.getElementById('fechar-modal').onclick = () => document.getElementById('modal-relatorio').style.display = "none";
window.onclick = (event) => { if (event.target == document.getElementById('modal-relatorio')) document.getElementById('modal-relatorio').style.display = "none"; }
if(document.getElementById('btn-relatorio')) document.getElementById('btn-relatorio').addEventListener('click', abrirRelatorio);

// ==========================================================================
// 🔍 SISTEMA DE PESQUISA INTELIGENTE (COM KITS VIRTUAIS)
// ==========================================================================
const inputPesquisa = document.getElementById('input-pesquisa');
const listaResultados = document.getElementById('lista-resultados');

function removerAcentos(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

if (inputPesquisa && listaResultados) {
    inputPesquisa.addEventListener('input', function() {
        let termoOriginal = this.value.trim();
        let termoPesquisa = removerAcentos(termoOriginal);
        listaResultados.innerHTML = "";
        
        if (termoPesquisa.length < 2) {
            listaResultados.style.display = "none";
            return;
        }

        let todasAsOpcoes = [];
        let menusParaLer = ['gabinete', 'placa-mae', 'processador', 'gpu', 'fonte', 'cooler', 'armazenamento', 'ram1', 'fan-tras']; 
        
        menusParaLer.forEach(idMenu => {
            let select = document.getElementById(idMenu);
            if (select) {
                Array.from(select.options).forEach(opt => {
                    if (opt.value !== "" && opt.value !== "radiador" && !opt.value.includes("xfan")) {
                        
                        let textoNormal = opt.text;
                        let textoLimpo = removerAcentos(textoNormal);
                        
                        if (textoLimpo.includes(termoPesquisa)) {
                            todasAsOpcoes.push({ texto: textoNormal, valor: opt.value, menuBase: idMenu, isKit: false });
                        }

                        if (idMenu === 'ram1') {
                            let textoKit = "📦 Kit 2x: " + textoNormal;
                            let textoKitLimpo = removerAcentos(textoKit);
                            
                            if (textoKitLimpo.includes(termoPesquisa)) {
                                todasAsOpcoes.push({ texto: textoKit, valor: opt.value, menuBase: idMenu, isKit: true });
                            }
                        }
                    }
                });
            }
        });

        let unicas = Array.from(new Set(todasAsOpcoes.map(a => a.texto)))
            .map(texto => todasAsOpcoes.find(a => a.texto === texto));

        if (unicas.length > 0) {
            listaResultados.style.display = "block";
            unicas.forEach(item => {
                let li = document.createElement('li');
                li.innerHTML = item.texto; 
                
                li.onclick = function() {
                    aplicarPecaPesquisada(item.valor, item.menuBase, item.isKit);
                    inputPesquisa.value = ""; 
                    listaResultados.style.display = "none"; 
                };
                listaResultados.appendChild(li);
            });
        } else {
            listaResultados.style.display = "block";
            listaResultados.innerHTML = `<li style="text-align: center; color: #e74c3c;">Nenhuma peça encontrada...</li>`;
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target !== inputPesquisa) listaResultados.style.display = "none";
    });
}

function aplicarPecaPesquisada(valorDaPeca, menuDeOrigem, isKit) {
    if (isKit) {
        let slotsVazios = ['ram1', 'ram2', 'ram3', 'ram4'].filter(id => {
            let el = document.getElementById(id);
            return el && el.value === "";
        });

        if (slotsVazios.length >= 2) {
            document.getElementById(slotsVazios[0]).value = valorDaPeca;
            document.getElementById(slotsVazios[1]).value = valorDaPeca;
        } else {
            document.getElementById('ram2').value = valorDaPeca;
            document.getElementById('ram4').value = valorDaPeca;
        }
    } 
    else {
        let selectAlvo = document.getElementById(menuDeOrigem);

        if (menuDeOrigem.startsWith('ram')) {
            let slotVazio = ['ram1', 'ram2', 'ram3', 'ram4'].find(id => {
                let el = document.getElementById(id);
                return el && el.value === "";
            });
            if (slotVazio) selectAlvo = document.getElementById(slotVazio);
            else selectAlvo = document.getElementById('ram1'); 
        } 
        else if (menuDeOrigem.startsWith('fan-')) {
            let slotFanVazio = ['fan-tras', 'fan-frente1', 'fan-frente2', 'fan-frente3'].find(id => {
                let el = document.getElementById(id);
                return el && el.value === "" && el.parentElement.style.display !== 'none';
            });
            if (slotFanVazio) selectAlvo = document.getElementById(slotFanVazio);
        }

        if (selectAlvo) selectAlvo.value = valorDaPeca;
    }

    verificarCompatibilidade(); 
}
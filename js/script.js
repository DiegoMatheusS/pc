"use strict";
(function() {
    
// ==========================================================================
// 1. CONFIGURAÇÃO BÁSICA DO AMBIENTE
// ==========================================================================
const cena = new THREE.Scene();

// 🎨 NOVO: Define o fundo inicial como Cinza Escuro
cena.background = new THREE.Color(0x333333); 
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
let modeloPlacaReal = null; let modeloProcessadorReal = null; let modeloGpuReal = null; 
// O modelo base da fan vai servir para clonarmos para todos os slots
let modeloFanBase = null;
let carregandoFan = false; // 🚦 NOVO: Semáforo para não deixar o sistema engasgar

// 🧠 O NOVO HUB DE VENTOINHAS (Para controlar os clones .glb sem poluir a cena)
let modelosFansInstalados = {
    'fanTras': null, 'fanFrente1': null, 'fanFrente2': null, 'fanFrente3': null,
    'fanTeto1': null, 'fanTeto2': null, 'fanTeto3': null
};


// ==========================================================================
// 2. MAQUETE FÍSICA: GABINETE SUPERFRAME DRAKOR
// ==========================================================================

const geoGabinete = new THREE.BoxGeometry(2.4, 4.6, 4.5);
const matGabinete = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.1, wireframe: true });
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
const geoRam = new THREE.BoxGeometry(0.15, 0.8, 0.05); 
const matRamPadrão = new THREE.MeshBasicMaterial({ color: 0x9b59b6, wireframe: true });

const ram1 = new THREE.Mesh(geoRam, matRamPadrão.clone());
ram1.position.set(-1.05, 3.4, 0.50);
ram1.userData = { tipo: 'ram', idHtml: 'ram1', nome: 'Slot RAM 1 (Canal A1)' };
cena.add(ram1);

const ram2 = new THREE.Mesh(geoRam, matRamPadrão.clone());
ram2.position.set(-1.05, 3.4, 0.40);
ram2.userData = { tipo: 'ram', idHtml: 'ram2', nome: 'Slot RAM 2 (A2 - Dual Channel)' };
cena.add(ram2);

const ram3 = new THREE.Mesh(geoRam, matRamPadrão.clone());
ram3.position.set(-1.05, 3.4, 0.30);
ram3.userData = { tipo: 'ram', idHtml: 'ram3', nome: 'Slot RAM 3 (Canal B1)' };
cena.add(ram3);

const ram4 = new THREE.Mesh(geoRam, matRamPadrão.clone());
ram4.position.set(-1.05, 3.4, 0.20);
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
slotFonte.position.set(-2.0, 0.6, 1.0); 
slotFonte.userData = { tipo: 'fonte', nome: 'Espaço da Fonte' };
cena.add(slotFonte);

// --- SLOT DE ARMAZENAMENTO (SSD SATA) ---
const geoSsd = new THREE.BoxGeometry(0.15, 1.0, 0.7); 
const matSsd = new THREE.MeshBasicMaterial({ color: 0xffa500, wireframe: true }); 
const slotSsd = new THREE.Mesh(geoSsd, matSsd);
slotSsd.position.set(-1.35, 2.5, 1.0); 
slotSsd.userData = { tipo: 'armazenamento', nome: 'Compartimento Traseiro SSD SATA' };
cena.add(slotSsd);

// --- ____________________ ---

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
// 🎯 CORREÇÃO DE POSIÇÃO: 
// X = -1.15 (Encosta na lateral esquerda) | Y = 3.5 (Altura do CPU) | Z = 0.4 (Empurra para a grelha do fundo)
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
function verificarCompatibilidade() {
	let gabineteValue = document.getElementById('gabinete') ? document.getElementById('gabinete').value : "mid-tower";
    let placaMaeValue = document.getElementById('placa-mae') ? document.getElementById('placa-mae').value : "";
    let processador = document.getElementById('processador') ? document.getElementById('processador').value : "";
    let gpu = document.getElementById('gpu') ? document.getElementById('gpu').value : "";
    let fonte = document.getElementById('fonte') ? document.getElementById('fonte').value : "";
    let armazenamento = document.getElementById('armazenamento') ? document.getElementById('armazenamento').value : "";

    
    let vRam1 = document.getElementById('ram1') ? document.getElementById('ram1').value : "";
    let vRam2 = document.getElementById('ram2') ? document.getElementById('ram2').value : "";
    let vRam3 = document.getElementById('ram3') ? document.getElementById('ram3').value : "";
    let vRam4 = document.getElementById('ram4') ? document.getElementById('ram4').value : "";
    let totalRamNum = (vRam1 !== "" ? 1 : 0) + (vRam2 !== "" ? 1 : 0) + (vRam3 !== "" ? 1 : 0) + (vRam4 !== "" ? 1 : 0);

    let selectCooler = document.getElementById('cooler');
    let cooler = selectCooler ? selectCooler.value : "";
    let selectTeto = document.getElementById('teto');
    let selectTeto1 = document.getElementById('fan-teto1');
    let selectTeto2 = document.getElementById('fan-teto2');
    let selectTeto3 = document.getElementById('fan-teto3');

    // --- CÉREBRO DOS RADIADORES E TETO ---
    if (cooler === 'wc240') {
        if (selectTeto) { selectTeto.innerHTML = '<option value="radiador">[ Ocupado pelo Radiador 240mm ]</option>'; selectTeto.disabled = true; }
        if (selectTeto1) { selectTeto1.value = "risemode_out"; selectTeto1.disabled = true; selectTeto1.parentElement.style.display = 'block'; }
        if (selectTeto2) { selectTeto2.value = "risemode_out"; selectTeto2.disabled = true; selectTeto2.parentElement.style.display = 'block'; }
        if (selectTeto3) { selectTeto3.value = ""; selectTeto3.parentElement.style.display = 'none'; }
        fanTeto1.visible = true; fanTeto2.visible = true; fanTeto3.visible = false;
        radiador240.visible = true; radiador360.visible = false;
    } else if (cooler === 'wc360') {
        if (selectTeto) { selectTeto.innerHTML = '<option value="radiador">[ Ocupado pelo Radiador 360mm ]</option>'; selectTeto.disabled = true; }
        if (selectTeto1) { selectTeto1.value = "risemode_out"; selectTeto1.disabled = true; selectTeto1.parentElement.style.display = 'block'; }
        if (selectTeto2) { selectTeto2.value = "risemode_out"; selectTeto2.disabled = true; selectTeto2.parentElement.style.display = 'block'; }
        if (selectTeto3) { selectTeto3.value = "risemode_out"; selectTeto3.disabled = true; selectTeto3.parentElement.style.display = 'block'; }
        fanTeto1.visible = true; fanTeto2.visible = true; fanTeto3.visible = true;
        radiador240.visible = false; radiador360.visible = true;
    } else {
        if (selectTeto && selectTeto.disabled) {
            selectTeto.innerHTML = `<option value="">-- Vazio --</option><option value="2xfan">Instalar 2x Ventoinhas</option><option value="3xfan">Instalar 3x Ventoinhas</option>`;
            selectTeto.disabled = false;
        }
        let valTeto = selectTeto ? selectTeto.value : "";
        if (valTeto === '2xfan') {
            if (selectTeto1) { selectTeto1.disabled = false; selectTeto1.parentElement.style.display = 'block'; }
            if (selectTeto2) { selectTeto2.disabled = false; selectTeto2.parentElement.style.display = 'block'; }
            if (selectTeto3) { selectTeto3.value = ""; selectTeto3.parentElement.style.display = 'none'; }
            fanTeto1.visible = true; fanTeto2.visible = true; fanTeto3.visible = false;
        } else if (valTeto === '3xfan') {
            if (selectTeto1) { selectTeto1.disabled = false; selectTeto1.parentElement.style.display = 'block'; }
            if (selectTeto2) { selectTeto2.disabled = false; selectTeto2.parentElement.style.display = 'block'; }
            if (selectTeto3) { selectTeto3.disabled = false; selectTeto3.parentElement.style.display = 'block'; }
            fanTeto1.visible = true; fanTeto2.visible = true; fanTeto3.visible = true;
        } else {
            if (selectTeto1) { selectTeto1.value = ""; selectTeto1.parentElement.style.display = 'none'; }
            if (selectTeto2) { selectTeto2.value = ""; selectTeto2.parentElement.style.display = 'none'; }
            if (selectTeto3) { selectTeto3.value = ""; selectTeto3.parentElement.style.display = 'none'; }
            fanTeto1.visible = false; fanTeto2.visible = false; fanTeto3.visible = false;
        }
        radiador240.visible = false; radiador360.visible = false;
    }

    let fTeto1 = selectTeto1 ? selectTeto1.value : "";
    let fTeto2 = selectTeto2 ? selectTeto2.value : "";
    let fTeto3 = selectTeto3 ? selectTeto3.value : "";
    let fTras = document.getElementById('fan-tras') ? document.getElementById('fan-tras').value : "";
    let fFrente1 = document.getElementById('fan-frente1') ? document.getElementById('fan-frente1').value : "";
    let fFrente2 = document.getElementById('fan-frente2') ? document.getElementById('fan-frente2').value : "";
    let fFrente3 = document.getElementById('fan-frente3') ? document.getElementById('fan-frente3').value : "";

    fanTras.visible = true; fanFrente1.visible = true; fanFrente2.visible = true; fanFrente3.visible = true;
    fanTeto1.userData.ligada = (fTeto1 !== ""); fanTeto2.userData.ligada = (fTeto2 !== ""); fanTeto3.userData.ligada = (fTeto3 !== "");
    fanTras.userData.ligada = (fTras !== ""); fanFrente1.userData.ligada = (fFrente1 !== ""); fanFrente2.userData.ligada = (fFrente2 !== ""); fanFrente3.userData.ligada = (fFrente3 !== "");

    let errosDeMontagem = [];
    let alertasDeMontagem = [];

    // 1. PRIMEIRO: Descobrir qual é o tamanho da placa selecionada no menu!
    let socketPlaca = "", tamanhoPlaca = "";
    if (placaMaeValue !== "") {
        let partes = placaMaeValue.split("-");
        socketPlaca = partes[0]; 
        tamanhoPlaca = partes[1]; // O sistema agora sabe se é atx, matx ou eatx
    }

    // =======================================================
    // 📏 MOTOR DE FÍSICA E DIMENSÕES (O GABINETE)
    // =======================================================
    
    // O Processador, RAM e SSD entram sempre, pois são peças pequenas!
    // Mas as peças grandes sofrem bloqueio dependendo do Gabinete:

    if (gabineteValue === "compacto") {
        // Gabinete Pequeno: Sofre muito com peças grandes
        if (tamanhoPlaca === "atx" || tamanhoPlaca === "eatx") {
            errosDeMontagem.push(`Erro de Chassi: Uma placa-mãe ${tamanhoPlaca.toUpperCase()} é muito alta e larga. Ela não entra num gabinete Compacto.`);
        }
        if (gpu === "rtx5070ti" || gpu === "rx9070xt") {
            errosDeMontagem.push("Colisão Física: Esta Placa de Vídeo é massiva! Ela vai bater na fonte ou impedir a tampa de vidro de fechar num chassi Compacto.");
        }
        if (cooler === "wc360") {
            errosDeMontagem.push("Erro de Teto: Um radiador de 360mm é comprido demais para o teto de um gabinete Compacto (limite máximo é 240mm).");
        }
        
    } else if (gabineteValue === "mid-tower") {
        // Gabinete Pichau HX710L (Limite: mATX / Mini-ITX)
        if (tamanhoPlaca === "atx" || tamanhoPlaca === "eatx") {
            errosDeMontagem.push("Falta de Espaço: O Pichau HX710L suporta no máximo placas Micro-ATX (mATX). Uma placa ATX ou E-ATX não vai caber neste aquário.");
        }
        if (gpu === "rx9070xt") {
            errosDeMontagem.push("Erro de Comprimento: A RX 9070 XT colide fisicamente com as ventoinhas frontais neste chassi.");
        }
        
    } else if (gabineteValue === "full-tower") {
        // Gabinete Gigante: Cabe absolutamente tudo!
        if (tamanhoPlaca === "matx") {
            alertasDeMontagem.push("Estética: Você colocou uma placa-mãe minúscula (Micro-ATX) num gabinete gigante (Full-Tower). Vai sobrar muito espaço vazio, mas funciona perfeitamente.");
        }
    }

   // --- CARREGAMENTOS 3D DOS SEUS ARQUIVOS (.GLB) ---
    
    // 1. A Placa-Mãe (placa.glb)
    if (placaMaeValue !== "" && modeloPlacaReal === null) {
        telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1'; 
        carregador.load('modelos/placa.glb', function(gltf) {
            modeloPlacaReal = gltf.scene; 
            
            // ESCALA DA PLACA-MÃE
            let s = 0.8; 
            modeloPlacaReal.scale.set(s, s, s);
            
            // ROTAÇÃO
            modeloPlacaReal.rotation.set(0, Math.PI / 2, 0); 
            
            // POSIÇÃO 
            let placaX = -1.05; 
            let placaY = 3.4;   
            let placaZ = 0.5;   
            modeloPlacaReal.position.set(placaX, placaY, placaZ); 
            
            cena.add(modeloPlacaReal); 
            slotPlacaMae.material.opacity = 0; 
        });
    }

    // 2. O Processador (processador.glb)
    if (processador !== "" && modeloProcessadorReal === null) {
        telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1';
        carregador.load('modelos/processador.glb', function(gltf) {
            modeloProcessadorReal = gltf.scene; 
            
            // ESCALA (Acabando com o "tapete")
            let sProc = 0.80; 
            modeloProcessadorReal.scale.set(sProc, sProc, sProc); 
            
            // ROTAÇÃO (O duplo giro que o deitou na posição certa)
            modeloProcessadorReal.rotation.set(1.55, 1.5, 0); 
            modeloProcessadorReal.rotateX(Math.PI / 2); 
            modeloProcessadorReal.rotateY(Math.PI / 2); 
            
            // POSIÇÃO 
            let posX = -0.90; 
            let posY = 3.5;   
            let posZ = 1.0;   
            modeloProcessadorReal.position.set(posX, posY, posZ); 
            
            cena.add(modeloProcessadorReal); 
            slotProcessador.material.opacity = 0; 
        });
    }

    // 3. A Placa de Vídeo (placavideo.glb)
    if (gpu !== "" && modeloGpuReal === null) {
        telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1';
        carregador.load('modelos/placavideo.glb', function(gltf) {
            modeloGpuReal = gltf.scene; 
            
            // ESCALA (O raio encolhedor)
            let sGpu = 0.30; 
            modeloGpuReal.scale.set(sGpu, sGpu, sGpu);

            // ROTAÇÃO (Barriga para baixo)
            modeloGpuReal.rotation.set(0, 0, 0); 
            modeloGpuReal.rotateX(Math.PI / 2); 
            modeloGpuReal.rotateZ(Math.PI / 2);

            // POSIÇÃO 
            let gpuX = 0;  
            let gpuY = 2.2;   
            let gpuZ = 0.80;   
            modeloGpuReal.position.set(gpuX, gpuY, gpuZ); 
            
            cena.add(modeloGpuReal); 
            slotGpu.material.opacity = 0; 
        });
    }

   // --- 🎯 O NOVO CÉREBRO DAS VENTOINHAS (.GLB) ---
    let fansIn = 0, fansOut = 0, totalFans = 0;
    [fTras, fFrente1, fFrente2, fFrente3, fTeto1, fTeto2, fTeto3].forEach(f => { 
        if (f.includes('in')) fansIn++; 
        if (f.includes('out')) fansOut++; 
        if (f !== "") totalFans++; 
    });

    let precisaDeFan = totalFans > 0;

    // A função mestre que clona a fan original e distribui pelos arames azuis
    function distribuirFans3D() {
        if (!modeloFanBase) return;

        function aplicarFan(chave, arame, valorMenu, localMontagem) {
            if (modelosFansInstalados[chave]) {
                cena.remove(modelosFansInstalados[chave]);
                modelosFansInstalados[chave] = null;
            }

            if (valorMenu === "") {
                arame.visible = true; 
                arame.material.wireframe = false; // Tira os riscos azuis
                arame.material.opacity = 0;       // Fica 100% transparente (invisível)
                arame.userData.opacidadeOriginal = 0;
                return;
            }
			else {
                arame.visible = true; 
                arame.material.wireframe = false; // Sem riscos
                arame.material.opacity = 0.9;     
                arame.material.color.setHex(0x222222); // Cor cinza/preta simulando ventoinha genérica
                modelosFansInstalados[chave] = arame;  
            }

            let novaFan = modeloFanBase.clone();
            novaFan.position.copy(arame.position);
            
            // 🚀 O RAIO DE CRESCIMENTO (Com o centro já corrigido)
            let tamanhoFan = 4; 
            novaFan.scale.set(tamanhoFan, tamanhoFan, tamanhoFan); 
            novaFan.rotation.set(0, 0, 0); 

            // Lógica de Rotação (Parede vs Teto)
            if (localMontagem === 'teto') {
                novaFan.rotateX(Math.PI / 2); 
            }

            // Lógica de Fluxo de Ar
            if (valorMenu.includes("out")) {
                novaFan.rotateY(Math.PI); 
            } else if (valorMenu.includes("in")) {
                novaFan.rotateY(0); 
            }

            cena.add(novaFan);
            modelosFansInstalados[chave] = novaFan;

            arame.material.opacity = 0;
            arame.userData.opacidadeOriginal = 0; 
            arame.material.wireframe = false;
        }

        aplicarFan('fanTras', fanTras, fTras, 'parede');
        aplicarFan('fanFrente1', fanFrente1, fFrente1, 'parede');
        aplicarFan('fanFrente2', fanFrente2, fFrente2, 'parede');
        aplicarFan('fanFrente3', fanFrente3, fFrente3, 'parede');
        aplicarFan('fanTeto1', fanTeto1, fTeto1, 'teto');
        aplicarFan('fanTeto2', fanTeto2, fTeto2, 'teto');
        aplicarFan('fanTeto3', fanTeto3, fTeto3, 'teto');
    }

   // =======================================================
    // 🛡️ CARREGAMENTO SEGURO DA FAN BASE
    // =======================================================
    if (precisaDeFan && modeloFanBase === null && !carregandoFan) {
        carregandoFan = true; // 🟢 CORRIGIDO: Agora é "true" em vez de "f"!
        telaCarregamento.style.display = 'flex'; telaCarregamento.style.opacity = '1';
        
        carregador.load('modelos/fan.glb', function(gltf) {
            let modeloOriginal = gltf.scene;
            
            // Centralização perfeita
            let caixaContorno = new THREE.Box3().setFromObject(modeloOriginal);
            let centroReal = new THREE.Vector3();
            caixaContorno.getCenter(centroReal);
            modeloOriginal.position.set(-centroReal.x, -centroReal.y, -centroReal.z); 
            
            let envelope = new THREE.Group();
            envelope.add(modeloOriginal);
            
            modeloFanBase = envelope; 
            carregandoFan = false; // Abre o semáforo
            
            console.log("✅ Ventoinha 3D carregada com sucesso!");
            distribuirFans3D(); 
            
        }, undefined, function(erro) {
            console.error("❌ ERRO: O ficheiro fan.glb não foi encontrado na pasta 'modelos/'", erro);
            carregandoFan = false; // Abre o semáforo mesmo se der erro
        });
        
    } else if (modeloFanBase !== null) {
        distribuirFans3D();
    }
    // --------------------------------------------------

    let ddrSuportadoPelaPlaca = "ddr5";
    let mhzMaximoDaPlaca = 5600;
    let mhzMaximoNativoDoCpu = 5200;

    if (socketPlaca === "am4" || socketPlaca === "lga1200") {
        ddrSuportadoPelaPlaca = "ddr4";
        mhzMaximoDaPlaca = 3600;
        mhzMaximoNativoDoCpu = 3200;
    } else if (socketPlaca === "am5" || socketPlaca === "lga1700") {
        ddrSuportadoPelaPlaca = "ddr5";
        mhzMaximoDaPlaca = 6400;
        mhzMaximoNativoDoCpu = 5200;
    }

    let ddrDetectado = "";
    let mhzDetectado = 0;
    let misturouGeracao = false;
    let misturouFrequencia = false;
    let erroDdrIncompativel = false;
    let erroMhzExcedidoPlaca = false;
    let alertaMhzOverclockCpu = false;

    function processarSlotRam(pente, valor) {
        if (valor === "") {
            pente.material.wireframe = true; pente.material.color.setHex(0x9b59b6);
            pente.userData.modelo = "";
            return;
        }
        pente.material.wireframe = false;
        
        let info = valor.split("-"); 
        let geracao = info[0];
        let mhz = parseInt(info[2]);

        if (ddrDetectado !== "" && ddrDetectado !== geracao) misturouGeracao = true;
        if (mhzDetectado !== 0 && mhzDetectado !== mhz) misturouFrequencia = true;
        ddrDetectado = geracao;
        mhzDetectado = mhz;

        if (geracao === "ddr4") {
            pente.material.color.setHex(0x2c3e50); 
            pente.userData.modelo = "ddr4";
        } else {
            if (mhz >= 6000) {
                pente.material.color.setHex(0x9b59b6); 
                pente.userData.modelo = "rgb";
            } else {
                pente.material.color.setHex(0xecf0f1); 
                pente.userData.modelo = "ddr5";
            }
        }

        if (placaMaeValue !== "" && geracao !== ddrSuportadoPelaPlaca) erroDdrIncompativel = true;
        if (placaMaeValue !== "" && mhz > mhzMaximoDaPlaca) erroMhzExcedidoPlaca = true;
        if (processador !== "" && mhz > mhzMaximoNativoDoCpu && mhz <= mhzMaximoDaPlaca) alertaMhzOverclockCpu = true;
    }

    processarSlotRam(ram1, vRam1); processarSlotRam(ram2, vRam2); processarSlotRam(ram3, vRam3); processarSlotRam(ram4, vRam4);

    slotSsd.material.wireframe = (armazenamento !== "ssd-sata");
    if(slotM2) slotM2.material.wireframe = (armazenamento !== "ssd-m2");
    if (slotPlacaMae) slotPlacaMae.material.wireframe = (placaMaeValue === "");
    if (slotProcessador) slotProcessador.material.wireframe = (processador === "");
    if (slotGpu) slotGpu.material.wireframe = (gpu === "");
    if (slotFonte) slotFonte.material.wireframe = (fonte === "");
    if (slotCooler) slotCooler.material.wireframe = (cooler === "");
    
    let usaWC240 = (cooler === "wc240");
    let usaWC360 = (cooler === "wc360");

    if (radiador240) {
        radiador240.material.wireframe = !usaWC240; 
        if (usaWC240) radiador240.material.color.setHex(0xbdc3c7); 
    }
    
    if (radiador360) {
        radiador360.material.wireframe = !usaWC360;
        if (usaWC360) radiador360.material.color.setHex(0xbdc3c7); 
    }

    if (misturouGeracao || misturouFrequencia) {
        errosDeMontagem.push("Incompatibilidade Crítica de RAM: Não misture frequências (MHz) ou gerações (DDR4/DDR5) diferentes. Isso causa queima de circuitos ou instabilidade fatal.");
    }
    if (erroDdrIncompativel) {
        errosDeMontagem.push(`Incompatibilidade de Encaixe: A placa-mãe atual exige memórias do tipo ${ddrSuportadoPelaPlaca.toUpperCase()}, mas você instalou pentes ${ddrDetectado.toUpperCase()}. O encaixe físico é impossível.`);
    }
    if (erroMhzExcedidoPlaca) {
        errosDeMontagem.push(`Bloqueio de Barramento: A frequência de ${mhzDetectado}MHz excede o limite elétrico suportado pelas trilhas desta placa-mãe (Máx: ${mhzMaximoDaPlaca}MHz).`);
    }
    if (alertaMhzOverclockCpu) {
        alertasDeMontagem.push(`Aviso de Overclock (XMP/EXPO): A velocidade de ${mhzDetectado}MHz está acima do suporte padrão do processador (${mhzMaximoDaPlaca === 3600 ? '3200MHz' : '5200MHz'}). O computador vai ligar, mas operará em overclock estável através do perfil XMP/EXPO na BIOS.`);
    }

    if (totalRamNum > 0 && !misturouGeracao && !misturouFrequencia) {
        if (totalRamNum === 1) alertasDeMontagem.push("Gargalo de Banda: Apenas 1 canal ativo (Single Channel). Seu processador perderá até 30% de desempenho em jogos.");
        if (totalRamNum === 2 && (vRam2 === "" || vRam4 === "")) alertasDeMontagem.push("Otimização Pendente: Para habilitar o Dual Channel verdadeiro com 2 pentes, mude-os para os slots alternados 2 e 4.");
    }

    if (socketPlaca !== "" && processador !== "" && socketPlaca !== processador) errosDeMontagem.push("Soquetes incompatíveis. O CPU não encaixa.");
    if (tamanhoPlaca === "eatx") errosDeMontagem.push("Falta de Espaço Crítica: Placas E-ATX não cabem fisicamente neste chassi.");
    
// =======================================================
    // ⚡ CALCULADORA DE CONSUMO DE ENERGIA SIMPLIFICADA
    // =======================================================
    let consumoTotal = 0;
    
    if (placaMaeValue !== "") consumoTotal += 40; 
    
    if (processador === "am4") consumoTotal += 80; 
    else if (processador === "am5") consumoTotal += 120; 
    else if (processador === "lga1700") consumoTotal += 150; 

    if (gpu === "rx9060xt") consumoTotal += 180;
    else if (gpu === "rtx5070ti") consumoTotal += 285;
    else if (gpu === "rx9070xt") consumoTotal += 320;

    consumoTotal += (totalRamNum * 5); 
    if (armazenamento !== "") consumoTotal += 5; 
    consumoTotal += (totalFans * 3); 
    
    if (cooler === "aircooler") consumoTotal += 3;
    else if (cooler === "wc240") consumoTotal += 15; 
    else if (cooler === "wc360") consumoTotal += 20; 

    let limiteFonte = 0;
    if (fonte === "550w") limiteFonte = 550;
    else if (fonte === "850w") limiteFonte = 850;

    // Atualiza o texto simples no final do painel
    let elConsumo = document.getElementById('consumo-watts');
    if (elConsumo) {
        if (consumoTotal > 0) {
            elConsumo.innerText = `Consumo: ${consumoTotal} W`;
            elConsumo.style.display = "block"; // Mostra o texto quando há consumo
        } else {
            elConsumo.style.display = "none"; // Esconde se o PC estiver vazio
        }
    }

    // Regras de Segurança Invisíveis (Só apitam se der erro)
    if (consumoTotal > 0) {
        if (fonte === "") {
            errosDeMontagem.push(`Falta Energia: O sistema consome cerca de ${consumoTotal}W, mas não há fonte instalada.`);
        } else {
            let margemSeguranca = consumoTotal * 1.20; 
            if (limiteFonte < consumoTotal) {
                errosDeMontagem.push(`Desarme Imediato: O PC consome até ~${consumoTotal}W sob carga, mas a fonte fornece apenas ${limiteFonte}W.`);
            } else if (limiteFonte < margemSeguranca) {
                alertasDeMontagem.push(`Aviso de Sobrecarga: O PC exige ~${consumoTotal}W e a fonte tem ${limiteFonte}W. Recomendamos um modelo mais forte.`);
            }
        }
    }
    if (processador !== "" && cooler === "") errosDeMontagem.push("Risco de Superaquecimento: Falta refrigeração no CPU.");

    if (gpu === "rx9060xt") slotGpu.scale.set(1, 1, 1);
    else if (gpu === "rtx5070ti") slotGpu.scale.set(1, 1, 1.35);
    else if (gpu === "rx9070xt") slotGpu.scale.set(1, 1, 1.7);
    else slotGpu.scale.set(1, 1, 1);

    if (gpu === "rx9070xt") errosDeMontagem.push("Erro de Gabinete Pequeno: A RX 9070 XT colide fisicamente com a ventoinha frontal pré-instalada.");
    else if (gpu === "rtx5070ti") alertasDeMontagem.push("Aviso de Espaço (Clearance): A RTX 5070 Ti ficará a poucos milímetros da ventoinha frontal.");

    if (totalFans > 0) {
        // Agora as opções chamam-se risemode_in e risemode_out, então verificamos .includes()
        if (fTras.includes('in')) errosDeMontagem.push("Erro: A ventoinha traseira deve ser Exaustor.");
        if (fFrente1.includes('out') || fFrente2.includes('out') || fFrente3.includes('out')) errosDeMontagem.push("Erro: Ventoinhas frontais devem ser Injeção.");
    }

    let faltaHardwareEssencial = (placaMaeValue === "" || processador === "" || totalRamNum === 0 || fonte === "" || armazenamento === "");
    if (faltaHardwareEssencial && (placaMaeValue !== "" || processador !== "" || totalRamNum > 0 || gpu !== "" || fonte !== "" || cooler !== "" || armazenamento !== "" || totalFans > 0)) {
        let listaFaltantes = [];
        if (placaMaeValue === "") listaFaltantes.push("Placa-Mãe");
        if (processador === "") listaFaltantes.push("Processador");
        if (totalRamNum === 0) listaFaltantes.push("Memória RAM");
        if (fonte === "") listaFaltantes.push("Fonte");
        if (armazenamento === "") listaFaltantes.push("Armazenamento");
        alertasDeMontagem.push(`O PC não irá ligar. Faltam itens essenciais: ${listaFaltantes.join(", ")}.`);
    }

let conteudoLogs = document.getElementById('conteudo-logs');
    let btnPower = document.getElementById('btn-power');

    if (placaMaeValue !== "" || processador !== "" || totalRamNum > 0 || gpu !== "" || fonte !== "" || cooler !== "" || armazenamento !== "" || totalFans > 0) {
        let htmlFinal = "";
        
        // 1. BLOCO DE ERROS ❌
        if (errosDeMontagem.length > 0) {
            luzAlerta.intensity = 5; luzAlerta.color.setHex(0xc0392b); 
            errosDeMontagem.forEach(err => htmlFinal += `<div class="log-erro">❌ ${err}</div>`);
        }

        // 2. BLOCO DE ALERTAS ⚠️
        if (alertasDeMontagem.length > 0) {
            if (errosDeMontagem.length === 0) { luzAlerta.intensity = 3; luzAlerta.color.setHex(0xf1c40f); }
            alertasDeMontagem.forEach(al => htmlFinal += `<div class="log-alerta">⚠️ ${al}</div>`);
        }
        
        // 3. SUCESSO E BOTÃO POWER ✅
        if (errosDeMontagem.length === 0 && !faltaHardwareEssencial) {
            luzAlerta.intensity = 5; luzAlerta.color.setHex(0x27ae60); 
            htmlFinal = `<div class="log-sucesso">✅ SISTEMA PRONTO PARA RECEBER CARGA!</div>` + htmlFinal;
            if (btnPower && !sistemaLigado) { btnPower.disabled = false; btnPower.className = "btn-pronto"; btnPower.innerText = "⚡ LIGAR PC"; }
        } else {
            if (btnPower && !sistemaLigado) { btnPower.disabled = true; btnPower.className = "btn-desligado"; btnPower.innerText = "🔌 LIGAR PC"; }
        }
        
        // 🌬️ 4. NOVO: DIAGNÓSTICO DE FLUXO DE AR
        if (totalFans > 0) {
            let infoFluxoAr = "";
            if (fansIn > fansOut) {
                // Pressão Positiva (Azul - Ideal)
                infoFluxoAr = `<div style="color: #3498db; background: rgba(52, 152, 219, 0.1); padding: 8px; margin-top: 10px; border-left: 4px solid #3498db; font-size: 0.95rem;">💨 <b>Pressão Positiva (${fansIn} In / ${fansOut} Out):</b> Excelente! Como entra mais ar do que sai, o PC vai expulsar o excesso pelas frestas, evitando a acumulação de poeira.</div>`;
            } else if (fansOut > fansIn) {
                // Pressão Negativa (Laranja - Alerta de Poeira)
                infoFluxoAr = `<div style="color: #e67e22; background: rgba(230, 126, 34, 0.1); padding: 8px; margin-top: 10px; border-left: 4px solid #e67e22; font-size: 0.95rem;">🌪️ <b>Pressão Negativa (${fansIn} In / ${fansOut} Out):</b> Atenção! Como sai mais ar do que entra, o gabinete atua como um "aspirador", puxando poeira por todas as frestas não filtradas.</div>`;
            } else {
                // Pressão Neutra (Verde)
                infoFluxoAr = `<div style="color: #2ecc71; background: rgba(46, 204, 113, 0.1); padding: 8px; margin-top: 10px; border-left: 4px solid #2ecc71; font-size: 0.95rem;">🌬️ <b>Pressão Neutra (${fansIn} In / ${fansOut} Out):</b> Fluxo de ar perfeitamente equilibrado. Garante boa refrigeração, mas exige limpeza regular dos filtros.</div>`;
            }
            htmlFinal += infoFluxoAr; // Cola o diagnóstico de ar no fundo dos logs
        }

        conteudoLogs.innerHTML = htmlFinal;
        
    } else {
        conteudoLogs.innerHTML = "Aguardando seleção de componentes...";
        luzAlerta.intensity = 0;
        if (btnPower) { btnPower.disabled = true; btnPower.className = "btn-desligado"; }
    }
}
verificarCompatibilidade();
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
        
        // 🎨 MUDE AQUI: Cinza um pouco mais claro (simulando a luz do PC a bater no fundo)
        cena.background = new THREE.Color(0x444444); 
        
        objetosInterativos.forEach(obj => {
            if (obj !== botaoPower3D) { 
                obj.material.wireframe = false;
                obj.material.opacity = 0.95;
            }
        });
    } else {
        if(btnUI) { btnUI.className = "btn-pronto"; btnUI.innerText = "⚡ LIGAR PC"; }
        botaoPower3D.material.color.setHex(0xff0000); 
        
        // 🎨 MUDE AQUI: Volta para o Cinza Escuro inicial quando desliga
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
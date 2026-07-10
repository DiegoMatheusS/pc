"use strict";
(function() {
	
// ==========================================================================
// 1. CONFIGURAÇÃO BÁSICA DO AMBIENTE
// ==========================================================================
const cena = new THREE.Scene();
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

// --- CARREGADOR DE MODELOS 3D (.GLB) ---
const carregador = new THREE.GLTFLoader();
let modeloPlacaReal = null;
let modeloProcessadorReal = null;
let modeloGpuReal = null;
let modeloRamReal = null;


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
// AQUI ESTAVA O ERRO: Faltava o idHtml: 'ram1' para ligar ao menu certo!
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
// Aproveitei e garanti que o M.2 também tem o seu ID correto
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
// Redesenhado para ficar fino (0.15 no eixo X) e deitado de lado
const geoSsd = new THREE.BoxGeometry(0.15, 1.0, 0.7); 
const matSsd = new THREE.MeshBasicMaterial({ color: 0xffa500, wireframe: true }); 
const slotSsd = new THREE.Mesh(geoSsd, matSsd);

// X = -1.35 empurra o SSD para TRÁS da bandeja da Placa-Mãe!
// Y = 2.5 (Meia altura do gabinete) e Z = 1.0 (Alinhado com a parte de trás)
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


// --- VENTOINHAS INDIVIDUAIS ---
const geoFan = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16);
const criarMatFan = () => new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.8 });
const listaFans = []; 

// 1. Fan Traseiro
const fanTras = new THREE.Mesh(geoFan, criarMatFan());
fanTras.rotation.x = Math.PI / 2;
fanTras.position.set(-0.6, 3.6, 2.15); 
fanTras.userData = { tipo: 'fan-tras', nome: 'Ventoinha Traseira' };
cena.add(fanTras);
listaFans.push(fanTras);

// 2. Fans Frontais (Posições ajustadas para não bater no PSU Cover)
const fanFrente1 = new THREE.Mesh(geoFan, criarMatFan());
fanFrente1.rotation.x = Math.PI / 2;
fanFrente1.position.set(0, 3.9, -2.15); // Subiu de 3.8 para 3.9
fanFrente1.userData = { tipo: 'fan-frente1', nome: 'Ventoinha Frontal (Topo)' };
cena.add(fanFrente1);
listaFans.push(fanFrente1);

const fanFrente2 = new THREE.Mesh(geoFan, criarMatFan());
fanFrente2.rotation.x = Math.PI / 2;
fanFrente2.position.set(0, 2.8, -2.15); // Subiu de 2.7 para 2.8
fanFrente2.userData = { tipo: 'fan-frente2', nome: 'Ventoinha Frontal (Meio)' };
cena.add(fanFrente2);
listaFans.push(fanFrente2);

const fanFrente3 = new THREE.Mesh(geoFan, criarMatFan());
fanFrente3.rotation.x = Math.PI / 2;
fanFrente3.position.set(0, 1.7, -2.15); // Subiu de 1.6 para 1.7 (Livre da colisão!)
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
const matBotao = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Vermelho vivo
const botaoPower3D = new THREE.Mesh(geoBotao, matBotao);
botaoPower3D.position.set(0.8, 4.6, -2.1); // No teto, à direita, bem na frente
botaoPower3D.userData = { tipo: 'botao-power', nome: 'Botão Power do Gabinete' };
cena.add(botaoPower3D);

// Atualizamos a lista de peças no radar para incluir os radiadores e o NOVO BOTÃO!

const objetosInterativos = [slotPlacaMae, slotProcessador, ram1, ram2, ram3, ram4, slotGpu, slotFonte, slotCooler, slotTeto, slotSsd, slotM2, fanTras, fanFrente1, fanFrente2, fanFrente3, fanTeto1, fanTeto2, fanTeto3, radiador240, radiador360, botaoPower3D];

objetosInterativos.forEach(obj => {
    obj.userData.corOriginal = obj.material.color.getHex();
    obj.userData.opacidadeOriginal = obj.material.opacity;
});

// ==========================================================================
// 3. SENSOR DO MOUSE (MODO FOCO ATUALIZADO)
// ==========================================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (evento) => {
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
        // --- MODO FOCO ATIVADO ---
        if (menuPrincipal) menuPrincipal.classList.add('esconder-menu'); 
        
        const objetoAtingido = intersecoes[0].object;
        const alvoId = objetoAtingido.userData.idHtml || objetoAtingido.userData.tipo;
		const tipo = objetoAtingido.userData.tipo;

        // ⚡ NOVO: INTERCEPTA O CLIQUE NO BOTÃO POWER 3D
        if (tipo === 'botao-power') {
            let btnUI = document.getElementById('btn-power');
            if (btnUI && !btnUI.disabled) {
                alternarEnergia(); // LIGA/DESLIGA O PC!
            } else {
                // EFEITO DE ERRO: O botão pisca escuro e o painel dá um "pulo"
                botaoPower3D.material.color.setHex(0x550000);
                setTimeout(() => botaoPower3D.material.color.setHex(0xff0000), 200);
                
                const logsPanel = document.getElementById('painel-logs');
                if(logsPanel) {
                    logsPanel.style.transition = "transform 0.1s";
                    logsPanel.style.transform = "scale(1.05)";
                    setTimeout(() => logsPanel.style.transform = "scale(1)", 150);
                }
            }
            return; // Interrompe o código aqui para não abrir o modo foco nem menus!
        }
        // 🎇 EFEITO DE LUZ: Apaga todo o PC
        objetosInterativos.forEach(obj => {
            obj.material.color.setHex(0x1a1a1a);
            obj.material.opacity = 0.1;
        });
        // Acende apenas a peça clicada
        objetoAtingido.material.color.setHex(0x00ffff);
        objetoAtingido.material.opacity = 0.8;
        
        const elementoMenu = document.getElementById(`grupo-${alvoId}`);
        if (elementoMenu) {
            elementoMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
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
        // --- MODO VISÃO GERAL ---
        if (menuPrincipal) menuPrincipal.classList.remove('esconder-menu'); 
        if (menuFlutuante) menuFlutuante.style.display = 'none'; 
        
        // 🎇 RESTAURA AS LUZES
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
}); // <-- AQUI FECHA O EVENTO DO MENU FLUTUANTE!

// ==========================================================================
// --- TOOLTIP (HOVER) DO MOUSE (Agora independente!) ---
// ==========================================================================
const tooltip3D = document.getElementById('tooltip-3d');

window.addEventListener('mousemove', (evento) => {
    // 1. Converte a posição do rato para o formato do Motor 3D
    mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(evento.clientY / window.innerHeight) * 2 + 1;

    // 2. Trava o laser a partir da câmera
    raycaster.setFromCamera(mouse, camera);

    // 3. Se o menu de opções estiver aberto, esconde o tooltip para não poluir o ecrã
    if (typeof menuFlutuante !== 'undefined' && menuFlutuante && menuFlutuante.style.display === 'block') {
        if (tooltip3D) tooltip3D.style.display = 'none';
        return;
    }

    // 4. Verifica em que peça o laser está a bater
    const intersecoes = raycaster.intersectObjects(objetosInterativos);

    if (intersecoes.length > 0) {
        const objetoAtingido = intersecoes[0].object;
        
        // Se a peça tiver um nome configurado, exibe a caixa!
        if (objetoAtingido.userData.nome && tooltip3D) {
            tooltip3D.innerText = objetoAtingido.userData.nome;
            tooltip3D.style.display = 'block';
            
            // Posiciona o tooltip 15px ao lado e abaixo do rato para não o tapar
            tooltip3D.style.left = (evento.clientX + 15) + 'px';
            tooltip3D.style.top = (evento.clientY + 15) + 'px';
            
            document.body.style.cursor = 'pointer'; // Muda a setinha para a "Mão" de clicar
        }
    } else {
        // Se bateu no vazio, esconde o tooltip
        if (tooltip3D) tooltip3D.style.display = 'none';
        document.body.style.cursor = 'default'; // Volta à setinha normal
    }
	
	
	
});




// ==========================================================================
// 4. LÓGICA, COMPATIBILIDADE E ANÁLISE DE FREQUÊNCIA (MHz)
// ==========================================================================
function verificarCompatibilidade() {
    let placaMaeValue = document.getElementById('placa-mae') ? document.getElementById('placa-mae').value : "";
    let processador = document.getElementById('processador') ? document.getElementById('processador').value : "";
    let gpu = document.getElementById('gpu') ? document.getElementById('gpu').value : "";
    let fonte = document.getElementById('fonte') ? document.getElementById('fonte').value : "";
    let armazenamento = document.getElementById('armazenamento') ? document.getElementById('armazenamento').value : "";
    
    // Captura dos Slots Individuais de RAM
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
        if (selectTeto1) { selectTeto1.value = "out"; selectTeto1.disabled = true; selectTeto1.parentElement.style.display = 'block'; }
        if (selectTeto2) { selectTeto2.value = "out"; selectTeto2.disabled = true; selectTeto2.parentElement.style.display = 'block'; }
        if (selectTeto3) { selectTeto3.value = ""; selectTeto3.parentElement.style.display = 'none'; }
        fanTeto1.visible = true; fanTeto2.visible = true; fanTeto3.visible = false;
        radiador240.visible = true; radiador360.visible = false;
    } else if (cooler === 'wc360') {
        if (selectTeto) { selectTeto.innerHTML = '<option value="radiador">[ Ocupado pelo Radiador 360mm ]</option>'; selectTeto.disabled = true; }
        if (selectTeto1) { selectTeto1.value = "out"; selectTeto1.disabled = true; selectTeto1.parentElement.style.display = 'block'; }
        if (selectTeto2) { selectTeto2.value = "out"; selectTeto2.disabled = true; selectTeto2.parentElement.style.display = 'block'; }
        if (selectTeto3) { selectTeto3.value = "out"; selectTeto3.disabled = true; selectTeto3.parentElement.style.display = 'block'; }
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

    // Descobrir as propriedades do soquete da Placa-Mãe
    let socketPlaca = "", tamanhoPlaca = "";
    if (placaMaeValue !== "") {
        let partes = placaMaeValue.split("-");
        socketPlaca = partes[0]; // ex: "am4", "lga1700"
        tamanhoPlaca = partes[1];
    }

    // --- CARREGAMENTOS 3D (.GLB) ---
    if (placaMaeValue !== "" && modeloPlacaReal === null) {
        carregador.load('modelos/placa.glb', function(gltf) {
            modeloPlacaReal = gltf.scene; modeloPlacaReal.position.copy(slotPlacaMae.position); 
            modeloPlacaReal.rotation.set(0, Math.PI / 2, 0); cena.add(modeloPlacaReal); slotPlacaMae.material.opacity = 0; 
        });
    }
    if (processador !== "" && modeloProcessadorReal === null) {
        carregador.load('modelos/processador.glb', function(gltf) {
            modeloProcessadorReal = gltf.scene; modeloProcessadorReal.position.set(-1.10, 3.4, 1.0); 
            modeloProcessadorReal.rotation.set(0, Math.PI / 2, 0); modeloProcessadorReal.scale.set(0.4, 0.4, 0.4); 
            cena.add(modeloProcessadorReal); slotProcessador.material.opacity = 0; 
        });
    }

    // --- INTERPRETADOR TÉCNICO DAS MEMÓRIAS RAM ---
    // Mapeamento de limites de hardware reais com base no Ecossistema/Soquete escolhido
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

    // Função interna para pintar as memórias e extrair as especificações
    function processarSlotRam(pente, valor) {
        if (valor === "") {
            pente.material.wireframe = true; pente.material.color.setHex(0x9b59b6);
            pente.userData.modelo = "";
            return;
        }
        pente.material.wireframe = false;
        
        let info = valor.split("-"); // ex: ["ddr4", "8gb", "3200"]
        let geracao = info[0];
        let mhz = parseInt(info[2]);

        // Verifica se o usuário está misturando pentes diferentes nos slots
        if (ddrDetectado !== "" && ddrDetectado !== geracao) misturouGeracao = true;
        if (mhzDetectado !== 0 && mhzDetectado !== mhz) misturouFrequencia = true;
        ddrDetectado = geracao;
        mhzDetectado = mhz;

        // Pintura estética baseada no modelo técnico
        if (geracao === "ddr4") {
            pente.material.color.setHex(0x2c3e50); // Cinza Escuro Metálico
            pente.userData.modelo = "ddr4";
        } else {
            if (mhz >= 6000) {
                pente.material.color.setHex(0x9b59b6); // Base para o efeito RGB dinâmico
                pente.userData.modelo = "rgb";
            } else {
                pente.material.color.setHex(0xecf0f1); // Branco Neve para DDR5 padrão
                pente.userData.modelo = "ddr5";
            }
        }

        // Valida contra as especificações da Placa e Processador
        if (placaMaeValue !== "" && geracao !== ddrSuportadoPelaPlaca) erroDdrIncompativel = true;
        if (placaMaeValue !== "" && mhz > mhzMaximoDaPlaca) erroMhzExcedidoPlaca = true;
        if (processador !== "" && mhz > mhzMaximoNativoDoCpu && mhz <= mhzMaximoDaPlaca) alertaMhzOverclockCpu = true;
    }

    processarSlotRam(ram1, vRam1); processarSlotRam(ram2, vRam2); processarSlotRam(ram3, vRam3); processarSlotRam(ram4, vRam4);

// --- PREENCHIMENTO VISUAL (TORNA AS PEÇAS SÓLIDAS QUANDO INSTALADAS) ---
    // Ajustes do SSD
    slotSsd.material.wireframe = (armazenamento !== "ssd-sata");
    if(slotM2) slotM2.material.wireframe = (armazenamento !== "ssd-m2");
    if (slotPlacaMae) slotPlacaMae.material.wireframe = (placaMaeValue === "");
    if (slotProcessador) slotProcessador.material.wireframe = (processador === "");
    if (slotGpu) slotGpu.material.wireframe = (gpu === "");
    if (slotFonte) slotFonte.material.wireframe = (fonte === "");
    if (slotCooler) slotCooler.material.wireframe = (cooler === "");
	// Forçando a pintura dos Radiadores com cor mais CLARA para destacar:
    let usaWC240 = (cooler === "wc240");
    let usaWC360 = (cooler === "wc360");
    let usaWaterCooler = (usaWC240 || usaWC360);

    if (radiador240) {
        radiador240.material.wireframe = !usaWC240; 
        if (usaWC240) radiador240.material.color.setHex(0xbdc3c7); // Prata Claro (Destaque)
    }
    
    if (radiador360) {
        radiador360.material.wireframe = !usaWC360;
        if (usaWC360) radiador360.material.color.setHex(0xbdc3c7); // Prata Claro (Destaque)
    }
	
	
	

    // --- ADICIONAR ERROS DE RAM NO PAINEL ---
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

    // Regras de Performance (Canais de memória)
    if (totalRamNum > 0 && !misturouGeracao && !misturouFrequencia) {
        if (totalRamNum === 1) alertasDeMontagem.push("Gargalo de Banda: Apenas 1 canal ativo (Single Channel). Seu processador perderá até 30% de desempenho em jogos.");
        if (totalRamNum === 2 && (vRam2 === "" || vRam4 === "")) alertasDeMontagem.push("Otimização Pendente: Para habilitar o Dual Channel verdadeiro com 2 pentes, mude-os para os slots alternados 2 e 4.");
    }

    // --- RESTO DAS VALIDAÇÕES DO COMPUTADOR ---
    if (socketPlaca !== "" && processador !== "" && socketPlaca !== processador) errosDeMontagem.push("Soquetes incompatíveis. O CPU não encaixa.");
    if (tamanhoPlaca === "eatx") errosDeMontagem.push("Falta de Espaço Crítica: Placas E-ATX não cabem fisicamente neste chassi.");
    
    if (gpu !== "") {
        let limiteFonte = (fonte === "550w") ? 550 : (fonte === "850w" ? 850 : 0);
        let consumoGpu = (gpu === "rtx5070ti") ? 300 : (gpu === "rx9070xt" ? 320 : 200);
        if (fonte === "") errosDeMontagem.push("O sistema precisa de uma Fonte para ligar a GPU.");
        else if (consumoGpu > 250 && limiteFonte < 600) errosDeMontagem.push(`A fonte (${limiteFonte}W) não suportará a carga da GPU.`);
    }
    if (processador !== "" && cooler === "") errosDeMontagem.push("Risco de Superaquecimento: Falta refrigeração no CPU.");

    // GPU Clearance Fixo
    if (gpu === "rx9060xt") slotGpu.scale.set(1, 1, 1);
    else if (gpu === "rtx5070ti") slotGpu.scale.set(1, 1, 1.35);
    else if (gpu === "rx9070xt") slotGpu.scale.set(1, 1, 1.7);
    else slotGpu.scale.set(1, 1, 1);

    if (gpu === "rx9070xt") errosDeMontagem.push("Erro de Gabinete Pequeno: A RX 9070 XT colide fisicamente com a ventoinha frontal pré-instalada.");
    else if (gpu === "rtx5070ti") alertasDeMontagem.push("Aviso de Espaço (Clearance): A RTX 5070 Ti ficará a poucos milímetros da ventoinha frontal.");

    // Fluxo de ar resumido
    let fansIn = 0, fansOut = 0, totalFans = 0;
    [fTras, fFrente1, fFrente2, fFrente3, fTeto1, fTeto2, fTeto3].forEach(f => { if (f === 'in') fansIn++; if (f === 'out') fansOut++; if (f !== "") totalFans++; });
    if (totalFans > 0) {
        if (fTras === 'in') errosDeMontagem.push("Erro: A ventoinha traseira deve ser Exaustor.");
        if (fFrente1 === 'out' || fFrente2 === 'out' || fFrente3 === 'out') errosDeMontagem.push("Erro: Ventoinhas frontais devem ser Injeção.");
    }

    // Verificação de peças essenciais para boot
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
        if (errosDeMontagem.length > 0) {
            luzAlerta.intensity = 5; luzAlerta.color.setHex(0xc0392b); 
            errosDeMontagem.forEach(err => htmlFinal += `<div class="log-erro">❌ ${err}</div>`);
        }
        if (alertasDeMontagem.length > 0) {
            if (errosDeMontagem.length === 0) { luzAlerta.intensity = 3; luzAlerta.color.setHex(0xf1c40f); }
            alertasDeMontagem.forEach(al => htmlFinal += `<div class="log-alerta">⚠️ ${al}</div>`);
        }
        if (errosDeMontagem.length === 0 && !faltaHardwareEssencial) {
            luzAlerta.intensity = 5; luzAlerta.color.setHex(0x27ae60); 
            htmlFinal = `<div class="log-sucesso">✅ SISTEMA PRONTO PARA DEPOIMENTO DE CARGA!</div>` + htmlFinal;
            if (btnPower && !sistemaLigado) { btnPower.disabled = false; btnPower.className = "btn-pronto"; btnPower.innerText = "⚡ LIGAR PC"; }
        } else {
            if (btnPower && !sistemaLigado) { btnPower.disabled = true; btnPower.className = "btn-desligado"; btnPower.innerText = "🔌 LIGAR PC"; }
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

// A FUNÇÃO MESTRE QUE LIGA O PC (Pode ser chamada pelo HTML ou pelo 3D)
function alternarEnergia() {
    let btnUI = document.getElementById('btn-power');
    if (btnUI && btnUI.disabled) return; // Trava de segurança
    
    sistemaLigado = !sistemaLigado; 
    
    if (sistemaLigado) {
        if(btnUI) { btnUI.className = "btn-ligado"; btnUI.innerText = "🔴 DESLIGAR PC"; }
        botaoPower3D.material.color.setHex(0x1abc9c); // O botão 3D fica Ciano/Verde!
        
        cena.background = new THREE.Color(0x050505);
        objetosInterativos.forEach(obj => {
            if (obj !== botaoPower3D) { // Não altera o wireframe do botão
                obj.material.wireframe = false;
                obj.material.opacity = 0.95;
            }
        });
    } else {
        if(btnUI) { btnUI.className = "btn-pronto"; btnUI.innerText = "⚡ LIGAR PC"; }
        botaoPower3D.material.color.setHex(0xff0000); // O botão 3D volta a ser Vermelho!
        
        cena.background = new THREE.Color(0x000000); 
        objetosInterativos.forEach(obj => {
            if (obj !== botaoPower3D) {
                obj.material.wireframe = true;
                obj.material.opacity = obj.userData.opacidadeOriginal;
                obj.material.color.setHex(obj.userData.corOriginal); 
            }
        });
    }
}

// O botão do HTML ativa a função
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
        // Efeito de energia (Só pisca RGB se o pente for da categoria RGB!)
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
animar();
})();

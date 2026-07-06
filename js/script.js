// ==========================================================================
// 1. CONFIGURAÇÃO BÁSICA DO AMBIENTE E CONTROLES
// ==========================================================================
const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderizador = new THREE.WebGLRenderer({ antialias: true });

renderizador.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container-3d').appendChild(renderizador.domElement);

camera.position.set(0, 3, 5);
camera.lookAt(0, 0, 0);

const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
cena.add(luzAmbiente);

const luzAlerta = new THREE.PointLight(0xffffff, 0, 10);
luzAlerta.position.set(0, 2, 0);
cena.add(luzAlerta);

// Ativa o controle livre do mouse
const controles = new THREE.OrbitControls(camera, renderizador.domElement);
controles.enableDamping = true;
controles.dampingFactor = 0.05;

// ==========================================================================
// 2. SISTEMA DE CARREGAMENTO DE MODELOS REAIS (GLTF/GLB)
// ==========================================================================
const carregador = new THREE.GLTFLoader();

let modeloPlacaReal = null;
let modeloProcessadorReal = null;

// ==========================================================================
// 3. CRIANDO OS "ESPAÇOS FANTASMAS" (Hitboxes)
// ==========================================================================
const geoPlaca = new THREE.BoxGeometry(3, 0.2, 4);
const matPlaca = new THREE.MeshBasicMaterial({ color: 0x4444ff, transparent: true, opacity: 0.2, wireframe: true });
const slotPlacaMae = new THREE.Mesh(geoPlaca, matPlaca);
slotPlacaMae.userData = { tipo: 'placa-mae', nome: 'Slot da Placa-Mãe' };
cena.add(slotPlacaMae);

const geoProc = new THREE.BoxGeometry(0.8, 0.2, 0.8);
const matProc = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.2, wireframe: true });
const slotProcessador = new THREE.Mesh(geoProc, matProc);
slotProcessador.position.set(0, 0.2, -0.5); 
slotProcessador.userData = { tipo: 'processador', nome: 'Slot do Processador' };
cena.add(slotProcessador);

const objetosInterativos = [slotPlacaMae, slotProcessador];

// ==========================================================================
// 4. O SENSOR DO MOUSE (Raycaster)
// ==========================================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (evento) => {
    const menu = document.getElementById('menu-flutuante');

    if (menu.contains(evento.target)) {
        return; 
    }

    mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(evento.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersecoes = raycaster.intersectObjects(objetosInterativos);

    if (intersecoes.length > 0) {
        const objetoAtingido = intersecoes[0].object;

        menu.style.display = 'block';
        menu.style.left = (evento.clientX + 15) + 'px';
        menu.style.top = (evento.clientY + 15) + 'px';
        document.getElementById('menu-titulo').innerText = objetoAtingido.userData.nome;

        document.getElementById('grupo-placa-mae').style.display = 'none';
        document.getElementById('grupo-processador').style.display = 'none';

        if (objetoAtingido.userData.tipo === 'placa-mae') {
            document.getElementById('grupo-placa-mae').style.display = 'block';
        } else if (objetoAtingido.userData.tipo === 'processador') {
            document.getElementById('grupo-processador').style.display = 'block';
        }
    } else {
        menu.style.display = 'none';
    }
});

// ==========================================================================
// 5. LÓGICA DE COMPATIBILIDADE E CARREGAMENTO 3D
// ==========================================================================
function verificarCompatibilidade() {
    let placaMae = document.getElementById('placa-mae').value;
    let processador = document.getElementById('processador').value;
    let alerta = document.getElementById('alerta-tela');

    // 1. CARREGA A PLACA-MÃE (Com a Rotação Ajustada)
    if (placaMae !== "" && modeloPlacaReal === null) {
        console.log("⏳ Carregando a Placa-Mãe...");
        carregador.load('modelos/placa.glb', function(gltf) {
            console.log("✅ Placa-Mãe carregada!");
            modeloPlacaReal = gltf.scene;
            modeloPlacaReal.position.copy(slotPlacaMae.position); 
            
            // Deita a placa-mãe na mesa
            modeloPlacaReal.rotation.x = -Math.PI / 2; 
            
            cena.add(modeloPlacaReal);
            slotPlacaMae.material.opacity = 0; 
        }, undefined, function(erro) {
            console.error("❌ ERRO NA PLACA:", erro);
        });
    }

    // 2. CARREGA O PROCESSADOR
if (processador !== "" && modeloProcessadorReal === null) {
    console.log("⏳ Carregando o Processador...");
    carregador.load('modelos/processador.glb', function(gltf) {
        console.log("✅ Processador carregado!");
        modeloProcessadorReal = gltf.scene;
        
        // Sintonia fina manual: O 0.01 faz ele descer até a altura da placa.
        modeloProcessadorReal.position.set(0, 0.01, -0.5); 
        modeloProcessadorReal.scale.set(0.5, 0.5, 0.5); 
        cena.add(modeloProcessadorReal);
        slotProcessador.material.opacity = 0; 

    }, undefined, function(erro) {
        console.error("❌ ERRO NO PROCESSADOR:", erro);
    });
}

    // 3. VERIFICA A COMPATIBILIDADE
    if (placaMae !== "" && processador !== "") {
        alerta.style.display = 'block';
        luzAlerta.intensity = 5; 

        if (placaMae === processador) {
            alerta.innerHTML = "COMPATÍVEL! ✅ Soquetes iguais.";
            alerta.style.backgroundColor = "#27ae60";
            luzAlerta.color.setHex(0x27ae60); 
        } else {
            alerta.innerHTML = "INCOMPATÍVEL! ❌ Atenção aos Soquetes.";
            alerta.style.backgroundColor = "#c0392b";
            luzAlerta.color.setHex(0xc0392b); 
        }
    }
}
window.verificarCompatibilidade = verificarCompatibilidade;

// ==========================================================================
// 6. MOTOR DE ANIMAÇÃO E RESPONSIVIDADE
// ==========================================================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});

function animar() {
    requestAnimationFrame(animar);
    
    // Atualiza a física suave do mouse a cada quadro
    controles.update(); 
    
    renderizador.render(cena, camera);
}
animar();
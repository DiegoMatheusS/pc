document.addEventListener("DOMContentLoaded", function() {
    const container = document.getElementById('gpu-banner-container');
    if (!container) return; // Se não achar o container, cancela

    // 1. Configuração Básica
    const scene = new THREE.Scene();
    
    // 2. Câmera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, 5, 8);

    // 3. Renderizador (alpha: true é o truque para fundo transparente)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 4. Controles (Para o utilizador poder rodar)
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.autoRotate = true; // Gira sozinha!
    controls.autoRotateSpeed = 2.0; 
    controls.enableZoom = false; // Desativa o zoom para não bugar a página ao rolar o mouse

    // 5. Luzes Premium
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00e5ff, 2); // Luz azul-ciano (estilo gamer)
    dirLight1.position.set(5, 10, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff00ff, 1.5); // Luz roxa/magenta nas costas
    dirLight2.position.set(-5, 0, -5);
    scene.add(dirLight2);

    /* =======================================================
       6. A PLACA DE VÍDEO (RTX 3090)
    ======================================================= */
    const loader = new THREE.GLTFLoader();

    // Puxa o arquivo rtx3090.glb que você colocou na pasta modelos
    loader.load('modelos/rtx3090.glb', function(gltf) {
        const rtx = gltf.scene;
        
        // ⚠️ ATENÇÃO AO TAMANHO: 
        // Modelos da internet podem vir gigantes ou minúsculos. 
        // Se ela não aparecer ou ocupar a tela toda, mude os números abaixo!
        // Ex: (0.1, 0.1, 0.1) se estiver gigante, ou (10, 10, 10) se estiver minúscula.
        rtx.scale.set(1.5, 1.5, 1.5); 
        
        // Para garantir que ela fique bem no centro da rotação
        rtx.position.set(0, 0, 0); 

        scene.add(rtx);
        
    }, undefined, function (error) {
        // Se algo der errado (ex: nome do arquivo diferente), ele avisa no console
        console.error('Erro ao carregar a RTX 3090:', error);
    });
    

    // 7. Loop de Animação
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Necessário para o autoRotate funcionar
        renderer.render(scene, camera);
    }
    animate();

    // 8. Responsividade: Redimensiona se a tela encolher
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});
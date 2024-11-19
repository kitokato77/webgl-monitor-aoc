let scene, camera, renderer, composer, model;
const params = {
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0,
    bloomRadius: 0,
    ambientIntensity: 0.5,
    directionalIntensity: 1,
    enableShadows: true,
    enableBloom: true,
    rotationSpeed: 0,
    autoRotate: false,
    backgroundColor: '#000000',
    backgroundPresets: 'Custom'
};

function init() {
    if (!webGLAvailable()) {
        showError('Browser Anda tidak mendukung WebGL. Silakan gunakan browser modern.');
        return;
    }

    setupScene();
    setupLights();
    setupPostProcessing();
    setupGUI();
    loadModel();
    animate();

    window.addEventListener('resize', onWindowResize, false);
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(params.backgroundColor);
    
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = params.exposure;
    document.body.appendChild(renderer.domElement);

    controls = setupControls(camera, renderer.domElement);
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    document.getElementById('loading').style.display = 'block';

    loader.load(
        'models/monitor-aoc.glb',
        function (gltf) {
            model = gltf.scene;
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if (node.material) {
                        node.material.envMapIntensity = 1;
                        node.material.needsUpdate = true;
                    }
                }
            });

            scene.add(model);
            centerModel(model);
            document.getElementById('loading').style.display = 'none';
        },
        function (xhr) {
            const percent = (xhr.loaded / xhr.total) * 100;
            document.getElementById('loading').textContent = 
                `Loading model... ${Math.round(percent)}%`;
        },
        function (error) {
            console.error('Error loading model:', error);
            showError('Error loading model: ' + error.message);
        }
    );
}

function centerModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    camera.position.z = cameraZ * 1.5;
    controls.target.copy(center);
    controls.update();
}

function animate() {
    requestAnimationFrame(animate);
    
    if (model && params.autoRotate) {
        model.rotation.y += params.rotationSpeed;
    }
    
    controls.update();

    if (params.enableBloom) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    updatePostProcessing(); // Add this line
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

function webGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

init();
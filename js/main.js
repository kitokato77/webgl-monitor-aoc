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
        showError('Browser ini tidak mendukung WebGL.');
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

function setupControls(camera, domElement) {
    const controls = new THREE.OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2.0;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    
    return controls;
}

function loadModel() {
    const mtlLoader = new THREE.MTLLoader();
    const objLoader = new THREE.OBJLoader();
    document.getElementById('loading').style.display = 'block';

    mtlLoader.load('models/monitor-aoc.mtl', function (materials) {
        console.log('Materials loaded:', materials);
        materials.preload();

        if (Object.keys(materials.materials).length === 0) {
            console.error('No materials found in the MTL file.');
        }

        for (const materialName in materials.materialsInfo) {
            const material = materials.materials[materialName];
            if (material.map) {
                material.map.wrapS = THREE.ClampToEdgeWrapping;
                material.map.wrapT = THREE.ClampToEdgeWrapping;
            }
        }

        objLoader.setMaterials(materials);
        objLoader.load('models/monitor-aoc.obj', function (object) {
            model = object;
            console.log('Model loaded:', model);
            
            model.traverse((node) => {
                if (node.isMesh) {
                    const materialName = node.material.name;
                    node.material = materials.materials[materialName] || node.material;
                    node.castShadow = true;
                    node.receiveShadow = true;
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
        });
    }, 
    function (error) {
        console.error('Error loading materials:', error);
    });
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
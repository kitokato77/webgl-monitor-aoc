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

function setupGUI() {
    const gui = new dat.GUI();

    const backgroundFolder = gui.addFolder('Background');

    const colorPresets = {
        'Custom': '#000000',
        'Dark Grey': '#242424',
        'Light Grey': '#CCCCCC',
        'White': '#FFFFFF',
        'Deep Blue': '#000033',
        'Forest Green': '#013220',
        'Burgundy': '#800020'
    };

    backgroundFolder.add(params, 'backgroundPresets', Object.keys(colorPresets))
        .name('Preset Colors')
        .onChange(value => {
            params.backgroundColor = colorPresets[value];
            scene.background.set(params.backgroundColor);
            updateBackgroundColorPicker();
        });

    backgroundFolder.addColor(params, 'backgroundColor')
        .name('Custom Color')
        .onChange(value => {
            scene.background.set(value);
            params.backgroundPresets = 'Custom';
        });
    
    backgroundFolder.open();

    const lightingFolder = gui.addFolder('Lighting');
    lightingFolder.add(params, 'ambientIntensity', 0, 2).onChange(value => {
        ambientLight.intensity = value;
    });
    lightingFolder.add(params, 'directionalIntensity', 0, 2).onChange(value => {
        directionalLight.intensity = value;
    });
    lightingFolder.add(params, 'enableShadows').onChange(value => {
        renderer.shadowMap.enabled = value;
        directionalLight.castShadow = value;
        if (model) {
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = value;
                    node.receiveShadow = value;
                }
            });
        }
    });

    const postFolder = gui.addFolder('Post Processing');
    postFolder.add(params, 'enableBloom');
    postFolder.add(params, 'bloomStrength', 0.0, 3.0).onChange(value => {
        bloomPass.strength = value;
    });
    postFolder.add(params, 'bloomThreshold', 0.0, 1.0).onChange(value => {
        bloomPass.threshold = value;
    });
    postFolder.add(params, 'bloomRadius', 0.0, 1.0).onChange(value => {
        bloomPass.radius = value;
    });

    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(params, 'autoRotate');
    animationFolder.add(params, 'rotationSpeed', -0.1, 0.1).step(0.001);

    lightingFolder.open();
    postFolder.open();
    animationFolder.open();
}

function updateBackgroundColorPicker() {
    const gui = document.querySelector('.dg.ac');
    const controllers = gui.querySelectorAll('.controller.color');
    controllers.forEach(controller => {
        const property = controller.querySelector('.property-name');
        if (property && property.textContent === 'Custom Color') {
            const colorElement = controller.querySelector('.c');
            if (colorElement) {
                colorElement.style.backgroundColor = params.backgroundColor;
            }
        }
    });
}
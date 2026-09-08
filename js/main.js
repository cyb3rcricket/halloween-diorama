/**
 * Cute Halloween 3D Diorama - Main Application Entry Point
 */

class DioramaApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initControls();
    this.initModules();
    this.initResizeListener();
    this.handleLoadingSequence();
    this.animate();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // High quality lighting & shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Cinematic Storybook Tone Mapping
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(44, aspect, 0.1, 120);
    this.camera.position.set(0, 4.4, 16.0);
    this.camera.lookAt(0, 4.0, 0);
  }

  initControls() {
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.orbitControls.enabled = false; // Parallax mode by default
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.05;
      this.orbitControls.target.set(0, 4.0, 0);
      this.orbitControls.minDistance = 4;
      this.orbitControls.maxDistance = 24;
      this.orbitControls.maxPolarAngle = Math.PI * 0.49; // Prevent going beneath ground
    }
  }

  initModules() {
    // 1. Sky & Celestial Elements (Moon, Stars, Clouds, Flying Bats)
    this.sky = new SkySystem(this.scene);

    // 2. Lighting & Atmosphere
    this.lighting = new DioramaLighting(this.scene);

    // 3. Environment (Hill, 3 Iconic Trees, Rocks, Leaves, Flowers, Pines)
    this.environment = new DioramaEnvironment(this.scene);

    // 4. Characters
    this.cat = new CuteCat(this.scene);
    this.ghost = new CuteGhost(this.scene);

    // 5. Effects
    this.sparkles = new SparkleSystem(this.scene);

    // 6. Interaction & Parallax
    this.interaction = new InteractionManager(this);
  }

  handleLoadingSequence() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressFill = document.getElementById('progress-fill');

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('quick')) {
      if (loadingScreen) loadingScreen.style.display = 'none';
      return;
    }

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 35;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);

        if (progressFill) progressFill.style.width = '100%';

        setTimeout(() => {
          if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
              loadingScreen.style.display = 'none';
            }, 800);
          }
        }, 150);
      } else {
        if (progressFill) progressFill.style.width = `${progress}%`;
      }
    }, 40);

    // Immediate skip on click or touch
    if (loadingScreen) {
      loadingScreen.addEventListener('pointerdown', () => {
        clearInterval(progressInterval);
        loadingScreen.classList.add('fade-out');
        setTimeout(() => { loadingScreen.style.display = 'none'; }, 800);
      });
    }
  }

  initResizeListener() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // Module updates
    if (this.sky) this.sky.update(delta, elapsed);
    if (this.lighting) this.lighting.update(delta, elapsed);
    if (this.environment) this.environment.update(delta, elapsed);
    if (this.cat) this.cat.update(delta, elapsed);
    if (this.ghost) this.ghost.update(delta, elapsed);
    if (this.sparkles) this.sparkles.update(delta, elapsed);

    // Camera & interaction update
    if (this.interaction) {
      if (this.interaction.cameraMode === 'orbit' && this.orbitControls) {
        this.orbitControls.update();
      } else {
        this.interaction.update(delta);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Start application once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.dioramaApp = new DioramaApp();
});

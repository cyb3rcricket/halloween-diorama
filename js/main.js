/**
 * Cute Halloween 3D Diorama - Main Application Entry Point
 */

class DioramaApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    this.renderQuality = this.getRenderQuality(window.innerWidth, window.innerHeight);

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initControls();
    this.initModules();
    this.initResizeListener();
    this.handleLoadingSequence();
    this.animate();
  }

  // Keep the renderer policy in one place so initialization and resize use the
  // same DPR decision. Capability checks are deliberately conservative and do
  // not depend on a user-agent string or a device library.
  getRenderQuality(width, height) {
    const aspect = width / Math.max(1, height);
    const minDimension = Math.min(width, height);
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    const cores = Number.isFinite(nav.hardwareConcurrency) ? nav.hardwareConcurrency : 4;
    const memory = Number.isFinite(nav.deviceMemory) ? nav.deviceMemory : 4;
    const lowCapability = cores <= 2 || memory <= 2;
    const compactViewport = minDimension < 700 || aspect < 1.05;
    const compact = compactViewport || lowCapability;

    return {
      tier: compact ? 'compact' : 'high',
      dprCap: compact ? 1.5 : 2,
      moonShadowMapSize: compact ? 1024 : 2048,
      lanternShadowMapSize: compact ? 256 : 512
    };
  }

  // Authored aspect knots keep the storybook composition recognizable while
  // giving narrow screens enough horizontal room for all hero elements. The
  // smooth interpolation avoids a visible resize snap at device breakpoints.
  getCameraFrame(width, height) {
    const aspect = width / Math.max(1, height);
    const smoothStep = value => value * value * (3 - 2 * value);
    const interpolate = (fromAspect, toAspect, fromDistance, toDistance, fromFov, toFov) => {
      const rawT = (aspect - fromAspect) / (toAspect - fromAspect);
      const t = smoothStep(Math.max(0, Math.min(1, rawT)));
      return {
        distance: fromDistance + (toDistance - fromDistance) * t,
        fov: fromFov + (toFov - fromFov) * t
      };
    };

    let framing;
    if (aspect <= 0.5) {
      framing = { distance: 27, fov: 47.5 };
    } else if (aspect < 0.75) {
      framing = interpolate(0.5, 0.75, 27, 24, 47.5, 46);
    } else if (aspect < 1.0) {
      framing = { distance: 24, fov: 46 };
    } else if (aspect < 4 / 3) {
      framing = interpolate(1.0, 4 / 3, 24, 18, 46, 44);
    } else if (aspect < 1.5) {
      framing = interpolate(4 / 3, 1.5, 18, 16, 44, 44);
    } else {
      framing = { distance: 16, fov: 44 };
    }

    // A restrained portrait target lift fills the lower-ground gap; it eases
    // back to the authored tablet target at the same 0.75 aspect knot.
    const targetY = aspect <= 0.5 ? 4.4 :
      aspect < 0.75 ? 4.4 + (4.0 - 4.4) * smoothStep((aspect - 0.5) / 0.25) : 4.0;

    return {
      fov: framing.fov,
      aspect,
      basePosition: new THREE.Vector3(0, 4.4, framing.distance),
      target: new THREE.Vector3(0, targetY, 0)
    };
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.renderQuality.dprCap));

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
    this.cameraFrame = this.getCameraFrame(window.innerWidth, window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(this.cameraFrame.fov, this.cameraFrame.aspect, 0.1, 120);
    this.camera.position.copy(this.cameraFrame.basePosition);
    this.camera.lookAt(this.cameraFrame.target);
  }

  initControls() {
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.orbitControls.enabled = false; // Parallax mode by default
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.05;
      this.orbitControls.target.copy(this.cameraFrame.target);
      this.orbitControls.minDistance = 4;
      this.orbitControls.maxDistance = 48;
      this.orbitControls.maxPolarAngle = Math.PI * 0.49; // Prevent going beneath ground
      this.orbitControls.saveState();
    }
  }

  initModules() {
    // 1. Sky & Celestial Elements (Moon, Stars, Clouds, Flying Bats)
    this.sky = new SkySystem(this.scene);

    // 2. Lighting & Atmosphere
    this.lighting = new DioramaLighting(this.scene, this.renderQuality);

    // 3. Environment (Hill, 3 Iconic Trees, Rocks, Leaves, Flowers, Pines)
    this.environment = new DioramaEnvironment(this.scene);

    // 4. Characters
    this.cat = new CuteCat(this.scene);
    this.ghost = new CuteGhost(this.scene);
    this.lighting.setGhost(this.ghost);
    this.environment.setGhost(this.ghost);
    this.environment.setLighting(this.lighting);

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

      this.applyCameraFrame(width, height);

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.renderQuality.dprCap));
    });
  }

  applyCameraFrame(width, height) {
    this.renderQuality = this.getRenderQuality(width, height);
    // Shadow map dimensions are creation-time in Three.js; a resize updates
    // DPR and camera framing, while the initial lighting tier remains stable.
    this.cameraFrame = this.getCameraFrame(width, height);
    this.camera.fov = this.cameraFrame.fov;
    this.camera.aspect = this.cameraFrame.aspect;
    this.camera.position.copy(this.cameraFrame.basePosition);
    this.camera.lookAt(this.cameraFrame.target);
    this.camera.updateProjectionMatrix();

    // Resizing intentionally rebases parallax/orbit to the new authored
    // frame, avoiding stale offsets and keeping OrbitControls reset coherent.
    if (this.orbitControls) {
      this.orbitControls.target.copy(this.cameraFrame.target);
      this.orbitControls.update();
      this.orbitControls.saveState();
    }
    if (this.interaction) {
      this.interaction.rebaseCameraFrame();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // Module updates
    if (this.cat) this.cat.update(delta, elapsed);
    if (this.ghost) this.ghost.update(delta, elapsed);
    if (this.sky) this.sky.update(delta, elapsed);
    if (this.lighting) this.lighting.update(delta, elapsed);
    if (this.environment) this.environment.update(delta, elapsed);
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

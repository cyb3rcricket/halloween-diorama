/**
 * Interaction Manager: Raycasting, Parallax Mouse Follow,
 * OrbitControls Toggle, Touch Handling, and Click Feedback Toasts.
 */

class InteractionManager {
  constructor(app) {
    this.app = app;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.mouseNorm = { x: 0, y: 0 };
    this.targetCameraOffset = { x: 0, y: 0 };
    this.currentCameraOffset = { x: 0, y: 0 };

    this.cameraMode = 'parallax'; // 'parallax' or 'orbit'
    this.isPointerDown = false;
    this.pointerStartPos = { x: 0, y: 0 };
    this.currentHoveredTarget = null;

    this.initDOM();
    this.initEvents();
    this.handleUrlTriggers();
  }

  handleUrlTriggers() {
    const urlParams = new URLSearchParams(window.location.search);
    const testTarget = urlParams.get('test');
    if (!testTarget) return;

    setTimeout(() => {
      if (testTarget === 'cat' && this.app.cat) {
        this.app.cat.triggerInteraction();
        this.showToast('Purr & Meow! 🐾', window.innerWidth * 0.44, window.innerHeight * 0.68);
      } else if (testTarget === 'ghost' && this.app.ghost) {
        this.app.ghost.triggerInteraction();
        this.showToast('Boo! Friendly Ghost! 👻', window.innerWidth * 0.65, window.innerHeight * 0.48);
      } else if ((testTarget === 'lantern' || testTarget === 'tree') && this.app.lighting) {
        this.app.lighting.triggerLanternFlare();
        if (this.app.environment && typeof this.app.environment.triggerLanternFlare === 'function') {
          this.app.environment.triggerLanternFlare();
        }
        this.showToast('Spooky Glow! 🕯️', window.innerWidth * 0.35, window.innerHeight * 0.45);
      }
    }, 400);
  }

  initDOM() {
    this.btnCamera = document.getElementById('btn-camera');
    this.btnAudio = document.getElementById('btn-audio');
    this.btnReset = document.getElementById('btn-reset');
    this.audioIcon = document.getElementById('audio-icon');
    this.audioLabel = document.getElementById('audio-label');
    this.hintBanner = document.getElementById('interactive-hint');
    this.hintClose = document.getElementById('hint-close');
    this.toast = document.getElementById('click-toast');

    // Hint banner dismiss
    if (this.hintClose) {
      this.hintClose.addEventListener('click', () => {
        if (this.hintBanner) this.hintBanner.classList.add('dismissed');
      });
    }

    // Audio toggle
    if (this.btnAudio) {
      this.btnAudio.addEventListener('click', () => {
        const isUnmuted = window.soundManager ? window.soundManager.toggleMute() : false;
        if (isUnmuted) {
          if (this.audioIcon) this.audioIcon.textContent = '🔊';
          if (this.audioLabel) this.audioLabel.textContent = 'Sound On';
          this.btnAudio.classList.add('active');
          this.showToast('Sound On 🎵', window.innerWidth * 0.5, 60);
        } else {
          if (this.audioIcon) this.audioIcon.textContent = '🔇';
          if (this.audioLabel) this.audioLabel.textContent = 'Sound Off';
          this.btnAudio.classList.remove('active');
          this.showToast('Muted 🔇', window.innerWidth * 0.5, 60);
        }
      });
    }

    // Camera mode toggle
    if (this.btnCamera) {
      this.btnCamera.addEventListener('click', () => {
        this.toggleCameraMode();
      });
    }

    // Reset view
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        this.resetCamera();
      });
    }
  }

  toggleCameraMode() {
    if (this.cameraMode === 'parallax') {
      this.cameraMode = 'orbit';
      if (this.app.orbitControls) {
        this.app.orbitControls.enabled = true;
      }
      this.btnCamera.classList.add('active');
      const label = this.btnCamera.querySelector('.btn-label');
      if (label) label.textContent = 'Orbit 3D';
      this.showToast('Orbit Mode: Drag to rotate, scroll to zoom', window.innerWidth * 0.5, 80);
    } else {
      this.cameraMode = 'parallax';
      if (this.app.orbitControls) {
        this.app.orbitControls.enabled = false;
      }
      this.btnCamera.classList.remove('active');
      const label = this.btnCamera.querySelector('.btn-label');
      if (label) label.textContent = 'Parallax';
      this.resetCamera();
      this.showToast('Parallax Mode: Move cursor to look around', window.innerWidth * 0.5, 80);
    }
  }

  resetCamera() {
    const frame = this.app.cameraFrame;
    if (this.app.orbitControls) {
      this.app.orbitControls.reset();
      this.app.orbitControls.target.copy(frame.target);
      this.app.orbitControls.update();
    }
    this.app.camera.position.copy(frame.basePosition);
    this.app.camera.lookAt(frame.target);
    this.targetCameraOffset.x = 0;
    this.targetCameraOffset.y = 0;
    this.currentCameraOffset.x = 0;
    this.currentCameraOffset.y = 0;
  }

  rebaseCameraFrame() {
    const frame = this.app.cameraFrame;
    if (!frame || !this.app.camera) return;

    this.targetCameraOffset.x = 0;
    this.targetCameraOffset.y = 0;
    this.currentCameraOffset.x = 0;
    this.currentCameraOffset.y = 0;
    this.app.camera.position.copy(frame.basePosition);
    this.app.camera.lookAt(frame.target);

    if (this.app.orbitControls) {
      this.app.orbitControls.target.copy(frame.target);
      this.app.orbitControls.update();
      this.app.orbitControls.saveState();
    }
  }

  initEvents() {
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerCancel(e));
    window.addEventListener('mouseleave', () => this.clearHoverState());
  }

  onPointerMove(e) {
    this.updatePointerCoordinates(e);

    // Touch guard: mobile taps should never get stuck in hover state.
    // Also ignore hover while dragging camera / orbit.
    if (e.pointerType === 'touch' || this.isPointerDown) {
      this.clearHoverState();
      return;
    }

    this.checkHover();
  }

  updatePointerCoordinates(e, updateParallax = true) {
    // Normalized device coordinates (-1 to +1)
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (!updateParallax) return;

    // Smoothed parallax targets
    this.mouseNorm.x = (e.clientX / window.innerWidth) - 0.5;
    this.mouseNorm.y = (e.clientY / window.innerHeight) - 0.5;

    if (this.cameraMode === 'parallax') {
      this.targetCameraOffset.x = this.mouseNorm.x * 2.2;
      this.targetCameraOffset.y = -this.mouseNorm.y * 1.5;
    }
  }

  onPointerDown(e) {
    this.isPointerDown = true;
    this.pointerStartPos = { x: e.clientX, y: e.clientY };
    // Immediately clear any active hover on touch / click down
    this.clearHoverState();
  }

  onPointerCancel(e) {
    this.isPointerDown = false;
    this.clearHoverState();
  }

  onPointerUp(e) {
    this.isPointerDown = false;

    // Touch guard: ensure mobile touch completion leaves no stuck hover
    if (e.pointerType === 'touch') {
      this.clearHoverState();
    }

    const dist = Math.hypot(e.clientX - this.pointerStartPos.x, e.clientY - this.pointerStartPos.y);

    // Only trigger click raycast if it was a distinct tap/click without drag
    if (dist < 8) {
      this.performRaycastClick(e);
    }
  }

  getInteractiveTargets() {
    const targets = [];
    if (this.app.cat && this.app.cat.clickableMeshes) {
      targets.push(...this.app.cat.clickableMeshes);
    }
    if (this.app.ghost && this.app.ghost.clickableMeshes) {
      targets.push(...this.app.ghost.clickableMeshes);
    }
    if (this.app.environment && this.app.environment.clickableLanterns) {
      targets.push(...this.app.environment.clickableLanterns);
    }
    return targets;
  }

  checkHover() {
    if (!this.app.camera || !this.app.scene) return;

    this.raycaster.setFromCamera(this.mouse, this.app.camera);
    const targets = this.getInteractiveTargets();
    const intersects = this.raycaster.intersectObjects(targets, true);

    let hovered = null;
    if (intersects.length > 0) {
      const hit = intersects[0];
      const obj = hit.object;

      if (obj.userData.isCat || (obj.parent && obj.parent.userData.isCat)) {
        hovered = 'cat';
      } else if (obj.userData.isGhost || (obj.parent && obj.parent.userData.isGhost)) {
        hovered = 'ghost';
      } else if (obj.userData.isLantern || (obj.parent && obj.parent.userData.isLantern)) {
        hovered = 'lantern';
      }
    }

    this.setHoveredTarget(hovered);
  }

  setHoveredTarget(target) {
    if (this.currentHoveredTarget === target) return;
    this.currentHoveredTarget = target;

    // Cursor management: indicate interactive target or restore default grab/default
    const hasHover = Boolean(target);
    const cursor = hasHover ? 'pointer' : '';
    document.body.style.cursor = cursor;
    if (this.app.container) {
      this.app.container.style.cursor = cursor;
    }

    // Notify individual target modules of subtle hover state
    if (this.app.cat && typeof this.app.cat.setHovered === 'function') {
      this.app.cat.setHovered(target === 'cat');
    }
    if (this.app.ghost && typeof this.app.ghost.setHovered === 'function') {
      this.app.ghost.setHovered(target === 'ghost');
    }
    if (this.app.environment && typeof this.app.environment.setLanternHovered === 'function') {
      this.app.environment.setLanternHovered(target === 'lantern');
    }
  }

  clearHoverState() {
    this.setHoveredTarget(null);
  }

  performRaycastClick(e) {
    if (!this.app.camera || !this.app.scene) return;

    // Pointerup can be the first pointer event at this location (especially on
    // touch), so do not depend on a prior pointermove to seed the raycaster.
    // Keep this independent of parallax targets so clicks do not change camera
    // behavior.
    this.updatePointerCoordinates(e, false);

    // First ensure audio context can resume on interaction
    if (window.soundManager) {
      window.soundManager.resumeContext();
    }

    this.raycaster.setFromCamera(this.mouse, this.app.camera);

    const clickTargets = this.getInteractiveTargets();
    const intersects = this.raycaster.intersectObjects(clickTargets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const obj = hit.object;

      // 1. Cat clicked
      if (obj.userData.isCat || (obj.parent && obj.parent.userData.isCat)) {
        if (this.app.cat) {
          this.app.cat.triggerInteraction();
          const p = this.app.cat.group.position;
          this.app.sparkles.spawnBurst(new THREE.Vector3(p.x, p.y + 1.2, p.z), 0xffaa22, 22);
          this.showToast('Meow! 🐾', e.clientX, e.clientY);
        }
        return;
      }

      // 2. Ghost clicked
      if (obj.userData.isGhost || (obj.parent && obj.parent.userData.isGhost)) {
        if (this.app.ghost) {
          this.app.ghost.triggerInteraction();
          const p = this.app.ghost.group.position;
          this.app.sparkles.spawnBurst(new THREE.Vector3(p.x, p.y + 1.2, p.z), 0xd699ff, 25);
          this.showToast('Boo! ✨', e.clientX, e.clientY);
        }
        return;
      }

      // 3. Tree Lantern clicked
      if (obj.userData.isLantern || (obj.parent && obj.parent.userData.isLantern)) {
        if (window.soundManager) {
          window.soundManager.playLanternGlow();
        }
        if (this.app.lighting) {
          this.app.lighting.triggerLanternFlare();
        }
        if (this.app.environment && typeof this.app.environment.triggerLanternFlare === 'function') {
          this.app.environment.triggerLanternFlare();
        }
        this.app.sparkles.spawnBurst(hit.point, 0xffbb33, 20);
        this.showToast('Spooky Glow! 🕯️', e.clientX, e.clientY);
        return;
      }
    } else {
      // Clicked on grass or sky: playful little sparkle at intersection with scene
      const generalIntersects = this.raycaster.intersectObjects([this.app.environment.groundMesh], false);
      if (generalIntersects.length > 0) {
        const pt = generalIntersects[0].point;
        this.app.sparkles.spawnBurst(pt, 0xffea88, 10);
      }
    }
  }

  showToast(text, x, y) {
    if (!this.toast) return;

    this.toast.textContent = text;
    this.toast.style.left = `${Math.min(Math.max(60, x), window.innerWidth - 60)}px`;
    this.toast.style.top = `${Math.min(Math.max(60, y - 40), window.innerHeight - 60)}px`;
    this.toast.classList.add('show');

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 1400);
  }

  update(delta) {
    // Parallax camera damping
    if (this.cameraMode === 'parallax' && this.app.camera) {
      this.currentCameraOffset.x += (this.targetCameraOffset.x - this.currentCameraOffset.x) * 0.05;
      this.currentCameraOffset.y += (this.targetCameraOffset.y - this.currentCameraOffset.y) * 0.05;

      const basePos = this.app.cameraFrame.basePosition;
      const target = this.app.cameraFrame.target;
      this.app.camera.position.x = basePos.x + this.currentCameraOffset.x;
      this.app.camera.position.y = basePos.y + this.currentCameraOffset.y;
      this.app.camera.position.z = basePos.z;
      this.app.camera.lookAt(target);
    }
  }
}

window.InteractionManager = InteractionManager;

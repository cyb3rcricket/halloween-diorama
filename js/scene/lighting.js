/**
 * Scene Lighting Setup matching the storybook nocturnal reference
 */

class DioramaLighting {
  constructor(scene, quality = {}) {
    this.scene = scene;
    this.quality = quality;
    this.flickerLights = [];
    this.ghost = null;
    this.ghostWorldPosition = new THREE.Vector3();
    // Authored offset keeps the glow just above the ghost's local origin.
    this.ghostGlowOffset = new THREE.Vector3(0, 0.1, 0);
    this.lanternFlare = {
      amount: 0,
      target: 0,
      hold: 0
    };
    this.lanternHover = {
      amount: 0,
      target: 0
    };
    this.lanternGlowFactor = 1.0;

    this.initLights();
  }

  initLights() {
    // 1. Hemisphere Light: Deep midnight blue sky & dark moss bounce
    this.hemiLight = new THREE.HemisphereLight(0x263668, 0x122014, 0.42);
    this.scene.add(this.hemiLight);

    // 2. Minimal Ambient Light for deep nocturnal contrast
    this.ambientLight = new THREE.AmbientLight(0x141a36, 0.15);
    this.scene.add(this.ambientLight);

    // 3. Directional Moonlight (Upper-right, matching the full moon)
    this.moonLight = new THREE.DirectionalLight(0xc4d6ff, 1.15);
    this.moonLight.position.set(11, 16, 7);
    this.moonLight.castShadow = true;
    const moonShadowMapSize = this.quality.moonShadowMapSize || 2048;
    this.moonLight.shadow.mapSize.width = moonShadowMapSize;
    this.moonLight.shadow.mapSize.height = moonShadowMapSize;
    this.moonLight.shadow.camera.near = 1;
    this.moonLight.shadow.camera.far = 45;
    this.moonLight.shadow.bias = -0.0008;

    const d = 11;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.moonLight.shadow.radius = 2.5; // Soft shadows
    this.scene.add(this.moonLight);

    // 4. Character & Silhouette Rim Light (Back-left)
    this.rimLight = new THREE.DirectionalLight(0x768ee8, 0.75);
    this.rimLight.position.set(-10, 8, -9);
    this.scene.add(this.rimLight);

    // 5. Hero Tree Hollow Lantern Light (Rich warm golden amber)
    this.treeLanternLight = new THREE.PointLight(0xff9a24, 3.2, 10.5, 1.6);
    this.treeLanternLight.position.set(-3.85, 2.9, 2.1);
    this.treeLanternLight.castShadow = true;
    const lanternShadowMapSize = this.quality.lanternShadowMapSize || 512;
    this.treeLanternLight.shadow.mapSize.width = lanternShadowMapSize;
    this.treeLanternLight.shadow.mapSize.height = lanternShadowMapSize;
    this.treeLanternLight.shadow.bias = -0.002;
    this.scene.add(this.treeLanternLight);

    // Warm glow pooling down onto trunk flare and roots
    this.treeLanternBounce = new THREE.PointLight(0xff8818, 1.2, 6.0, 2.0);
    this.treeLanternBounce.position.set(-3.7, 1.5, 2.5);
    this.scene.add(this.treeLanternBounce);

    // treeLanternLight and treeLanternBounce are coordinated in update() with slow
    // breathing wave (~0.6-0.9 Hz), organic candle flicker, hover lift, and click flare.

    // 6. Character Soft Fill Light (Gentle warm front fill for expressions)
    this.charFillLight = new THREE.DirectionalLight(0xdce2f5, 0.32);
    this.charFillLight.position.set(0.5, 4.0, 8.5);
    this.scene.add(this.charFillLight);

    // 7. Purple Tree Lantern Warm Glow (Right side)
    this.purpleLanternLight = new THREE.PointLight(0xbe58ff, 1.4, 7.5, 2.0);
    this.purpleLanternLight.position.set(4.2, 3.2, 0.2);
    this.scene.add(this.purpleLanternLight);

    this.flickerLights.push({
      light: this.purpleLanternLight,
      baseIntensity: 1.4,
      flickerSpeed: 4.5,
      phase: 2.1
    });

    // 8. Ghost Subtle Glow Light (moves with ghost)
    this.ghostGlowLight = new THREE.PointLight(0xdbe6ff, 0.85, 4.5, 2.0);
    this.ghostGlowLight.position.set(2.2, 2.6, 2.3);
    this.scene.add(this.ghostGlowLight);

    // 9. Atmospheric Depth Fog
    this.scene.fog = new THREE.FogExp2(0x0c1226, 0.024);
  }

  setGhost(ghost) {
    this.ghost = ghost;
    this.updateGhostGlowPosition();
  }

  updateGhostGlowPosition() {
    if (!this.ghost || !this.ghost.group || !this.ghostGlowLight) return;

    this.ghost.group.getWorldPosition(this.ghostWorldPosition);
    this.ghostGlowLight.position.copy(this.ghostWorldPosition).add(this.ghostGlowOffset);
  }

  setLanternHovered(isHovered) {
    this.lanternHover.target = isHovered ? 1.0 : 0.0;
  }

  getLanternGlowFactor() {
    return this.lanternGlowFactor;
  }

  triggerLanternFlare() {
    // A fresh click extends the warm glow without causing an abrupt intensity
    // jump; the update loop handles the eased rise and decay.
    this.lanternFlare.target = 1;
    this.lanternFlare.hold = 0.24;
  }

  update(delta, elapsed) {
    // Main updates the ghost before lighting, so the glow follows the current
    // bob/drift/reaction position without a frame of spatial lag.
    this.updateGhostGlowPosition();

    // Hover brightness lift (~15% boost, smoothly lerped)
    const hoverRate = 6.0;
    this.lanternHover.amount += (this.lanternHover.target - this.lanternHover.amount) * Math.min(1, delta * hoverRate);

    // Click flare envelope
    if (this.lanternFlare.hold > 0) {
      this.lanternFlare.hold = Math.max(0, this.lanternFlare.hold - delta);
    } else {
      this.lanternFlare.target = 0;
    }

    const flareRate = this.lanternFlare.target > this.lanternFlare.amount ? 8 : 2.4;
    this.lanternFlare.amount += (this.lanternFlare.target - this.lanternFlare.amount) * Math.min(1, delta * flareRate);

    // 1. Layered slow breathing wave (~0.6 - 0.9 Hz, angular frequency ~4.6 rad/s)
    const breathWave = Math.sin(elapsed * 4.6) * 0.075 + Math.cos(elapsed * 2.8 + 0.7) * 0.045;

    // 2. Gentle organic candle flicker inside hollow
    const candleFlicker = Math.sin(elapsed * 13.5) * 0.035 + Math.cos(elapsed * 19.2) * 0.025 + Math.sin(elapsed * 31.0) * 0.015;

    const hoverFactor = 1.0 + this.lanternHover.amount * 0.15;
    const flareBoost = this.lanternFlare.amount * 1.35;

    // Expose normalized glow factor combining idle breathing, flicker, hover, and flare
    this.lanternGlowFactor = Math.max(0.4, (1.0 + breathWave + candleFlicker) * hoverFactor + flareBoost);

    // Tree hollow lantern point lights coordinated with slow breath, organic flicker, hover, and click flare
    if (this.treeLanternLight) {
      this.treeLanternLight.intensity = Math.max(0.4, (3.2 * (1.0 + breathWave + candleFlicker)) * hoverFactor + this.lanternFlare.amount * 1.85);
    }
    if (this.treeLanternBounce) {
      this.treeLanternBounce.intensity = Math.max(0.2, (1.2 * (1.0 + breathWave * 0.8 + candleFlicker * 0.6)) * hoverFactor + this.lanternFlare.amount * 0.75);
    }

    // Dynamic candle/lantern flicker for remaining lights (purple tree lantern)
    for (let i = 0; i < this.flickerLights.length; i++) {
      const fl = this.flickerLights[i];
      const noise = Math.sin(elapsed * fl.flickerSpeed + fl.phase) * 0.12 +
                    Math.cos(elapsed * (fl.flickerSpeed * 1.7) + fl.phase) * 0.08 +
                    (Math.random() - 0.5) * 0.05;
      fl.light.intensity = Math.max(0.2, fl.baseIntensity + noise);
    }
  }
}

window.DioramaLighting = DioramaLighting;

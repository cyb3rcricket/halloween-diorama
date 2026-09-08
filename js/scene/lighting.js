/**
 * Scene Lighting Setup matching the storybook nocturnal reference
 */

class DioramaLighting {
  constructor(scene) {
    this.scene = scene;
    this.flickerLights = [];

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
    this.moonLight.shadow.mapSize.width = 2048;
    this.moonLight.shadow.mapSize.height = 2048;
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
    this.treeLanternLight.shadow.mapSize.width = 512;
    this.treeLanternLight.shadow.mapSize.height = 512;
    this.treeLanternLight.shadow.bias = -0.002;
    this.scene.add(this.treeLanternLight);

    // Warm glow pooling down onto trunk flare and roots
    this.treeLanternBounce = new THREE.PointLight(0xff8818, 1.2, 6.0, 2.0);
    this.treeLanternBounce.position.set(-3.7, 1.5, 2.5);
    this.scene.add(this.treeLanternBounce);

    this.flickerLights.push({
      light: this.treeLanternLight,
      baseIntensity: 3.2,
      flickerSpeed: 7.0,
      phase: 0
    });
    this.flickerLights.push({
      light: this.treeLanternBounce,
      baseIntensity: 1.2,
      flickerSpeed: 7.0,
      phase: 0.5
    });

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

  update(delta, elapsed) {
    // Dynamic candle/lantern flicker
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

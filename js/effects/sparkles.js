/**
 * Floating Ambient Dust / Firefly Sparkles & Click Burst Effects
 */

class SparkleSystem {
  constructor(scene) {
    this.scene = scene;
    this.bursts = [];
    this.burstTexture = this.createParticleTexture(true);

    this.createAmbientFireflies();
  }

  // Generate a soft radial circular/star glow texture dynamically
  createParticleTexture(isStar = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const cx = 32, cy = 32;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 220, 140, 0.9)');
    grad.addColorStop(0.5, 'rgba(255, 170, 60, 0.35)');
    grad.addColorStop(1, 'rgba(255, 140, 40, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    if (isStar) {
      // Add subtle 4-point cross glint
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(32, 10); ctx.lineTo(32, 54);
      ctx.moveTo(10, 32); ctx.lineTo(54, 32);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createAmbientFireflies() {
    const count = 75;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread across the diorama scene bounds
      positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = 0.5 + Math.random() * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 + 1;

      scales[i] = 0.6 + Math.random() * 0.8;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.4 + Math.random() * 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.PointsMaterial({
      size: 0.35,
      map: this.createParticleTexture(true),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffd27d
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  // Spawn playful burst when clicked
  spawnBurst(origin, colorHex = 0xffd666, count = 18) {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;

      // Random spherical explosion velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 1.2 + Math.random() * 2.2;

      velocities.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        (Math.abs(Math.sin(phi) * Math.sin(theta)) + 0.4) * speed,
        Math.cos(phi) * speed
      ));
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.42,
      map: this.burstTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: colorHex,
      opacity: 1.0
    });

    const burstMesh = new THREE.Points(geom, mat);
    this.scene.add(burstMesh);

    this.bursts.push({
      mesh: burstMesh,
      velocities: velocities,
      life: 1.0,
      decay: 0.85
    });

    if (window.soundManager) {
      window.soundManager.playSparkle();
    }
  }

  update(delta, elapsed) {
    // Update ambient fireflies
    if (this.points) {
      const pos = this.points.geometry.attributes.position.array;
      const phases = this.points.geometry.attributes.phase.array;
      const speeds = this.points.geometry.attributes.speed.array;
      const count = pos.length / 3;

      for (let i = 0; i < count; i++) {
        // Subtle drift
        const speed = speeds[i];
        pos[i * 3 + 0] += Math.sin(elapsed * speed + phases[i]) * 0.005;
        pos[i * 3 + 1] += Math.cos(elapsed * speed * 0.8 + phases[i]) * 0.006;
        pos[i * 3 + 2] += Math.sin(elapsed * speed * 0.6 + phases[i]) * 0.004;

        // Loop if drifting too low or out of bounds
        if (pos[i * 3 + 1] < 0.2) pos[i * 3 + 1] = 6.5;
        if (pos[i * 3 + 1] > 7.5) pos[i * 3 + 1] = 0.5;
      }
      this.points.geometry.attributes.position.needsUpdate = true;
    }

    // Update burst particles
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life -= delta * b.decay;

      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        this.bursts.splice(i, 1);
        continue;
      }

      b.mesh.material.opacity = Math.max(0, b.life);
      const pos = b.mesh.geometry.attributes.position.array;

      for (let j = 0; j < b.velocities.length; j++) {
        const vel = b.velocities[j];
        pos[j * 3 + 0] += vel.x * delta;
        pos[j * 3 + 1] += vel.y * delta;
        pos[j * 3 + 2] += vel.z * delta;

        // Soft gravity & drag
        vel.y -= 2.5 * delta;
        vel.x *= 0.98;
        vel.z *= 0.98;
      }
      b.mesh.geometry.attributes.position.needsUpdate = true;
    }
  }
}

window.SparkleSystem = SparkleSystem;

/**
 * Sky, Full Moon with Atmospheric Glow, Twinkling Starfield, Clouds, and Flying Bats
 */

class SkySystem {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.bats = [];

    this.initSkyBackground();
    this.initMoon();
    this.initStars();
    this.initClouds();
    this.initBats();
  }

  // Large sky dome with nocturnal indigo/purple gradient
  initSkyBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#0a1026');   // Zenith dark midnight
    grad.addColorStop(0.35, '#131d45'); // Deep navy
    grad.addColorStop(0.7, '#1b2759');  // Royal indigo
    grad.addColorStop(1.0, '#242b5c');  // Horizon subtle purple-indigo

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const skyGeo = new THREE.SphereGeometry(60, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      fog: false
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  // Procedural Moon texture with lunar craters and warm golden halo
  createMoonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base warm moon cream
    ctx.fillStyle = '#fff7db';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle craters and lunar maria
    const craters = [
      { x: 180, y: 160, r: 65, alpha: 0.14 },
      { x: 260, y: 220, r: 90, alpha: 0.16 },
      { x: 330, y: 150, r: 50, alpha: 0.13 },
      { x: 210, y: 320, r: 75, alpha: 0.15 },
      { x: 340, y: 290, r: 60, alpha: 0.12 },
      { x: 140, y: 250, r: 45, alpha: 0.14 },
      { x: 280, y: 380, r: 40, alpha: 0.12 },
      { x: 200, y: 100, r: 35, alpha: 0.1 },
      { x: 380, y: 220, r: 30, alpha: 0.11 }
    ];

    craters.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r);
      grad.addColorStop(0, `rgba(200, 185, 150, ${c.alpha * 1.5})`);
      grad.addColorStop(0.7, `rgba(215, 200, 168, ${c.alpha})`);
      grad.addColorStop(1, 'rgba(255, 247, 219, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Small sharp rim craters
    const miniCraters = [
      { x: 150, y: 190, r: 16 },
      { x: 310, y: 260, r: 20 },
      { x: 230, y: 280, r: 14 },
      { x: 360, y: 180, r: 12 },
      { x: 190, y: 350, r: 18 },
      { x: 260, y: 140, r: 15 }
    ];

    miniCraters.forEach(c => {
      ctx.strokeStyle = 'rgba(180, 165, 135, 0.22)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(195, 180, 150, 0.15)';
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }

  initMoon() {
    this.moonGroup = new THREE.Group();
    this.baseMoonY = 8.2;
    // Positioned in upper right, completely framed inside camera view with generous headroom
    this.moonGroup.position.set(5.8, this.baseMoonY, -13.0);

    // 1. Moon 3D Sphere
    const moonGeo = new THREE.SphereGeometry(2.1, 36, 36);
    const moonMat = new THREE.MeshBasicMaterial({
      map: this.createMoonTexture(),
      fog: false
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.rotation.y = -Math.PI * 0.2;
    this.moonGroup.add(this.moonMesh);

    // 2. Warm golden atmospheric halo layers
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    const hctx = haloCanvas.getContext('2d');
    const hgrad = hctx.createRadialGradient(128, 128, 40, 128, 128, 124);
    hgrad.addColorStop(0, 'rgba(255, 245, 215, 0.85)');
    hgrad.addColorStop(0.25, 'rgba(255, 225, 160, 0.45)');
    hgrad.addColorStop(0.6, 'rgba(255, 195, 110, 0.18)');
    hgrad.addColorStop(1.0, 'rgba(255, 180, 80, 0)');
    hctx.fillStyle = hgrad;
    hctx.fillRect(0, 0, 256, 256);

    const haloTexture = new THREE.CanvasTexture(haloCanvas);

    // Inner bright halo
    const halo1Geo = new THREE.PlaneGeometry(7.5, 7.5);
    const halo1Mat = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    const halo1 = new THREE.Mesh(halo1Geo, halo1Mat);
    this.moonGroup.add(halo1);

    // Outer soft atmospheric glow
    const halo2Geo = new THREE.PlaneGeometry(13.5, 13.5);
    const halo2Mat = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.45,
      depthWrite: false,
      fog: false
    });
    const halo2 = new THREE.Mesh(halo2Geo, halo2Mat);
    halo2.position.z = -0.15;
    this.moonGroup.add(halo2);

    this.scene.add(this.moonGroup);
  }

  initStars() {
    const count = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    this.starFrequencies = new Float32Array(count);
    this.starPhases = new Float32Array(count);

    const colorWhite = new THREE.Color(0xffffff);
    const colorGold = new THREE.Color(0xfff1c2);
    const colorCyan = new THREE.Color(0xd2e5ff);

    for (let i = 0; i < count; i++) {
      // Semi-spherical distribution over sky
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.1); // Keep mostly above horizon
      const radius = 54 + Math.random() * 4;

      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.max(3, radius * Math.cos(phi));
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Random soft star colors
      const rColor = Math.random();
      const chosenColor = rColor < 0.45 ? colorWhite : (rColor < 0.75 ? colorGold : colorCyan);
      colors[i * 3 + 0] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;

      sizes[i] = 0.8 + Math.random() * 1.6;
      this.starFrequencies[i] = 1.2 + Math.random() * 3.5;
      this.starPhases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Star texture with glint
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const radGrad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.7)');
    radGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 64, 64);

    const starTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      map: starTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });

    this.starPoints = new THREE.Points(geometry, material);
    this.scene.add(this.starPoints);
  }

  // Soft stylized billowy night clouds drifting slowly
  initClouds() {
    this.cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0x1b234b,
      transparent: true,
      opacity: 0.65,
      fog: false
    });

    // Create 4 distinct cloud clusters
    const cloudPositions = [
      { x: -16, y: 13, z: -25, scale: 1.4, speed: 0.12 },
      { x: 16, y: 11, z: -22, scale: 1.2, speed: 0.09 },
      { x: -5, y: 17, z: -28, scale: 1.6, speed: 0.14 },
      { x: 8, y: 8, z: -18, scale: 1.0, speed: 0.11 }
    ];

    cloudPositions.forEach(cp => {
      const cluster = new THREE.Group();
      cluster.position.set(cp.x, cp.y, cp.z);
      cluster.scale.setScalar(cp.scale);

      // Assemble cloud from 4-6 overlapping flattened spheres
      const sphereGeo = new THREE.SphereGeometry(1.5, 12, 10);
      const offsets = [
        { x: 0, y: 0, z: 0, s: 1.0 },
        { x: -1.6, y: -0.2, z: 0.2, s: 0.75 },
        { x: 1.7, y: -0.1, z: -0.2, s: 0.8 },
        { x: -0.7, y: 0.5, z: 0.1, s: 0.7 },
        { x: 0.8, y: 0.4, z: -0.1, s: 0.65 }
      ];

      offsets.forEach(o => {
        const mesh = new THREE.Mesh(sphereGeo, cloudMat);
        mesh.position.set(o.x, o.y, o.z);
        mesh.scale.set(o.s * 1.5, o.s * 0.75, o.s);
        cluster.add(mesh);
      });

      this.cloudGroup.add(cluster);
      this.clouds.push({
        group: cluster,
        speed: cp.speed,
        baseX: cp.x
      });
    });

    this.scene.add(this.cloudGroup);
  }

  // 3 Distant flying bats flapping across the moonlit sky
  initBats() {
    this.batGroup = new THREE.Group();

    for (let i = 0; i < 3; i++) {
      const bat = this.createBatMesh();
      const config = {
        mesh: bat,
        center: new THREE.Vector3(2 + (i - 1) * 6, 12 + i * 1.2, -12 - i * 2),
        radiusX: 5.5 + i * 2,
        radiusZ: 2.5 + i * 1.2,
        speed: 0.7 + i * 0.2,
        flapSpeed: 10 + i * 2,
        offset: i * 2.1
      };
      this.bats.push(config);
      this.batGroup.add(bat);
    }

    this.scene.add(this.batGroup);
  }

  createBatMesh() {
    const bat = new THREE.Group();
    const batMat = new THREE.MeshBasicMaterial({ color: 0x12141a });

    // Little round bat body & head
    const bodyGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const bodyMesh = new THREE.Mesh(bodyGeo, batMat);
    bodyMesh.scale.set(1, 1.4, 0.9);
    bat.add(bodyMesh);

    // Cute bat ears
    const earGeo = new THREE.ConeGeometry(0.08, 0.18, 5);
    const earL = new THREE.Mesh(earGeo, batMat);
    earL.position.set(-0.1, 0.22, 0);
    earL.rotation.z = 0.3;
    const earR = new THREE.Mesh(earGeo, batMat);
    earR.position.set(0.1, 0.22, 0);
    earR.rotation.z = -0.3;
    bat.add(earL);
    bat.add(earR);

    // Left Wing
    const leftWingGroup = new THREE.Group();
    leftWingGroup.position.set(-0.14, 0.05, 0);
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(-0.4, 0.3, -0.85, 0.15);
    wingShape.quadraticCurveTo(-0.6, -0.15, -0.4, -0.1);
    wingShape.quadraticCurveTo(-0.25, -0.2, 0, 0);

    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const leftWing = new THREE.Mesh(wingGeo, batMat);
    leftWingGroup.add(leftWing);
    bat.add(leftWingGroup);

    // Right Wing
    const rightWingGroup = new THREE.Group();
    rightWingGroup.position.set(0.14, 0.05, 0);
    const rightWing = new THREE.Mesh(wingGeo, batMat);
    rightWing.scale.x = -1;
    rightWingGroup.add(rightWing);
    bat.add(rightWingGroup);

    bat.userData = { leftWingGroup, rightWingGroup };
    return bat;
  }

  update(delta, elapsed) {
    // 1. Gentle Moon float
    if (this.moonGroup) {
      this.moonGroup.position.y = this.baseMoonY + Math.sin(elapsed * 0.4) * 0.12;
    }

    // 2. Twinkling Stars
    if (this.starPoints) {
      const sizes = this.starPoints.geometry.attributes.size.array;
      for (let i = 0; i < sizes.length; i++) {
        const freq = this.starFrequencies[i];
        const phase = this.starPhases[i];
        sizes[i] = 1.0 + Math.sin(elapsed * freq + phase) * 0.6;
      }
      this.starPoints.geometry.attributes.size.needsUpdate = true;
    }

    // 3. Drifting Clouds
    this.clouds.forEach(c => {
      c.group.position.x += c.speed * delta;
      if (c.group.position.x > 32) {
        c.group.position.x = -32;
      }
    });

    // 4. Flying Bats
    this.bats.forEach(b => {
      const angle = elapsed * b.speed + b.offset;
      b.mesh.position.x = b.center.x + Math.sin(angle) * b.radiusX;
      b.mesh.position.z = b.center.z + Math.cos(angle) * b.radiusZ;
      b.mesh.position.y = b.center.y + Math.sin(angle * 2) * 0.6;

      // Rotate bat along trajectory
      b.mesh.rotation.y = -angle + Math.PI * 0.5;
      b.mesh.rotation.z = Math.cos(angle) * 0.3; // Banking

      // Flapping wings
      const flap = Math.sin(elapsed * b.flapSpeed) * 0.65;
      b.mesh.userData.leftWingGroup.rotation.z = flap;
      b.mesh.userData.rightWingGroup.rotation.z = -flap;
    });
  }
}

window.SkySystem = SkySystem;

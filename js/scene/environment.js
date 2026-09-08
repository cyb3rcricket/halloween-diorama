/**
 * Diorama Environment: Rolling Grassy Hill, 3 Stylized Iconic Trees,
 * Boulders, Fallen Leaves, Wildflowers, Grass Tufts, and Background Pines.
 * Closely matching the reference image media_1788830697549.jpg
 */

class DioramaEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.clickableLanterns = [];
    this.leafMeshes = [];
    this.ghost = null;
    this.ghostWorldPosition = new THREE.Vector3();
    this.ghostShadowGroundLift = 0.025;
    this.ghostShadowBaseScale = 1.0;
    this.ghostShadowBaseOpacity = 0.68;
    this.ghostShadowBaseHoverHeight = null;
    this.lighting = null;
    this.lanternHoverAmount = 0;
    this.lanternHoverTarget = 0;
    this.lanternFlareHold = 0;
    this.lanternFlareAmount = 0;
    this.lanternHalos = [];
    this.lanternCores = [];

    this.initMaterials();
    this.buildGroundHill();
    this.buildShadowDecals();   // Soft contact shadows for characters, trees, and boulders
    this.buildHeroTree();       // Left tree with glowing hollows & bat
    this.buildMiddleTree();     // Middle sage green tree
    this.buildPurpleTree();     // Right whimsical purple gourd tree
    this.buildBoulders();       // Foreground rounded stones
    this.buildFallenLeaves();   // Red, orange, yellow autumn leaves
    this.buildWildflowers();    // Tiny purple, white, yellow flowers
    this.buildGrassTufts();     // Stylized grass blade clumps
    this.buildBackgroundPines(); // Distant pine tree silhouettes
  }

  setLighting(lighting) {
    this.lighting = lighting;
  }

  setLanternHovered(isHovered) {
    this.lanternHoverTarget = isHovered ? 1.0 : 0.0;
    if (this.lighting && typeof this.lighting.setLanternHovered === 'function') {
      this.lighting.setLanternHovered(isHovered);
    }
  }

  triggerLanternFlare() {
    this.lanternFlareHold = 0.35;
    if (this.lighting && typeof this.lighting.triggerLanternFlare === 'function') {
      this.lighting.triggerLanternFlare();
    }
  }

  initMaterials() {
    // Rich deep nocturnal terrain material with vertex colors enabled
    this.terrainMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02
    });

    // Stylized grass blade tufts material
    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x224719,
      roughness: 0.92,
      metalness: 0.02
    });

    // Deep warm chocolate gnarled bark
    this.barkMat = new THREE.MeshStandardMaterial({
      color: 0x381f0f,
      roughness: 0.92,
      metalness: 0.04
    });

    // Darker carved wood cavity rim
    this.barkDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1a0d06,
      roughness: 0.96
    });

    // Left hero tree foliage (rich emerald moss green)
    this.heroFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x224c1a,
      roughness: 0.84,
      metalness: 0.02
    });

    // Middle tree foliage (sage/olive green)
    this.sageFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x3d542a,
      roughness: 0.85,
      metalness: 0.02
    });

    // Purple tree trunk & branches (deep plum violet bark)
    this.purpleBarkMat = new THREE.MeshStandardMaterial({
      color: 0x2e143c,
      roughness: 0.9,
      metalness: 0.04
    });

    // Purple tree gourd foliage (rich deep violet purple)
    this.purpleFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x481862,
      roughness: 0.8,
      metalness: 0.04
    });

    // Glowing hollow lantern core
    this.lanternCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffb833
    });

    // Foreground boulders/rocks
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x646975,
      roughness: 0.78,
      metalness: 0.06
    });

    // Autumn leaves materials (vibrant storybook colors)
    this.leafOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xff6200,
      roughness: 0.65,
      side: THREE.DoubleSide
    });

    this.leafRedMat = new THREE.MeshStandardMaterial({
      color: 0xd6281e,
      roughness: 0.65,
      side: THREE.DoubleSide
    });

    this.leafYellowMat = new THREE.MeshStandardMaterial({
      color: 0xffb315,
      roughness: 0.65,
      side: THREE.DoubleSide
    });
  }

  // Soft warm gold/amber radial glow halo texture for tree hollow lantern eyes
  createLanternHaloTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255, 224, 130, 0.95)');
    grad.addColorStop(0.28, 'rgba(255, 160, 40, 0.62)');
    grad.addColorStop(0.6, 'rgba(255, 110, 20, 0.24)');
    grad.addColorStop(0.85, 'rgba(255, 70, 10, 0.06)');
    grad.addColorStop(1, 'rgba(255, 40, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  // Accurate surface height calculation on the curved hill
  getHillHeight(x, z) {
    const dist = Math.sqrt(x * x + z * z);
    const dome = 1.35 * Math.cos(Math.min(dist, 11.0) * 0.14);
    const wave = Math.sin(x * 0.35) * Math.cos(z * 0.35) * 0.24;
    let h = (dome + wave - 0.45) - 0.3;
    if (dist > 10.5) {
      h -= Math.pow((dist - 10.5) / 2.8, 2.2) * 4.5;
    }
    return h;
  }

  // -------------------------------------------------------------
  // 1. Rolling Grassy Hill Mound (Circular Island Diorama)
  // -------------------------------------------------------------
  buildGroundHill() {
    const rings = 48;
    const sectors = 72;
    const maxRadius = 14.5;
    const skirtSteps = 4;

    const positions = [];
    const uvs = [];
    const colors = [];
    const indices = [];

    // Helper to calculate top surface vertex colors matching storybook nocturnal identity
    const baseDark = [0.1098, 0.2314, 0.0784]; // #1c3b14 rich nocturnal dark moss
    const baseRich = [0.1333, 0.2784, 0.0980]; // #224719 rich mid moss
    const crestColor = [0.1804, 0.3804, 0.1373]; // #2e6123 lighter/richer moss at crests
    const oliveBrown = [0.1569, 0.1333, 0.0784]; // #282214 earthy olive-brown
    const edgeDarkBrown = [0.1176, 0.0941, 0.0510]; // #1e180d deeper edge brown
    const heroGlow = [0.4471, 0.3294, 0.1412]; // #725424 warm golden amber lantern pooling
    const purpleGlow = [0.3373, 0.2275, 0.2275]; // #563a3a warm amber-violet pooling

    const lerpColorArr = (c1, c2, t) => [
      c1[0] + (c2[0] - c1[0]) * t,
      c1[1] + (c2[1] - c1[1]) * t,
      c1[2] + (c2[2] - c1[2]) * t
    ];

    const getTopColor = (x, y, z, radius) => {
      // 1. Elevation and subtle macro variation
      const heightT = Math.min(1.0, Math.max(0.0, (y - (-0.2)) / 1.1));
      const macroNoise = Math.sin(x * 0.35 + z * 0.3) * 0.03;
      let c = lerpColorArr(baseDark, baseRich, Math.min(1.0, Math.max(0.0, 0.45 + heightT * 0.4 + macroNoise)));

      // Lighter/richer moss green at higher elevations and crests
      if (heightT > 0.4) {
        c = lerpColorArr(c, crestColor, (heightT - 0.4) * 0.5);
      }

      // 2. Subtle warm tint near the hero tree lantern (x: -3.85, z: 2.1)
      const dHero = Math.hypot(x - (-3.85), z - 2.1);
      if (dHero < 4.6) {
        const poolHero = Math.pow(Math.max(0, 1.0 - dHero / 4.6), 1.6) * 0.35;
        c = lerpColorArr(c, heroGlow, poolHero);
      }

      // Subtle warm tint near the right purple tree lantern (x: 4.2, z: 0.2)
      const dPurple = Math.hypot(x - 4.2, z - 0.2);
      if (dPurple < 4.2) {
        const poolPurple = Math.pow(Math.max(0, 1.0 - dPurple / 4.2), 1.6) * 0.28;
        c = lerpColorArr(c, purpleGlow, poolPurple);
      }

      // 3. Edge transition: towards outer radius (r > 12.0), transition from moss green
      // to deeper earthy olive-brown (#282214 / #1e180d) to avoid an artificial sharp seam
      if (radius > 11.5) {
        const edgeT = Math.min(1.0, (radius - 11.5) / 3.0);
        const smoothEdge = edgeT * edgeT * (3.0 - 2.0 * edgeT);
        const targetEdge = lerpColorArr(oliveBrown, edgeDarkBrown, edgeT);
        c = lerpColorArr(c, targetEdge, smoothEdge);
      }

      return c;
    };

    // Center vertex
    const centerH = this.getHillHeight(0, 0);
    positions.push(0, centerH, 0);
    uvs.push(0.5, 0.5);
    colors.push(...getTopColor(0, centerH, 0, 0));

    // Radial concentric rings
    for (let r = 1; r <= rings; r++) {
      const radius = (r / rings) * maxRadius;
      for (let s = 0; s < sectors; s++) {
        const theta = (s / sectors) * Math.PI * 2;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        const y = this.getHillHeight(x, z);

        positions.push(x, y, z);
        uvs.push((x / (maxRadius * 2)) + 0.5, (z / (maxRadius * 2)) + 0.5);
        colors.push(...getTopColor(x, y, z, radius));
      }
    }

    // Inner fan connecting ring 1 to center
    for (let s = 0; s < sectors; s++) {
      const nextS = (s + 1) % sectors;
      indices.push(0, 1 + s, 1 + nextS);
    }

    // Intermediate concentric rings
    for (let r = 1; r < rings; r++) {
      const innerStart = 1 + (r - 1) * sectors;
      const outerStart = 1 + r * sectors;

      for (let s = 0; s < sectors; s++) {
        const nextS = (s + 1) % sectors;

        const i0 = innerStart + s;
        const i1 = innerStart + nextS;
        const o0 = outerStart + s;
        const o1 = outerStart + nextS;

        indices.push(i0, o0, o1);
        indices.push(i0, o1, i1);
      }
    }

    // Island Edge / Underside (skirt):
    // Transition from the rim downward to y = -5.0 with dark rich earth brown (#241910),
    // mid skirt muted slate/strata (#181720), and bottom deep midnight shadow (#080a14)
    // with subtle organic perimeter strata variation for a miniature diorama cross-section.
    const skirtTopColor = [0.1412, 0.0980, 0.0627]; // #241910
    const skirtMidColor = [0.0941, 0.0902, 0.1255]; // #181720
    const skirtBotColor = [0.0314, 0.0392, 0.0784]; // #080a14

    let previousRingStart = 1 + (rings - 1) * sectors;
    for (let step = 1; step <= skirtSteps; step++) {
      const v = step / skirtSteps;
      const stepStart = positions.length / 3;

      const cSkirt = v < 0.45 ? lerpColorArr(skirtTopColor, skirtMidColor, v / 0.45)
                              : lerpColorArr(skirtMidColor, skirtBotColor, (v - 0.45) / 0.55);

      for (let s = 0; s < sectors; s++) {
        const theta = (s / sectors) * Math.PI * 2;
        const rimX = Math.cos(theta) * maxRadius;
        const rimZ = Math.sin(theta) * maxRadius;
        const rimY = this.getHillHeight(rimX, rimZ);

        const y = rimY + (-5.0 - rimY) * v;
        const strataNoise = Math.sin(theta * 6.0 + v * 3.5) * 0.18 + Math.cos(theta * 9.0) * 0.12;
        const taper = 1.0 - 0.08 * v;
        const skirtRadius = (maxRadius + strataNoise) * taper;
        const x = Math.cos(theta) * skirtRadius;
        const z = Math.sin(theta) * skirtRadius;

        positions.push(x, y, z);
        uvs.push((x / (maxRadius * 2)) + 0.5, (z / (maxRadius * 2)) + 0.5);
        colors.push(...cSkirt);
      }

      for (let s = 0; s < sectors; s++) {
        const nextS = (s + 1) % sectors;
        const top0 = previousRingStart + s;
        const top1 = previousRingStart + nextS;
        const bot0 = stepStart + s;
        const bot1 = stepStart + nextS;

        indices.push(top0, bot0, bot1);
        indices.push(top0, bot1, top1);
      }

      previousRingStart = stepStart;
    }

    const groundGeo = new THREE.BufferGeometry();
    groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    groundGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    groundGeo.setIndex(indices);
    groundGeo.computeVertexNormals();

    this.groundMesh = new THREE.Mesh(groundGeo, this.terrainMat);
    this.groundMesh.position.set(0, 0, 0);
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  // Soft radial shadow texture generator (reused across all scene contact shadows)
  createShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    grad.addColorStop(0, 'rgba(8, 14, 8, 1.0)');
    grad.addColorStop(0.35, 'rgba(8, 14, 8, 0.78)');
    grad.addColorStop(0.65, 'rgba(8, 14, 8, 0.35)');
    grad.addColorStop(0.85, 'rgba(8, 14, 8, 0.12)');
    grad.addColorStop(1, 'rgba(8, 14, 8, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  // -------------------------------------------------------------
  // Contact Shadows for Characters, Iconic Trees, and Boulders
  // -------------------------------------------------------------
  buildShadowDecals() {
    this.shadowsGroup = new THREE.Group();
    const shadowTexture = this.createShadowTexture();

    const addDecal = (x, z, width, length, opacity, yOffset = 0.025, rotY = 0) => {
      const geo = new THREE.PlaneGeometry(width, length);
      geo.rotateX(-Math.PI * 0.5);
      const mat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
        opacity: opacity
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, this.getHillHeight(x, z) + yOffset, z);
      if (rotY !== 0) mesh.rotation.y = rotY;
      this.shadowsGroup.add(mesh);
      return mesh;
    };

    // 1. Cat Contact Shadow Decal (Paws seated on grass)
    const catShadowGeo = new THREE.PlaneGeometry(1.65, 1.45);
    catShadowGeo.rotateX(-Math.PI * 0.5);
    const catShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.88
    });
    this.catShadow = new THREE.Mesh(catShadowGeo, catShadowMat);
    const catY = this.getHillHeight(-0.95, 3.2) + 0.025;
    this.catShadow.position.set(-0.95, catY, 3.2);
    this.catShadow.rotation.y = 0.2;
    this.shadowsGroup.add(this.catShadow);

    // 2. Ghost Soft Hover Shadow Decal (Dynamic height scaling in updateGhostShadow)
    const ghostShadowGeo = new THREE.PlaneGeometry(2.3, 2.3);
    ghostShadowGeo.rotateX(-Math.PI * 0.5);
    this.ghostShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.68
    });
    this.ghostShadow = new THREE.Mesh(ghostShadowGeo, this.ghostShadowMat);
    const ghostY = this.getHillHeight(2.2, 2.3) + this.ghostShadowGroundLift;
    this.ghostShadow.position.set(2.2, ghostY, 2.3);
    this.shadowsGroup.add(this.ghostShadow);

    // 3. Hero Tree / Root Mass:
    // Broad subtle root-zone shadow decal (radius ~4.8 -> 9.6 x 9.6, opacity ~0.52)
    addDecal(-4.0, 0.4, 9.6, 9.6, 0.52, 0.024);
    // Localized trunk core contact patch (radius ~2.4 -> 4.8 x 4.8, opacity ~0.40) centered under main root flares
    addDecal(-3.95, 0.4, 4.8, 4.8, 0.40, 0.026);

    // 4. Purple Tree:
    // Soft grounding decal under trunk base (x: 4.2, z: 0.4, scale ~3.8 x 3.5, opacity ~0.48)
    addDecal(4.2, 0.4, 3.8, 3.5, 0.48, 0.025);

    // 5. Middle Tree:
    // Soft grounding decal under trunk base (x: 0.8, z: -0.6, scale ~2.4 x 2.2, opacity ~0.42)
    addDecal(0.8, -0.6, 2.4, 2.2, 0.42, 0.025);

    // 6. Foreground Boulders / Rock Clusters:
    // Left boulder cluster (x: -2.1, z: 4.3, scale ~2.0 x 1.4, opacity ~0.42)
    addDecal(-2.1, 4.3, 2.0, 1.4, 0.42, 0.025, 0.35);
    // Right boulder cluster (x: 2.2, z: 3.8, scale ~2.4 x 1.6, opacity ~0.42)
    addDecal(2.2, 3.8, 2.4, 1.6, 0.42, 0.025, -0.4);

    this.scene.add(this.shadowsGroup);
  }

  setGhost(ghost) {
    this.ghost = ghost;
    this.ghostShadowBaseHoverHeight = null;
    this.updateGhostShadow();
  }

  updateGhostShadow() {
    if (!this.ghostShadow || !this.ghost || !this.ghost.group) return;

    this.ghost.group.getWorldPosition(this.ghostWorldPosition);
    const x = this.ghostWorldPosition.x;
    const z = this.ghostWorldPosition.z;
    const groundY = this.getHillHeight(x, z) + this.ghostShadowGroundLift;
    const hoverHeight = Math.max(0, this.ghostWorldPosition.y - groundY);

    if (this.ghostShadowBaseHoverHeight === null) {
      this.ghostShadowBaseHoverHeight = hoverHeight;
    }

    // Keep the response subtle: a higher ghost spreads and fades its decal,
    // while a lower ghost tightens and darkens it around the terrain contact.
    const heightDelta = hoverHeight - this.ghostShadowBaseHoverHeight;
    const scale = THREE.MathUtils.clamp(this.ghostShadowBaseScale * (1 + heightDelta * 0.1), 0.82, 1.2);
    const opacity = THREE.MathUtils.clamp(this.ghostShadowBaseOpacity - heightDelta * 0.05, 0.45, 0.78);
    this.ghostShadow.position.set(x, groundY, z);
    this.ghostShadow.scale.setScalar(scale);
    this.ghostShadowMat.opacity = opacity;
  }

  // -------------------------------------------------------------
  // 2. Left Hero Tree (With Carved Glowing Lantern Hollows & Bat)
  // -------------------------------------------------------------
  buildHeroTree() {
    this.heroTreeGroup = new THREE.Group();
    this.heroTreeGroup.position.set(-4.0, 0.25, 0.4);

    // Gnarled Trunk with flared base (high resolution smooth bark)
    const trunkGeo = new THREE.CylinderGeometry(1.2, 2.35, 4.4, 48, 20);
    const tpos = trunkGeo.attributes.position.array;
    for (let i = 0; i < tpos.length; i += 3) {
      const y = tpos[i + 1];
      const angle = Math.atan2(tpos[i + 2], tpos[i]);
      const radius = Math.sqrt(tpos[i] * tpos[i] + tpos[i + 2] * tpos[i + 2]);

      // Vertical woody ridges & bark waves
      const groove = Math.sin(angle * 8) * 0.12 + Math.cos(angle * 4 + y * 1.5) * 0.08;
      const flare = y < -0.6 ? Math.pow(Math.abs(y + 0.6) / 1.5, 2.2) * 0.7 : 0;

      const newR = radius + groove + flare;
      tpos[i] = Math.cos(angle) * newR;
      tpos[i + 2] = Math.sin(angle) * newR;
    }
    trunkGeo.computeVertexNormals();

    const trunkMesh = new THREE.Mesh(trunkGeo, this.barkMat);
    trunkMesh.position.y = 2.1;
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    this.heroTreeGroup.add(trunkMesh);

    // Sprawling root buttresses
    const rootAngles = [0.15, 1.35, 2.6, 3.8, 5.0];
    rootAngles.forEach(ang => {
      const rootPoints = [
        new THREE.Vector3(Math.cos(ang) * 1.5, 0.9, Math.sin(ang) * 1.5),
        new THREE.Vector3(Math.cos(ang) * 2.3, 0.28, Math.sin(ang) * 2.3),
        new THREE.Vector3(Math.cos(ang) * 3.2, -0.15, Math.sin(ang) * 3.2)
      ];
      const rootCurve = new THREE.CatmullRomCurve3(rootPoints);
      const rootGeo = new THREE.TubeGeometry(rootCurve, 16, 0.4, 10, false);
      const rootMesh = new THREE.Mesh(rootGeo, this.barkMat);
      rootMesh.castShadow = true;
      rootMesh.receiveShadow = true;
      this.heroTreeGroup.add(rootMesh);
    });

    // ---------------------------------------------------------
    // Two Carved Glowing Lantern Hollow Eyes in Upper Trunk!
    // ---------------------------------------------------------
    if (!this.haloTexture) {
      this.haloTexture = this.createLanternHaloTexture();
    }

    const lanternGroup = new THREE.Group();
    // Positioned front and center of upper trunk facing viewer
    lanternGroup.position.set(0.1, 2.75, 1.48);

    const createHollowEye = (isLeft) => {
      const eyeHollow = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Outer carved wooden lip frame
      const frameGeo = new THREE.TorusGeometry(0.28, 0.08, 14, 24);
      frameGeo.scale(0.9, 1.25, 0.6);
      const frame = new THREE.Mesh(frameGeo, this.barkDarkMat);
      frame.rotation.z = sign * -0.22;
      eyeHollow.add(frame);

      // Dark cavity backing
      const backGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16);
      backGeo.rotateX(Math.PI * 0.5);
      backGeo.scale(0.85, 1.2, 1.0);
      const back = new THREE.Mesh(backGeo, this.barkDarkMat);
      back.position.z = -0.04;
      eyeHollow.add(back);

      // Warm glowing flame core (spherical lantern bulb)
      const coreGeo = new THREE.SphereGeometry(0.18, 16, 14);
      coreGeo.scale(0.85, 1.25, 0.7);
      const core = new THREE.Mesh(coreGeo, this.lanternCoreMat);
      core.position.z = 0.04;
      eyeHollow.add(core);

      // Soft warm radial glow halo plane behind/around hollow eye
      const haloGeo = new THREE.PlaneGeometry(0.85, 1.15);
      const haloMat = new THREE.MeshBasicMaterial({
        map: this.haloTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.58,
        color: 0xffcc44
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.z = 0.07;
      eyeHollow.add(halo);

      this.lanternHalos.push(halo);
      this.lanternCores.push(core);

      eyeHollow.position.set(sign * 0.46, 0, 0);
      eyeHollow.rotation.y = sign * 0.16;
      return eyeHollow;
    };

    lanternGroup.add(createHollowEye(true));
    lanternGroup.add(createHollowEye(false));

    lanternGroup.userData.isLantern = true;
    lanternGroup.traverse(c => {
      if (c.isMesh) {
        c.userData.isLantern = true;
        this.clickableLanterns.push(c);
      }
    });

    this.heroTreeGroup.add(lanternGroup);

    // ---------------------------------------------------------
    // Gnarled Upward Branches & Perched Bat Branch
    // ---------------------------------------------------------
    const branchConfigs = [
      { start: [0, 3.8, 0], end: [-1.4, 5.4, 0.6], rad: 0.3 },
      { start: [0, 3.9, 0], end: [1.3, 5.2, 0.5], rad: 0.28 },
      { start: [0, 4.0, 0], end: [-0.3, 5.8, -0.8], rad: 0.3 },
      { start: [0, 3.7, 0], end: [0.8, 5.0, -0.7], rad: 0.25 },
      // Distinct branch for the perched bat (matching reference!)
      { start: [0.6, 4.0, 0.3], end: [1.6, 4.75, 0.9], rad: 0.16 }
    ];

    branchConfigs.forEach(bc => {
      const bCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(...bc.start),
        new THREE.Vector3(
          (bc.start[0] + bc.end[0]) * 0.5,
          (bc.start[1] + bc.end[1]) * 0.5 + 0.05,
          (bc.start[2] + bc.end[2]) * 0.5
        ),
        new THREE.Vector3(...bc.end)
      ]);
      const bGeo = new THREE.TubeGeometry(bCurve, 12, bc.rad, 8, false);
      const bMesh = new THREE.Mesh(bGeo, this.barkMat);
      bMesh.castShadow = true;
      this.heroTreeGroup.add(bMesh);
    });

    // ---------------------------------------------------------
    // Puffy Cloud-Like Foliage Clumps (Smooth Organic Spheres)
    // ---------------------------------------------------------
    const foliageClusters = [
      { x: -1.6, y: 5.2, z: 0.4, s: 1.55 },
      { x: 1.4, y: 5.1, z: 0.3, s: 1.45 },
      { x: 0, y: 5.8, z: 0, s: 1.85 },
      { x: -0.8, y: 5.9, z: -0.7, s: 1.4 },
      { x: 0.9, y: 5.6, z: -0.6, s: 1.35 },
      { x: -1.8, y: 4.5, z: 0.6, s: 1.2 },
      { x: 1.6, y: 4.4, z: 0.6, s: 1.15 }
    ];

    foliageClusters.forEach(fc => {
      // Smooth deformed cloud sphere
      const clumpGeo = new THREE.SphereGeometry(fc.s, 28, 22);
      const cpos = clumpGeo.attributes.position.array;
      for (let i = 0; i < cpos.length; i += 3) {
        const vx = cpos[i], vy = cpos[i + 1], vz = cpos[i + 2];
        const disp = (Math.sin(vx * 2.5) + Math.cos(vy * 2.5) + Math.sin(vz * 2.5)) * 0.08;
        cpos[i] += vx * disp;
        cpos[i + 1] += vy * disp;
        cpos[i + 2] += vz * disp;
      }
      clumpGeo.computeVertexNormals();

      const clumpMesh = new THREE.Mesh(clumpGeo, this.heroFoliageMat);
      clumpMesh.position.set(fc.x, fc.y, fc.z);
      clumpMesh.castShadow = true;
      clumpMesh.receiveShadow = true;
      this.heroTreeGroup.add(clumpMesh);

      // Place bright orange autumn leaves on foliage clumps
      for (let l = 0; l < 3; l++) {
        const leaf = this.createMapleLeafMesh(this.leafOrangeMat, 0.42);
        leaf.position.set(
          fc.x + (Math.random() - 0.5) * fc.s * 1.1,
          fc.y + (Math.random() - 0.2) * fc.s * 0.8,
          fc.z + fc.s * 0.85
        );
        leaf.rotation.set(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.6,
          Math.random() * Math.PI * 2
        );
        this.heroTreeGroup.add(leaf);
      }
    });

    // ---------------------------------------------------------
    // Cute Perched Bat on branch (matching reference image!)
    // ---------------------------------------------------------
    const perchedBat = this.createPerchedBat();
    perchedBat.position.set(1.5, 4.8, 0.9);
    perchedBat.rotation.set(0.1, -0.2, 0.05);
    perchedBat.scale.setScalar(1.3);
    this.heroTreeGroup.add(perchedBat);

    this.scene.add(this.heroTreeGroup);
  }

  createPerchedBat() {
    const batGroup = new THREE.Group();
    const batMat = new THREE.MeshStandardMaterial({
      color: 0x14161f,
      roughness: 0.8
    });

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.24, 14, 12);
    bodyGeo.scale(0.9, 1.3, 0.8);
    const body = new THREE.Mesh(bodyGeo, batMat);
    batGroup.add(body);

    // Cute ears
    const earGeo = new THREE.ConeGeometry(0.1, 0.24, 6);
    const earL = new THREE.Mesh(earGeo, batMat);
    earL.position.set(-0.12, 0.32, 0);
    earL.rotation.z = 0.25;
    const earR = new THREE.Mesh(earGeo, batMat);
    earR.position.set(0.12, 0.32, 0);
    earR.rotation.z = -0.25;
    batGroup.add(earL);
    batGroup.add(earR);

    // Little white eyes
    const eyeGeo = new THREE.SphereGeometry(0.042, 10, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 0.1, 0.18);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 0.1, 0.18);
    batGroup.add(eyeL);
    batGroup.add(eyeR);

    // Spread wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(-0.4, 0.35, -0.95, 0.25);
    wingShape.quadraticCurveTo(-0.7, -0.2, -0.45, -0.15);
    wingShape.quadraticCurveTo(-0.25, -0.3, 0, 0);

    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const leftWing = new THREE.Mesh(wingGeo, batMat);
    leftWing.position.set(-0.18, 0.05, 0);
    leftWing.rotation.y = 0.2;
    batGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, batMat);
    rightWing.position.set(0.18, 0.05, 0);
    rightWing.scale.x = -1;
    rightWing.rotation.y = -0.2;
    batGroup.add(rightWing);

    return batGroup;
  }

  // -------------------------------------------------------------
  // 3. Middle Tree (Sage Green Midground Tree)
  // -------------------------------------------------------------
  buildMiddleTree() {
    this.middleTreeGroup = new THREE.Group();
    this.middleTreeGroup.position.set(0.9, 0.1, -4.2);
    this.middleTreeGroup.scale.setScalar(0.85);

    // Gnarled slender trunk
    const trunkGeo = new THREE.CylinderGeometry(0.7, 1.4, 3.8, 32, 14);
    const tpos = trunkGeo.attributes.position.array;
    for (let i = 0; i < tpos.length; i += 3) {
      const y = tpos[i + 1];
      const angle = Math.atan2(tpos[i + 2], tpos[i]);
      const radius = Math.sqrt(tpos[i] * tpos[i] + tpos[i + 2] * tpos[i + 2]);
      const groove = Math.sin(angle * 5) * 0.08;
      const flare = y < -0.6 ? Math.pow(Math.abs(y + 0.6) / 1.3, 2) * 0.35 : 0;
      tpos[i] = Math.cos(angle) * (radius + groove + flare);
      tpos[i + 2] = Math.sin(angle) * (radius + groove + flare);
    }
    trunkGeo.computeVertexNormals();

    const trunkMesh = new THREE.Mesh(trunkGeo, this.barkMat);
    trunkMesh.position.y = 1.9;
    trunkMesh.castShadow = true;
    this.middleTreeGroup.add(trunkMesh);

    // Branches
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.8, 10), this.barkMat);
    b1.position.set(-0.6, 3.4, 0.2);
    b1.rotation.z = 0.5;
    this.middleTreeGroup.add(b1);

    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 10), this.barkMat);
    b2.position.set(0.6, 3.5, -0.1);
    b2.rotation.z = -0.45;
    this.middleTreeGroup.add(b2);

    // Sage Green Foliage Puffs (Smooth Organic Spheres)
    const sageClusters = [
      { x: 0, y: 4.6, z: 0, s: 1.4 },
      { x: -0.9, y: 4.1, z: 0.3, s: 1.1 },
      { x: 0.8, y: 4.2, z: -0.2, s: 1.15 },
      { x: 0.1, y: 3.8, z: 0.6, s: 0.95 }
    ];

    sageClusters.forEach(sc => {
      const cGeo = new THREE.SphereGeometry(sc.s, 24, 18);
      const cpos = cGeo.attributes.position.array;
      for (let i = 0; i < cpos.length; i += 3) {
        const vx = cpos[i], vy = cpos[i + 1], vz = cpos[i + 2];
        const disp = (Math.sin(vx * 3) + Math.cos(vy * 3)) * 0.07;
        cpos[i] += vx * disp;
        cpos[i + 1] += vy * disp;
        cpos[i + 2] += vz * disp;
      }
      cGeo.computeVertexNormals();

      const cMesh = new THREE.Mesh(cGeo, this.sageFoliageMat);
      cMesh.position.set(sc.x, sc.y, sc.z);
      cMesh.castShadow = true;
      this.middleTreeGroup.add(cMesh);
    });

    this.scene.add(this.middleTreeGroup);
  }

  // -------------------------------------------------------------
  // 4. Right Whimsical Purple Gourd Tree
  // -------------------------------------------------------------
  buildPurpleTree() {
    this.purpleTreeGroup = new THREE.Group();
    this.purpleTreeGroup.position.set(4.8, 0.1, -1.0);

    // Sculpted purple trunk with organic flare
    const trunkGeo = new THREE.CylinderGeometry(0.9, 1.9, 4.4, 32, 16);
    const tpos = trunkGeo.attributes.position.array;
    for (let i = 0; i < tpos.length; i += 3) {
      const y = tpos[i + 1];
      const angle = Math.atan2(tpos[i + 2], tpos[i]);
      const radius = Math.sqrt(tpos[i] * tpos[i] + tpos[i + 2] * tpos[i + 2]);
      const groove = Math.sin(angle * 6) * 0.1;
      const flare = y < -0.7 ? Math.pow(Math.abs(y + 0.7) / 1.4, 2) * 0.5 : 0;
      tpos[i] = Math.cos(angle) * (radius + groove + flare);
      tpos[i + 2] = Math.sin(angle) * (radius + groove + flare);
    }
    trunkGeo.computeVertexNormals();

    const trunkMesh = new THREE.Mesh(trunkGeo, this.purpleBarkMat);
    trunkMesh.position.y = 2.1;
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    this.purpleTreeGroup.add(trunkMesh);

    // Purple root buttresses
    [0.4, 1.8, 3.2, 4.8].forEach(ang => {
      const rPoints = [
        new THREE.Vector3(Math.cos(ang) * 1.3, 0.7, Math.sin(ang) * 1.3),
        new THREE.Vector3(Math.cos(ang) * 2.0, 0.2, Math.sin(ang) * 2.0),
        new THREE.Vector3(Math.cos(ang) * 2.7, -0.1, Math.sin(ang) * 2.7)
      ];
      const rCurve = new THREE.CatmullRomCurve3(rPoints);
      const rGeo = new THREE.TubeGeometry(rCurve, 10, 0.32, 8, false);
      const rMesh = new THREE.Mesh(rGeo, this.purpleBarkMat);
      rMesh.castShadow = true;
      this.purpleTreeGroup.add(rMesh);
    });

    // Purple Branches reaching out
    const pBranches = [
      { start: [0, 3.8, 0], end: [-1.2, 5.0, 0.5], rad: 0.26 },
      { start: [0, 3.9, 0], end: [1.2, 4.9, 0.4], rad: 0.25 },
      { start: [0, 4.1, 0], end: [0, 5.4, -0.7], rad: 0.28 }
    ];

    pBranches.forEach(pb => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(...pb.start),
        new THREE.Vector3(...pb.end)
      ]);
      const bGeo = new THREE.TubeGeometry(curve, 10, pb.rad, 8, false);
      const bMesh = new THREE.Mesh(bGeo, this.purpleBarkMat);
      bMesh.castShadow = true;
      this.purpleTreeGroup.add(bMesh);
    });

    // ---------------------------------------------------------
    // Pumpkin / Gourd-Shaped Purple Foliage Clusters
    // ---------------------------------------------------------
    const createGourdFoliage = (radius, ribCount = 8) => {
      const gourdGeo = new THREE.SphereGeometry(radius, 32, 24);
      gourdGeo.scale(1.15, 0.92, 1.15); // Flattened pumpkin shape
      const pos = gourdGeo.attributes.position.array;

      // Add vertical ribs like pumpkin/gourd ridges
      for (let i = 0; i < pos.length; i += 3) {
        const angle = Math.atan2(pos[i + 2], pos[i]);
        const r = Math.sqrt(pos[i] * pos[i] + pos[i + 2] * pos[i + 2]);
        const rib = Math.sin(angle * ribCount) * 0.12 * radius;
        pos[i] = Math.cos(angle) * (r + rib);
        pos[i + 2] = Math.sin(angle) * (r + rib);
      }
      gourdGeo.computeVertexNormals();

      return new THREE.Mesh(gourdGeo, this.purpleFoliageMat);
    };

    const purpleClusters = [
      { x: 0, y: 5.4, z: 0, r: 1.65 },
      { x: -1.3, y: 4.7, z: 0.4, r: 1.35 },
      { x: 1.3, y: 4.6, z: 0.3, r: 1.3 },
      { x: 0, y: 4.8, z: -0.9, r: 1.25 },
      { x: -0.8, y: 4.1, z: 0.8, r: 0.95 },
      { x: 0.9, y: 4.0, z: 0.7, r: 0.9 }
    ];

    purpleClusters.forEach(pc => {
      const gMesh = createGourdFoliage(pc.r);
      gMesh.position.set(pc.x, pc.y, pc.z);
      gMesh.castShadow = true;
      gMesh.receiveShadow = true;
      this.purpleTreeGroup.add(gMesh);
    });

    // ---------------------------------------------------------
    // Hanging Mini Purple Gourds / Lanterns
    // ---------------------------------------------------------
    const hangingSpots = [
      { x: -1.5, y: 3.4, z: 0.6 },
      { x: 1.4, y: 3.3, z: 0.5 },
      { x: -0.4, y: 3.1, z: 1.1 }
    ];

    hangingSpots.forEach(hs => {
      const hangingGroup = new THREE.Group();
      hangingGroup.position.set(hs.x, hs.y, hs.z);

      // Delicate curved stem/string
      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.45, 0),
        new THREE.Vector3(0.04, 0.25, 0.02),
        new THREE.Vector3(0, 0, 0)
      ]);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 6, 0.025, 6, false);
      const stemMesh = new THREE.Mesh(stemGeo, this.purpleBarkMat);
      hangingGroup.add(stemMesh);

      // Mini ribbed gourd
      const miniGourd = createGourdFoliage(0.32, 6);
      miniGourd.scale.set(0.8, 1.25, 0.8);
      miniGourd.position.y = -0.32;
      hangingGroup.add(miniGourd);

      this.purpleTreeGroup.add(hangingGroup);
    });

    this.scene.add(this.purpleTreeGroup);
  }

  // -------------------------------------------------------------
  // 5. Rounded Smooth Slate Gray Boulders & River Stones
  // -------------------------------------------------------------
  buildBoulders() {
    this.boulderGroup = new THREE.Group();

    // Prominent stone clusters matching reference foreground & tree bases
    const stoneClusters = [
      // Foreground Center-Left Cluster (in front of cat)
      { x: -1.7, z: 4.2, s: [0.65, 0.45, 0.55], rot: 0.4 },
      { x: -1.2, z: 4.5, s: [0.45, 0.35, 0.4], rot: -0.3 },

      // Foreground Right Cluster
      { x: 2.4, z: 3.8, s: [0.75, 0.52, 0.65], rot: 0.6 },
      { x: 3.1, z: 4.0, s: [0.48, 0.34, 0.42], rot: -0.5 },

      // Hero Tree Base Cluster
      { x: -5.2, z: 2.2, s: [0.62, 0.42, 0.52], rot: 0.2 },
      { x: -4.6, z: 2.8, s: [0.42, 0.3, 0.36], rot: -0.4 },

      // Purple Tree Base Cluster
      { x: 4.2, z: 1.2, s: [0.55, 0.38, 0.48], rot: 0.8 },
      { x: 4.8, z: 1.6, s: [0.38, 0.26, 0.32], rot: -0.3 }
    ];

    stoneClusters.forEach(sc => {
      // Smooth organic sphere for rounded river rock
      const geo = new THREE.SphereGeometry(1.0, 24, 18);
      const pos = geo.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const d = (Math.sin(pos[i] * 3) + Math.cos(pos[i + 1] * 3) + Math.sin(pos[i + 2] * 3)) * 0.06;
        pos[i] += pos[i] * d;
        pos[i + 1] += pos[i + 1] * d;
        pos[i + 2] += pos[i + 2] * d;
      }
      geo.computeVertexNormals();

      const stoneMesh = new THREE.Mesh(geo, this.rockMat);
      const y = this.getHillHeight(sc.x, sc.z) + sc.s[1] * 0.45;
      stoneMesh.position.set(sc.x, y, sc.z);
      stoneMesh.scale.set(...sc.s);
      stoneMesh.rotation.y = sc.rot;
      stoneMesh.castShadow = true;
      stoneMesh.receiveShadow = true;
      this.boulderGroup.add(stoneMesh);
    });

    this.scene.add(this.boulderGroup);
  }

  // -------------------------------------------------------------
  // 6. Stylized Fallen Maple Autumn Leaves
  // -------------------------------------------------------------
  createMapleLeafMesh(material, scale = 0.35) {
    const leafShape = new THREE.Shape();
    // 5-pointed maple leaf silhouette
    leafShape.moveTo(0, -0.4);
    leafShape.lineTo(0.08, -0.15);
    leafShape.lineTo(0.35, -0.2); // Lower-right lobe
    leafShape.lineTo(0.22, 0.05);
    leafShape.lineTo(0.5, 0.25);  // Mid-right lobe
    leafShape.lineTo(0.22, 0.32);
    leafShape.lineTo(0.32, 0.65); // Top-right tip
    leafShape.lineTo(0.12, 0.55);
    leafShape.lineTo(0, 0.85);    // Center top tip
    leafShape.lineTo(-0.12, 0.55);
    leafShape.lineTo(-0.32, 0.65); // Top-left tip
    leafShape.lineTo(-0.22, 0.32);
    leafShape.lineTo(-0.5, 0.25);  // Mid-left lobe
    leafShape.lineTo(-0.22, 0.05);
    leafShape.lineTo(-0.35, -0.2); // Lower-left lobe
    leafShape.lineTo(-0.08, -0.15);
    leafShape.closePath();

    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const pos = leafGeo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const r = Math.sqrt(pos[i] * pos[i] + pos[i + 1] * pos[i + 1]);
      pos[i + 2] = -r * r * 0.12;
    }
    leafGeo.computeVertexNormals();

    const leafMesh = new THREE.Mesh(leafGeo, material);
    leafMesh.scale.setScalar(scale);
    leafMesh.castShadow = true;
    return leafMesh;
  }

  buildFallenLeaves() {
    this.leavesGroup = new THREE.Group();

    // Prominent autumn leaves scattered across the foreground and hill
    const leafSpots = [
      // Foreground Center & Left
      { x: -1.9, z: 4.8, mat: this.leafOrangeMat, rot: 0.4, s: 0.48 },
      { x: -0.6, z: 4.6, mat: this.leafRedMat, rot: -0.7, s: 0.44 },
      { x: -1.2, z: 4.0, mat: this.leafYellowMat, rot: 1.1, s: 0.42 },
      { x: -2.4, z: 4.2, mat: this.leafOrangeMat, rot: 0.8, s: 0.45 },
      { x: -2.8, z: 3.4, mat: this.leafRedMat, rot: -0.4, s: 0.42 },

      // Foreground Center & Right
      { x: 0.4, z: 4.4, mat: this.leafYellowMat, rot: -0.3, s: 0.44 },
      { x: 1.2, z: 4.2, mat: this.leafOrangeMat, rot: 0.9, s: 0.46 },
      { x: 1.8, z: 4.6, mat: this.leafRedMat, rot: -1.2, s: 0.42 },
      { x: 2.1, z: 3.5, mat: this.leafOrangeMat, rot: 0.5, s: 0.45 },
      { x: 2.8, z: 4.4, mat: this.leafYellowMat, rot: 0.2, s: 0.4 },

      // Midground & Tree Bases
      { x: -3.8, z: 2.4, mat: this.leafOrangeMat, rot: 0.6, s: 0.42 },
      { x: -4.4, z: 2.8, mat: this.leafYellowMat, rot: -0.8, s: 0.38 },
      { x: 3.8, z: 2.4, mat: this.leafRedMat, rot: 0.4, s: 0.44 },
      { x: 4.5, z: 2.0, mat: this.leafOrangeMat, rot: -0.5, s: 0.4 }
    ];

    leafSpots.forEach(ls => {
      const leaf = this.createMapleLeafMesh(ls.mat, ls.s);
      const y = this.getHillHeight(ls.x, ls.z) + 0.04;
      leaf.position.set(ls.x, y, ls.z);
      leaf.rotation.x = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.15;
      leaf.rotation.z = ls.rot;
      this.leavesGroup.add(leaf);
      this.leafMeshes.push(leaf);
    });

    this.scene.add(this.leavesGroup);
  }

  // -------------------------------------------------------------
  // 7. Tiny Wildflowers (Purple, White, Golden Yellow)
  // -------------------------------------------------------------
  buildWildflowers() {
    this.flowersGroup = new THREE.Group();

    const flowerSpots = [
      { x: 2.7, z: 4.2, c: 0x9955dd },
      { x: 2.9, z: 4.0, c: 0xf5f5f5 },
      { x: 3.3, z: 4.3, c: 0xffd23f },
      { x: -1.4, z: 4.7, c: 0xf5f5f5 },
      { x: -2.0, z: 4.5, c: 0x9955dd },
      { x: 0.1, z: 4.5, c: 0xffd23f },
      { x: 0.7, z: 4.3, c: 0x9955dd },
      { x: 1.6, z: 4.0, c: 0xf5f5f5 }
    ];

    const centerMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    flowerSpots.forEach(fs => {
      const flower = new THREE.Group();
      const y = this.getHillHeight(fs.x, fs.z) + 0.03;
      flower.position.set(fs.x, y, fs.z);

      const petalMat = new THREE.MeshStandardMaterial({
        color: fs.c,
        roughness: 0.6
      });

      // 5 rounded flower petals
      for (let p = 0; p < 5; p++) {
        const ang = (p / 5) * Math.PI * 2;
        const petalGeo = new THREE.SphereGeometry(0.048, 8, 6);
        petalGeo.scale(1.2, 0.4, 0.8);
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(ang) * 0.065, 0.02, Math.sin(ang) * 0.065);
        petal.rotation.y = -ang;
        flower.add(petal);
      }

      // Center
      const centerGeo = new THREE.SphereGeometry(0.035, 8, 6);
      const centerMesh = new THREE.Mesh(centerGeo, centerMat);
      centerMesh.position.y = 0.03;
      flower.add(centerMesh);

      this.flowersGroup.add(flower);
    });

    this.scene.add(this.flowersGroup);
  }

  // -------------------------------------------------------------
  // 8. Stylized Grass Tufts (blade clumps catching moonlight)
  // -------------------------------------------------------------
  buildGrassTufts() {
    this.tuftsGroup = new THREE.Group();

    const tuftCount = 110;
    for (let i = 0; i < tuftCount; i++) {
      const tuft = new THREE.Group();
      const x = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.35) * 10 + 0.8;
      const y = this.getHillHeight(x, z);

      tuft.position.set(x, y, z);
      tuft.rotation.y = Math.random() * Math.PI * 2;

      // 3 blades per tuft
      for (let b = -1; b <= 1; b++) {
        const bladeGeo = new THREE.ConeGeometry(0.045, 0.38 + Math.random() * 0.18, 4);
        bladeGeo.scale(0.8, 1.0, 0.3);
        const blade = new THREE.Mesh(bladeGeo, this.grassMat);
        blade.position.set(b * 0.065, 0.2, 0);
        blade.rotation.z = b * 0.32 + (Math.random() - 0.5) * 0.1;
        tuft.add(blade);
      }

      this.tuftsGroup.add(tuft);
    }

    this.scene.add(this.tuftsGroup);
  }

  // -------------------------------------------------------------
  // 9. Distant Background Layered Pine Trees & Forest Ridge
  // -------------------------------------------------------------
  buildBackgroundPines() {
    this.pineGroup = new THREE.Group();

    const pineMat = new THREE.MeshBasicMaterial({
      color: 0x141d3b,
      fog: true
    });

    const pineCount = 28;
    for (let i = 0; i < pineCount; i++) {
      const pine = new THREE.Group();
      const x = (i - pineCount * 0.5) * 1.35 + (Math.random() - 0.5) * 0.8;
      const z = -14 - Math.random() * 6;
      const h = 4.5 + Math.random() * 2.5;

      // 3 stacked cones for stylized pine silhouette
      for (let c = 0; c < 3; c++) {
        const coneGeo = new THREE.ConeGeometry((1.2 - c * 0.3) * 0.8, h * 0.4, 6);
        const cone = new THREE.Mesh(coneGeo, pineMat);
        cone.position.y = (c * 0.7 + 0.8) * (h * 0.28);
        pine.add(cone);
      }

      pine.position.set(x, 1.2, z);
      this.pineGroup.add(pine);
    }

    this.scene.add(this.pineGroup);
  }

  update(delta, elapsed) {
    // Subtle breathing/sway of fallen leaves in night breeze
    for (let i = 0; i < this.leafMeshes.length; i++) {
      const leaf = this.leafMeshes[i];
      leaf.rotation.z += Math.sin(elapsed * 1.5 + i) * 0.0008;
    }

    this.updateGhostShadow();

    // Hover smoothing for lantern (~15% brightness boost)
    this.lanternHoverAmount += (this.lanternHoverTarget - this.lanternHoverAmount) * Math.min(1, delta * 6.0);

    // Click flare envelope decay
    if (this.lanternFlareHold > 0) {
      this.lanternFlareHold = Math.max(0, this.lanternFlareHold - delta);
      this.lanternFlareAmount += (1.0 - this.lanternFlareAmount) * Math.min(1, delta * 8.0);
    } else {
      this.lanternFlareAmount += (0.0 - this.lanternFlareAmount) * Math.min(1, delta * 2.4);
    }

    // Retrieve synchronized glow factor from lighting module if available, or standalone fallback
    let glowFactor = 1.0;
    if (this.lighting && typeof this.lighting.getLanternGlowFactor === 'function') {
      glowFactor = this.lighting.getLanternGlowFactor();
    } else {
      const breath = Math.sin(elapsed * 4.6) * 0.075;
      const hoverFactor = 1.0 + this.lanternHoverAmount * 0.15;
      glowFactor = (1.0 + breath) * hoverFactor + this.lanternFlareAmount * 1.35;
    }

    // Subtle breathing pulse scale (~3-5%)
    const pulseScale = 1.0 + (glowFactor - 1.0) * 0.08 + Math.sin(elapsed * 4.6) * 0.025;

    // Update soft warm halos
    for (let i = 0; i < this.lanternHalos.length; i++) {
      const halo = this.lanternHalos[i];
      halo.scale.set(pulseScale, pulseScale, pulseScale);
      if (halo.material) {
        halo.material.opacity = Math.min(0.95, 0.58 * glowFactor);
      }
    }

    // Update glowing flame bulb cores
    for (let i = 0; i < this.lanternCores.length; i++) {
      const core = this.lanternCores[i];
      core.scale.set(0.85 * pulseScale, 1.25 * pulseScale, 0.7 * pulseScale);
    }

    if (this.lanternCoreMat) {
      const boost = Math.min(1.45, Math.max(0.7, glowFactor));
      this.lanternCoreMat.color.setRGB(
        Math.min(1.0, 1.0 * boost),
        Math.min(1.0, 0.72 * boost),
        Math.min(1.0, 0.20 * boost)
      );
    }
  }
}

window.DioramaEnvironment = DioramaEnvironment;

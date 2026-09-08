/**
 * Cute Friendly 3D Floating Ghost
 * Faithful to reference image: smooth porcelain white form, rounded dome head,
 * wavy ruffled skirt hem, stubby floating arms, big dark eyes with lavender eyelids,
 * raised arched eyebrows, happy open mouth with pink tongue, and soft rosy pink blush cheeks.
 */

class CuteGhost {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.clickableMeshes = [];

    // Animation, Floating, & Hover states
    this.animTime = 0;
    this.isReacting = false;
    this.reactionProgress = 0;
    this.basePosition = new THREE.Vector3(2.4, 2.3, 1.8);
    this.hoverAmount = 0;
    this.targetHoverAmount = 0;

    this.initMaterials();
    this.buildGhostModel();
    this.positionGhost();

    this.scene.add(this.group);
  }

  setHovered(isHovered) {
    this.targetHoverAmount = isHovered ? 1.0 : 0.0;
  }

  initMaterials() {
    // Soft luminous porcelain/vinyl matte white with radiant ethereal glow
    this.ghostMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.20,
      metalness: 0.02,
      emissive: 0x8e96b8, // Radiant clean porcelain white glow matching reference
      emissiveIntensity: 0.72
    });

    // Dark glossy eyes
    this.eyePupilMat = new THREE.MeshStandardMaterial({
      color: 0x15131c,
      roughness: 0.1,
      metalness: 0.1
    });

    // Lavender/purple eyelid outline
    this.eyelidMat = new THREE.MeshStandardMaterial({
      color: 0x9a8ab8,
      roughness: 0.5,
      metalness: 0.0
    });

    // Raised arched dark eyebrows
    this.eyebrowMat = new THREE.MeshStandardMaterial({
      color: 0x3d3747,
      roughness: 0.6
    });

    // Catchlights bright white
    this.catchlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    // Rosy pink blush cheeks
    this.blushMat = new THREE.MeshBasicMaterial({
      color: 0xff6088,
      transparent: true,
      opacity: 0.88
    });

    // Open mouth cavity
    this.mouthCavityMat = new THREE.MeshStandardMaterial({
      color: 0x240e18,
      roughness: 0.8
    });

    // Pink tongue
    this.tongueMat = new THREE.MeshStandardMaterial({
      color: 0xeb647e,
      roughness: 0.45
    });
  }

  // Create smooth feathered blush circular texture
  createBlushTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 107, 139, 0.9)');
    grad.addColorStop(0.5, 'rgba(255, 107, 139, 0.5)');
    grad.addColorStop(0.85, 'rgba(255, 107, 139, 0.12)');
    grad.addColorStop(1, 'rgba(255, 107, 139, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  buildGhostModel() {
    this.bodyGroup = new THREE.Group();

    // -------------------------------------------------------------
    // 1. Ghost Body & Wavy Ruffled Skirt Hem
    // -------------------------------------------------------------
    // Parametric geometry creating smooth domed head and 5 wavy ruffled skirt lobes
    const radialSegments = 64;
    const heightSegments = 36;
    const totalHeight = 2.4;
    const numFolds = 5; // 5 lobes matching reference

    const ghostGeo = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let yIndex = 0; yIndex <= heightSegments; yIndex++) {
      const v = yIndex / heightSegments; // 0 at bottom, 1 at top
      const yNorm = v;
      let radius = 0;
      let y = 0;

      if (v > 0.55) {
        // Upper dome: hemispherical cap
        const capV = (v - 0.55) / 0.45; // 0 to 1
        const angle = capV * Math.PI * 0.5;
        radius = 0.95 * Math.cos(angle);
        y = 1.1 + Math.sin(angle) * 0.95;
      } else if (v > 0.2) {
        // Mid body: gentle flaring bell
        const midV = (v - 0.2) / 0.35;
        radius = 0.95 + (1.0 - midV) * 0.22;
        y = 0.35 + midV * 0.75;
      } else {
        // Lower skirt: undulating hem
        const skirtV = v / 0.2; // 0 to 1
        radius = 1.17 + (1.0 - skirtV) * 0.12;
        y = skirtV * 0.35;
      }

      for (let xIndex = 0; xIndex <= radialSegments; xIndex++) {
        const u = xIndex / radialSegments;
        const theta = u * Math.PI * 2;

        // Wave scallop at skirt hem
        let waveY = 0;
        let waveR = 0;
        if (v < 0.35) {
          const skirtFactor = 1.0 - (v / 0.35);
          // 5 smooth scallop waves
          const wave = Math.cos(theta * numFolds);
          waveY = wave * 0.18 * skirtFactor;
          waveR = wave * 0.08 * skirtFactor;
        }

        const currentR = radius + waveR;
        const currentY = y + waveY;

        const posX = currentR * Math.sin(theta);
        const posZ = currentR * Math.cos(theta);

        positions.push(posX, currentY, posZ);
        uvs.push(u, v);
      }
    }

    // Build grid triangle indices
    for (let yIndex = 0; yIndex < heightSegments; yIndex++) {
      for (let xIndex = 0; xIndex < radialSegments; xIndex++) {
        const a = yIndex * (radialSegments + 1) + xIndex;
        const b = (yIndex + 1) * (radialSegments + 1) + xIndex;
        const c = (yIndex + 1) * (radialSegments + 1) + (xIndex + 1);
        const d = yIndex * (radialSegments + 1) + (xIndex + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    ghostGeo.setIndex(indices);
    ghostGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    ghostGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    ghostGeo.computeVertexNormals();

    this.ghostMesh = new THREE.Mesh(ghostGeo, this.ghostMat);
    this.ghostMesh.castShadow = true;
    this.ghostMesh.receiveShadow = true;
    this.bodyGroup.add(this.ghostMesh);

    // Bottom cap to close underside smoothly
    const bottomCapGeo = new THREE.CircleGeometry(1.15, 32);
    bottomCapGeo.rotateX(Math.PI * 0.5);
    const bottomCap = new THREE.Mesh(bottomCapGeo, this.ghostMat);
    bottomCap.position.y = 0.15;
    this.bodyGroup.add(bottomCap);

    // -------------------------------------------------------------
    // 2. Chubby Floating Ghost Arms (Cute forward/downward curved nubs)
    // -------------------------------------------------------------
    const createArm = (isLeft) => {
      const armGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Smooth chubby curved nub geometry
      const armGeo = new THREE.SphereGeometry(0.24, 24, 20);
      armGeo.scale(0.72, 0.64, 1.35);

      const pos = armGeo.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const z = pos[i + 2];
        if (z > 0) {
          // Gentle downward dip and subtle inward curve towards tip
          pos[i + 1] -= (z * z) * 0.45;
          pos[i] -= sign * (z * z) * 0.2;
        }
      }
      armGeo.computeVertexNormals();

      const armMesh = new THREE.Mesh(armGeo, this.ghostMat);
      armMesh.castShadow = true;
      armMesh.receiveShadow = true;
      armGroup.add(armMesh);

      // Angled gently forward (~30 deg downward, ~22 deg inward)
      armGroup.position.set(sign * 0.94, 0.68, 0.28);
      armGroup.rotation.x = 0.52; // ~30 deg pitch forward/down
      armGroup.rotation.y = sign * -0.38; // ~22 deg yaw inward
      armGroup.rotation.z = sign * 0.18;

      return armGroup;
    };

    this.leftArm = createArm(true);
    this.rightArm = createArm(false);
    this.leftArmBaseRotationX = this.leftArm.rotation.x;
    this.rightArmBaseRotationX = this.rightArm.rotation.x;
    this.bodyGroup.add(this.leftArm);
    this.bodyGroup.add(this.rightArm);

    // -------------------------------------------------------------
    // 3. Facial Features: Eyes with Lavender Eyelids & Catchlights
    // -------------------------------------------------------------
    const createGhostEye = (isLeft) => {
      const eyeGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Outer lavender lid ring
      const lidGeo = new THREE.TorusGeometry(0.24, 0.05, 12, 24);
      const lidMesh = new THREE.Mesh(lidGeo, this.eyelidMat);
      lidMesh.scale.set(0.9, 1.1, 1.0);
      eyeGroup.add(lidMesh);

      // Big glossy dark pupil
      const pupilGeo = new THREE.SphereGeometry(0.22, 20, 16);
      pupilGeo.scale(0.9, 1.1, 0.5);
      const pupilMesh = new THREE.Mesh(pupilGeo, this.eyePupilMat);
      eyeGroup.add(pupilMesh);

      // Dual Catchlights: large at upper-right, small at lower-left
      const bigCatchGeo = new THREE.SphereGeometry(0.058, 12, 10);
      const bigCatch = new THREE.Mesh(bigCatchGeo, this.catchlightMat);
      bigCatch.position.set(0.06, 0.08, 0.12);
      eyeGroup.add(bigCatch);

      const smallCatchGeo = new THREE.SphereGeometry(0.032, 10, 8);
      const smallCatch = new THREE.Mesh(smallCatchGeo, this.catchlightMat);
      smallCatch.position.set(-0.06, -0.07, 0.12);
      eyeGroup.add(smallCatch);

      // Eye placement on dome
      eyeGroup.position.set(sign * 0.42, 1.48, 0.88);
      eyeGroup.rotation.y = sign * 0.32;
      eyeGroup.rotation.x = -0.08;

      return eyeGroup;
    };

    this.leftEye = createGhostEye(true);
    this.rightEye = createGhostEye(false);
    this.bodyGroup.add(this.leftEye);
    this.bodyGroup.add(this.rightEye);

    // -------------------------------------------------------------
    // 4. Expressive Raised Arched Eyebrows
    // -------------------------------------------------------------
    const browGeo = new THREE.TorusGeometry(0.16, 0.032, 8, 16, Math.PI * 0.65);
    browGeo.rotateZ(-Math.PI * 0.15);

    const leftBrow = new THREE.Mesh(browGeo, this.eyebrowMat);
    leftBrow.position.set(-0.42, 1.84, 0.86);
    leftBrow.rotation.y = 0.28;
    leftBrow.rotation.z = -0.22;
    this.bodyGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, this.eyebrowMat);
    rightBrow.position.set(0.42, 1.84, 0.86);
    rightBrow.rotation.y = -0.28;
    rightBrow.rotation.z = 0.22;
    rightBrow.scale.x = -1;
    this.bodyGroup.add(rightBrow);

    // -------------------------------------------------------------
    // 5. Happy Open Smiling Mouth with Tongue
    // -------------------------------------------------------------
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, 1.15, 0.98);

    // Open happy mouth shape
    const mouthShape = new THREE.Shape();
    mouthShape.moveTo(-0.25, 0.06);
    mouthShape.quadraticCurveTo(0, -0.02, 0.25, 0.06); // Top lip gentle curve
    mouthShape.quadraticCurveTo(0.22, -0.25, 0, -0.28);  // Bottom deep smile
    mouthShape.quadraticCurveTo(-0.22, -0.25, -0.25, 0.06);
    mouthShape.closePath();

    const mouthExtrude = new THREE.ExtrudeGeometry(mouthShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });
    const mouthMesh = new THREE.Mesh(mouthExtrude, this.mouthCavityMat);
    mouthMesh.rotation.x = -0.15;
    mouthGroup.add(mouthMesh);

    // Sweet pink tongue
    const tongueGeo = new THREE.SphereGeometry(0.12, 14, 10);
    tongueGeo.scale(1.2, 0.55, 0.8);
    const tongueMesh = new THREE.Mesh(tongueGeo, this.tongueMat);
    tongueMesh.position.set(0, -0.16, 0.06);
    mouthGroup.add(tongueMesh);

    this.bodyGroup.add(mouthGroup);

    // -------------------------------------------------------------
    // 6. Rosy Glowing Cheek Blush
    // -------------------------------------------------------------
    const blushTexture = this.createBlushTexture();
    const blushGeo = new THREE.PlaneGeometry(0.38, 0.38);
    const blushMaterial = new THREE.MeshBasicMaterial({
      map: blushTexture,
      transparent: true,
      depthWrite: false
    });

    const leftBlush = new THREE.Mesh(blushGeo, blushMaterial);
    leftBlush.position.set(-0.68, 1.25, 0.78);
    leftBlush.rotation.y = -0.58;
    leftBlush.rotation.x = -0.1;
    this.bodyGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMaterial);
    rightBlush.position.set(0.68, 1.25, 0.78);
    rightBlush.rotation.y = 0.58;
    rightBlush.rotation.x = -0.1;
    this.bodyGroup.add(rightBlush);

    // Assemble root
    this.group.add(this.bodyGroup);

    // Register clickable meshes for raycasting
    this.group.traverse(child => {
      if (child.isMesh) {
        child.userData.isGhost = true;
        child.userData.ghostInstance = this;
        this.clickableMeshes.push(child);
      }
    });
  }

  positionGhost() {
    this.basePosition.set(2.2, 2.5, 2.3);
    this.group.position.copy(this.basePosition);
    this.group.scale.setScalar(0.92);
    this.group.rotation.y = -0.22;
  }

  // Click Reaction: Joyful 360 Spin & Happy Bounce!
  triggerInteraction() {
    if (this.isReacting) return;
    this.isReacting = true;
    this.reactionProgress = 0;

    if (window.soundManager) {
      window.soundManager.playGhostChime();
    }
  }

  update(delta, elapsed) {
    this.animTime += delta;

    // Hover response: gentle rise (+0.08 units) and emissive intensity boost (~12%)
    this.hoverAmount += (this.targetHoverAmount - this.hoverAmount) * Math.min(1, delta * 6.0);
    const hoverLift = this.hoverAmount * 0.08;
    if (this.ghostMat) {
      this.ghostMat.emissiveIntensity = 0.72 * (1.0 + this.hoverAmount * 0.12);
    }

    // 1. Weightless Floating Idle: Vertical bobbing, lateral figure-8 drift, tilt
    const bob = Math.sin(this.animTime * 1.8) * 0.22;
    const driftX = Math.sin(this.animTime * 0.9) * 0.18;
    const driftZ = Math.cos(this.animTime * 0.9) * 0.12;
    const bankZ = Math.cos(this.animTime * 1.8) * 0.08;
    const pitchX = Math.sin(this.animTime * 1.4) * 0.04;

    this.group.position.y = this.basePosition.y + bob + hoverLift;
    this.group.position.x = this.basePosition.x + driftX;
    this.group.position.z = this.basePosition.z + driftZ;

    // 2. Playful arm floating wiggle
    const armWave = Math.sin(this.animTime * 2.2) * 0.12;
    this.leftArm.rotation.z = armWave;
    this.rightArm.rotation.z = -armWave;

    // 3. Interactive Click: Joyful spin flip & excited high bounce
    if (this.isReacting) {
      this.reactionProgress += delta * 2.2;

      if (this.reactionProgress <= 1.0) {
        // Complete 360 spin
        const spinAngle = this.reactionProgress * Math.PI * 2;
        this.bodyGroup.rotation.y = spinAngle;

        // Bounce up high
        const jumpY = Math.sin(this.reactionProgress * Math.PI) * 0.55;
        this.group.position.y = this.basePosition.y + bob + hoverLift + jumpY;

        // Arm flutter
        const armFlutter = Math.sin(this.reactionProgress * Math.PI * 8) * 0.4;
        this.leftArm.rotation.x = this.leftArmBaseRotationX + armFlutter;
        this.rightArm.rotation.x = this.rightArmBaseRotationX + armFlutter;
      } else {
        this.isReacting = false;
        this.reactionProgress = 0;
        this.bodyGroup.rotation.y = 0;
        this.leftArm.rotation.x = this.leftArmBaseRotationX;
        this.rightArm.rotation.x = this.rightArmBaseRotationX;
      }
    } else {
      this.bodyGroup.rotation.z = bankZ;
      this.bodyGroup.rotation.x = pitchX;
    }
  }
}

window.CuteGhost = CuteGhost;

/**
 * Cute Stylized 3D Black Kitten
 * Faithful to reference image: velvety dark coat, big amber eyes with catchlights,
 * smiling mouth with pink tongue, curled tail, front paws with toe pads, and animations.
 */

class CuteCat {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.clickableMeshes = [];

    // Animation & hover states
    this.animTime = 0;
    this.isReacting = false;
    this.reactionProgress = 0;
    this.earTwitchTimer = 0;
    this.currentEarTwitch = 0;
    this.hoverAmount = 0;
    this.targetHoverAmount = 0;
    this.catchlights = [];

    this.initMaterials();
    this.buildCatModel();
    this.positionCat();

    this.scene.add(this.group);
  }

  setHovered(isHovered) {
    this.targetHoverAmount = isHovered ? 1.0 : 0.0;
  }

  initMaterials() {
    // Velvety matte charcoal/black fur
    this.furMat = new THREE.MeshStandardMaterial({
      color: 0x18171d,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: false
    });

    // Inner ear slightly softer charcoal
    this.innerEarMat = new THREE.MeshStandardMaterial({
      color: 0x2e2933,
      roughness: 0.9,
      metalness: 0.0
    });

    // Nose material (satin dark)
    this.noseMat = new THREE.MeshStandardMaterial({
      color: 0x111013,
      roughness: 0.4,
      metalness: 0.15
    });

    // Pink tongue
    this.tongueMat = new THREE.MeshStandardMaterial({
      color: 0xe86882,
      roughness: 0.5,
      metalness: 0.05
    });

    // Mouth interior dark
    this.mouthInnerMat = new THREE.MeshStandardMaterial({
      color: 0x220c15,
      roughness: 0.8
    });

    // Whiskers (fine dark lines/tubes)
    this.whiskerMat = new THREE.MeshBasicMaterial({
      color: 0x1f1f24
    });

    // High-gloss catchlights
    this.catchlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
  }

  // Create iris texture dynamically with amber/gold gradient and radial depth
  createIrisTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const cx = 128, cy = 128, r = 120;

    // Dark outer limbal ring
    ctx.fillStyle = '#100c06';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant Amber / Gold gradient
    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, r - 5);
    grad.addColorStop(0, '#f2af2a');   // Bright inner gold
    grad.addColorStop(0.5, '#e08a12'); // Rich amber
    grad.addColorStop(0.85, '#ad5a05'); // Deep burnt amber
    grad.addColorStop(1.0, '#3d1d02'); // Limbal shadow

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.fill();

    // Radial iris striations
    ctx.strokeStyle = 'rgba(255, 220, 120, 0.25)';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += 0.12) {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 35, cy + Math.sin(a) * 35);
      ctx.lineTo(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12));
      ctx.stroke();
    }

    // Huge glossy black pupil
    ctx.fillStyle = '#080709';
    ctx.beginPath();
    ctx.arc(cx, cy, 75, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  buildCatModel() {
    // -------------------------------------------------------------
    // Main Root Groups
    // -------------------------------------------------------------
    this.bodyGroup = new THREE.Group();
    this.headGroup = new THREE.Group();

    // -------------------------------------------------------------
    // 1. Torso & Chest
    // -------------------------------------------------------------
    // Rounded sitting body shape
    const torsoGeo = new THREE.SphereGeometry(0.72, 24, 20);
    torsoGeo.scale(0.82, 1.08, 0.85);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.furMat);
    this.torsoMesh.position.set(0, 0.76, 0);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.bodyGroup.add(this.torsoMesh);

    // Fluffy chest bulge
    const chestGeo = new THREE.SphereGeometry(0.48, 16, 16);
    chestGeo.scale(0.75, 0.95, 0.6);
    const chestMesh = new THREE.Mesh(chestGeo, this.furMat);
    chestMesh.position.set(0, 0.82, 0.32);
    this.bodyGroup.add(chestMesh);

    // -------------------------------------------------------------
    // 2. Front Legs & Paws
    // -------------------------------------------------------------
    const createFrontLeg = (isLeft) => {
      const legGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Leg cylinder
      const legGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.65, 16);
      const legMesh = new THREE.Mesh(legGeo, this.furMat);
      legMesh.position.set(0, 0.35, 0);
      legMesh.rotation.z = sign * -0.05;
      legMesh.castShadow = true;
      legGroup.add(legMesh);

      // Cute rounded paw with toe clefts
      const pawGeo = new THREE.SphereGeometry(0.2, 16, 12);
      pawGeo.scale(1.0, 0.6, 1.25);
      const pawMesh = new THREE.Mesh(pawGeo, this.furMat);
      pawMesh.position.set(0, 0.1, 0.12);
      pawMesh.castShadow = true;
      legGroup.add(pawMesh);

      // Toe indents (3 little toe segments)
      for (let i = -1; i <= 1; i++) {
        const toeGeo = new THREE.SphereGeometry(0.08, 10, 8);
        toeGeo.scale(0.8, 0.65, 1.0);
        const toe = new THREE.Mesh(toeGeo, this.furMat);
        toe.position.set(i * 0.08, 0.09, 0.23);
        legGroup.add(toe);
      }

      legGroup.position.set(sign * 0.22, 0, 0.35);
      return legGroup;
    };

    this.leftFrontLeg = createFrontLeg(true);
    this.rightFrontLeg = createFrontLeg(false);
    this.bodyGroup.add(this.leftFrontLeg);
    this.bodyGroup.add(this.rightFrontLeg);

    // -------------------------------------------------------------
    // 3. Crouching Rear Haunches & Back Paws
    // -------------------------------------------------------------
    const createRearHaunch = (isLeft) => {
      const haunchGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Hip sphere
      const hipGeo = new THREE.SphereGeometry(0.42, 16, 14);
      hipGeo.scale(0.65, 0.95, 1.0);
      const hipMesh = new THREE.Mesh(hipGeo, this.furMat);
      hipMesh.position.set(0, 0.42, -0.08);
      hipMesh.rotation.y = sign * 0.2;
      hipMesh.castShadow = true;
      haunchGroup.add(hipMesh);

      // Back paw resting flat
      const backPawGeo = new THREE.SphereGeometry(0.18, 12, 10);
      backPawGeo.scale(0.9, 0.55, 1.2);
      const backPawMesh = new THREE.Mesh(backPawGeo, this.furMat);
      backPawMesh.position.set(sign * 0.06, 0.09, 0.22);
      backPawMesh.castShadow = true;
      haunchGroup.add(backPawMesh);

      haunchGroup.position.set(sign * 0.48, 0, -0.02);
      return haunchGroup;
    };

    this.leftHaunch = createRearHaunch(true);
    this.rightHaunch = createRearHaunch(false);
    this.bodyGroup.add(this.leftHaunch);
    this.bodyGroup.add(this.rightHaunch);

    // -------------------------------------------------------------
    // 4. Playfully Curled Tail
    // -------------------------------------------------------------
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0.28, 0.22, -0.45);

    // Tail curve: curves out, sweeps up, and loops gracefully at tip
    this.tailPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.35, 0.15, -0.2),
      new THREE.Vector3(0.75, 0.35, -0.15),
      new THREE.Vector3(0.95, 0.75, 0.0),
      new THREE.Vector3(0.85, 1.15, 0.05),
      new THREE.Vector3(0.65, 1.25, 0.0),
      new THREE.Vector3(0.58, 1.12, -0.05)
    ];

    const tailCurve = new THREE.CatmullRomCurve3(this.tailPoints);
    this.tailGeo = new THREE.TubeGeometry(tailCurve, 32, 0.11, 10, false);
    this.tailMesh = new THREE.Mesh(this.tailGeo, this.furMat);
    this.tailMesh.castShadow = true;
    this.tailGroup.add(this.tailMesh);

    // Soft rounded tail tip
    const tailTipGeo = new THREE.SphereGeometry(0.11, 10, 8);
    const tailTipMesh = new THREE.Mesh(tailTipGeo, this.furMat);
    tailTipMesh.position.copy(this.tailPoints[this.tailPoints.length - 1]);
    this.tailGroup.add(tailTipMesh);

    this.bodyGroup.add(this.tailGroup);

    // -------------------------------------------------------------
    // 5. Head & Facial Features
    // -------------------------------------------------------------
    this.headGroup.position.set(0, 1.62, 0.1);

    // Main skull (round and cute)
    const skullGeo = new THREE.SphereGeometry(0.7, 28, 24);
    skullGeo.scale(1.15, 1.02, 1.0);
    this.skullMesh = new THREE.Mesh(skullGeo, this.furMat);
    this.skullMesh.castShadow = true;
    this.headGroup.add(this.skullMesh);

    // Chubby kitten cheeks (soft jowls)
    const cheekGeo = new THREE.SphereGeometry(0.38, 18, 16);
    cheekGeo.scale(1.15, 0.88, 0.95);

    const leftCheek = new THREE.Mesh(cheekGeo, this.furMat);
    leftCheek.position.set(-0.46, -0.16, 0.32);
    this.headGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, this.furMat);
    rightCheek.position.set(0.46, -0.16, 0.32);
    this.headGroup.add(rightCheek);

    // Little top hair tuft
    const tuftGeo = new THREE.ConeGeometry(0.12, 0.22, 6);
    const tuftMesh = new THREE.Mesh(tuftGeo, this.furMat);
    tuftMesh.position.set(0, 0.72, 0.05);
    tuftMesh.rotation.x = -0.15;
    this.headGroup.add(tuftMesh);

    // -------------------------------------------------------------
    // 6. Upright Triangular Ears (Matching reference proportions)
    // -------------------------------------------------------------
    const createEar = (isLeft) => {
      const earGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Rounded triangular ear shape
      const earShape = new THREE.Shape();
      earShape.moveTo(0, 0);
      earShape.quadraticCurveTo(0.2, 0.16, 0.22, 0.42); // Outer curve
      earShape.quadraticCurveTo(0.12, 0.49, 0.04, 0.45); // Rounded tip
      earShape.quadraticCurveTo(-0.16, 0.22, -0.22, 0);   // Inner curve
      earShape.closePath();

      const extrudeSettings = {
        depth: 0.06,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.035,
        bevelThickness: 0.025
      };

      const earGeo = new THREE.ExtrudeGeometry(earShape, extrudeSettings);
      const earMesh = new THREE.Mesh(earGeo, this.furMat);
      earMesh.castShadow = true;
      earGroup.add(earMesh);

      // Inner ear recess
      const innerShape = new THREE.Shape();
      innerShape.moveTo(0, 0.04);
      innerShape.quadraticCurveTo(0.14, 0.14, 0.15, 0.34);
      innerShape.quadraticCurveTo(0.08, 0.4, 0.02, 0.36);
      innerShape.quadraticCurveTo(-0.1, 0.18, -0.15, 0.04);
      innerShape.closePath();

      const innerGeo = new THREE.ExtrudeGeometry(innerShape, {
        depth: 0.03,
        bevelEnabled: false
      });
      const innerMesh = new THREE.Mesh(innerGeo, this.innerEarMat);
      innerMesh.position.z = 0.04;
      earGroup.add(innerMesh);

      earGroup.position.set(sign * 0.35, 0.48, 0.08);
      earGroup.rotation.y = sign * -0.18;
      earGroup.rotation.z = sign * -0.16;
      earGroup.rotation.x = -0.06;

      return earGroup;
    };

    this.leftEar = createEar(true);
    this.rightEar = createEar(false);
    this.headGroup.add(this.leftEar);
    this.headGroup.add(this.rightEar);

    // -------------------------------------------------------------
    // 7. Expressive Amber Eyes & Catchlights (Direct Forward Facing)
    // -------------------------------------------------------------
    const irisTexture = this.createIrisTexture();

    const createEye = (isLeft) => {
      const eyeGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Outer dark eye rim / socket
      const socketGeo = new THREE.SphereGeometry(0.25, 24, 20);
      socketGeo.scale(1.0, 1.1, 0.6);
      const socketMesh = new THREE.Mesh(socketGeo, this.furMat);
      eyeGroup.add(socketMesh);

      // Iris disc with amber/gold gradient texture facing forward (+Z)
      const irisGeo = new THREE.CircleGeometry(0.22, 32);
      const irisMat = new THREE.MeshBasicMaterial({
        map: irisTexture,
        side: THREE.FrontSide
      });
      const irisMesh = new THREE.Mesh(irisGeo, irisMat);
      irisMesh.position.z = 0.14;
      eyeGroup.add(irisMesh);

      // Glossy clear cornea dome
      const corneaGeo = new THREE.SphereGeometry(0.23, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const corneaMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.3
      });
      const corneaMesh = new THREE.Mesh(corneaGeo, corneaMat);
      corneaMesh.position.z = 0.12;
      corneaMesh.rotation.x = Math.PI * 0.5;
      eyeGroup.add(corneaMesh);

      // Catchlights: Big highlight at 10 o'clock, small highlight at 4 o'clock
      const bigCatchGeo = new THREE.CircleGeometry(0.048, 16);
      const bigCatch = new THREE.Mesh(bigCatchGeo, this.catchlightMat);
      bigCatch.position.set(-0.065, 0.08, 0.16);
      eyeGroup.add(bigCatch);

      const smallCatchGeo = new THREE.CircleGeometry(0.026, 12);
      const smallCatch = new THREE.Mesh(smallCatchGeo, this.catchlightMat);
      smallCatch.position.set(0.065, -0.065, 0.16);
      eyeGroup.add(smallCatch);

      this.catchlights.push(bigCatch, smallCatch);

      // Eye placement on face (Angled slightly outward for chibi kitten appeal)
      eyeGroup.position.set(sign * 0.31, 0.07, 0.55);
      eyeGroup.rotation.y = sign * 0.16;
      eyeGroup.rotation.x = -0.03;

      return eyeGroup;
    };

    this.leftEye = createEye(true);
    this.rightEye = createEye(false);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // Delicate curved eyebrow furrows above eyes
    const browGeo = new THREE.TorusGeometry(0.14, 0.022, 6, 12, Math.PI * 0.7);
    const leftBrow = new THREE.Mesh(browGeo, this.furMat);
    leftBrow.position.set(-0.31, 0.28, 0.57);
    leftBrow.rotation.z = -0.3;
    leftBrow.rotation.y = 0.2;
    this.headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, this.furMat);
    rightBrow.position.set(0.31, 0.28, 0.57);
    rightBrow.rotation.z = Math.PI + 0.3;
    rightBrow.rotation.y = -0.2;
    this.headGroup.add(rightBrow);

    // -------------------------------------------------------------
    // 8. Nose, Smiling Mouth & Whiskers
    // -------------------------------------------------------------
    // Muzzle whisker pads
    const muzzlePadGeo = new THREE.SphereGeometry(0.14, 14, 10);
    muzzlePadGeo.scale(1.1, 0.8, 0.8);

    const leftMuzzle = new THREE.Mesh(muzzlePadGeo, this.furMat);
    leftMuzzle.position.set(-0.1, -0.11, 0.65);
    this.headGroup.add(leftMuzzle);

    const rightMuzzle = new THREE.Mesh(muzzlePadGeo, this.furMat);
    rightMuzzle.position.set(0.1, -0.11, 0.65);
    this.headGroup.add(rightMuzzle);

    // Cute tiny black triangular nose
    const noseGeo = new THREE.ConeGeometry(0.06, 0.07, 4);
    noseGeo.scale(1.3, 0.8, 0.9);
    const noseMesh = new THREE.Mesh(noseGeo, this.noseMat);
    noseMesh.position.set(0, -0.06, 0.72);
    noseMesh.rotation.x = Math.PI * 0.65;
    noseMesh.rotation.y = Math.PI * 0.25;
    this.headGroup.add(noseMesh);

    // Smiling open mouth
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.18, 0.62);

    // Open mouth cavity
    const mouthCavityGeo = new THREE.CylinderGeometry(0.09, 0.04, 0.09, 12, 1, false, 0, Math.PI);
    mouthCavityGeo.scale(1.1, 0.8, 0.6);
    const mouthCavity = new THREE.Mesh(mouthCavityGeo, this.mouthInnerMat);
    mouthCavity.rotation.x = Math.PI * 0.5;
    mouthGroup.add(mouthCavity);

    // Cute little pink tongue
    const tongueGeo = new THREE.SphereGeometry(0.07, 12, 10);
    tongueGeo.scale(0.85, 0.45, 1.2);
    const tongueMesh = new THREE.Mesh(tongueGeo, this.tongueMat);
    tongueMesh.position.set(0, -0.03, 0.05);
    mouthGroup.add(tongueMesh);

    this.headGroup.add(mouthGroup);

    // Delicate Whiskers (3 on each cheek)
    const createWhiskers = (isLeft) => {
      const whiskersGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      const angles = [0.15, -0.04, -0.22];
      angles.forEach((ang, idx) => {
        const whiskerCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(sign * 0.25, ang * 0.5 - 0.02, 0.05),
          new THREE.Vector3(sign * 0.55, ang - 0.08, -0.02)
        ]);
        const whiskerGeo = new THREE.TubeGeometry(whiskerCurve, 10, 0.006, 4, false);
        const whiskerMesh = new THREE.Mesh(whiskerGeo, this.whiskerMat);
        whiskersGroup.add(whiskerMesh);
      });

      whiskersGroup.position.set(sign * 0.16, -0.1, 0.65);
      return whiskersGroup;
    };

    this.leftWhiskers = createWhiskers(true);
    this.rightWhiskers = createWhiskers(false);
    this.headGroup.add(this.leftWhiskers);
    this.headGroup.add(this.rightWhiskers);

    // Assemble root structure
    this.group.add(this.bodyGroup);
    this.group.add(this.headGroup);

    // Register clickable meshes for raycasting
    this.group.traverse(child => {
      if (child.isMesh) {
        child.userData.isCat = true;
        child.userData.catInstance = this;
        this.clickableMeshes.push(child);
      }
    });
  }

  positionCat() {
    // Perched in foreground planted neatly on grassy mound
    this.group.position.set(-0.95, 0.46, 3.2);
    this.baseY = this.group.position.y;
    this.group.rotation.y = 0.2;
    this.group.scale.setScalar(1.08);
  }

  // Click / Tap Reaction!
  triggerInteraction() {
    if (this.isReacting) return;
    this.isReacting = true;
    this.reactionProgress = 0;

    if (window.soundManager) {
      window.soundManager.playMeow();
    }
  }

  update(delta, elapsed) {
    this.animTime += delta;

    // 1. Gentle Idle Breathing (chest scale)
    const breath = Math.sin(this.animTime * 2.4) * 0.025;
    this.torsoMesh.scale.set(0.82 + breath * 0.4, 1.08 + breath, 0.85 + breath * 0.6);

    // 2. Playful Tail Sway & Curl
    const tailSway = Math.sin(this.animTime * 2.8) * 0.25;
    const tailLift = Math.cos(this.animTime * 1.4) * 0.08;
    this.tailGroup.rotation.y = tailSway;
    this.tailGroup.rotation.z = tailLift;

    // Hover response: smooth ear perk (~2.5 deg) and catchlight sparkle
    this.hoverAmount += (this.targetHoverAmount - this.hoverAmount) * Math.min(1, delta * 7.0);
    const hoverEarPerk = this.hoverAmount * 0.045;

    if (this.catchlights.length > 0) {
      const catchScale = 1.0 + this.hoverAmount * 0.22;
      for (let i = 0; i < this.catchlights.length; i++) {
        this.catchlights[i].scale.setScalar(catchScale);
      }
    }

    // 3. Periodic Ear Twitch
    this.earTwitchTimer += delta;
    if (this.earTwitchTimer > 4.2) {
      this.currentEarTwitch = Math.random() < 0.5 ? 1 : 2; // 1: left, 2: right
      this.earTwitchTimer = 0;
    }

    if (this.currentEarTwitch > 0) {
      const twitch = Math.sin(this.earTwitchTimer * 28) * 0.18;
      if (this.currentEarTwitch === 1) {
        this.leftEar.rotation.z = -0.12 - hoverEarPerk + twitch;
      } else {
        this.rightEar.rotation.z = 0.12 + hoverEarPerk - twitch;
      }
      if (this.earTwitchTimer > 0.4) {
        this.currentEarTwitch = 0;
        this.leftEar.rotation.z = -0.12 - hoverEarPerk;
        this.rightEar.rotation.z = 0.12 + hoverEarPerk;
      }
    } else if (!this.isReacting) {
      this.leftEar.rotation.z = -0.12 - hoverEarPerk;
      this.rightEar.rotation.z = 0.12 + hoverEarPerk;
    }

    // 4. Subtle Curious Head Tilt
    const headTilt = Math.sin(this.animTime * 1.2) * 0.04;
    const headBob = Math.cos(this.animTime * 2.4) * 0.015;
    this.headGroup.rotation.z = headTilt;
    this.headGroup.rotation.y = Math.sin(this.animTime * 0.8) * 0.05;
    this.headGroup.position.y = 1.62 + headBob;

    // 5. Interactive Click Reaction Animation
    if (this.isReacting) {
      this.reactionProgress += delta * 2.8;

      if (this.reactionProgress <= 1.0) {
        // Joyful perk-up hop & head tilt
        const jumpY = Math.sin(this.reactionProgress * Math.PI) * 0.32;
        this.group.position.y = this.baseY + jumpY;

        const perk = Math.sin(this.reactionProgress * Math.PI);
        this.headGroup.rotation.z = headTilt + perk * 0.25;
        this.leftEar.rotation.z = -0.12 - hoverEarPerk - perk * 0.18;
        this.rightEar.rotation.z = 0.12 + hoverEarPerk + perk * 0.18;
        this.tailGroup.rotation.y = tailSway + Math.sin(this.reactionProgress * Math.PI * 4) * 0.45;
      } else {
        this.isReacting = false;
        this.reactionProgress = 0;
        this.group.position.y = this.baseY;
        this.leftEar.rotation.z = -0.12 - hoverEarPerk;
        this.rightEar.rotation.z = 0.12 + hoverEarPerk;
      }
    }
  }
}

window.CuteCat = CuteCat;

/**
 * Drosophila melanogaster Connectome & FlyGym Biomechanical Engine
 * ================================================================
 * Generates and simulates:
 * 1. 3D Whole-CNS Connectome (Brain + Ventral Nerve Cord, 20+ Anatomical Neuropils)
 * 2. 3D Morphological Neuron Skeletons (Optic, Central Complex E-PG, Kenyon Cells, Descending Motor DNa01)
 * 3. Real-Time Action Potential Pulses & Synaptic Neurotransmitter Transmission
 * 4. 3D Articulated Biomechanical Fruit Fly (FlyGym / NeuroMechFly) with Tripod Gait
 */
import * as THREE from 'three';

export class FlyConnectomeEngine {
  /**
   * Builds the anatomical 3D neuropil compartmental volume meshes of the fly brain & VNC
   */
  static buildNeuropilCompartments() {
    const group = new THREE.Group();
    group.name = 'DrosophilaNeuropilsGroup';

    // Neuropil specifications with anatomical metric coordinates (micrometers scaled to 3D units)
    const neuropils = [
      // Central Complex (Heading & Navigation Hub)
      { name: 'Ellipsoid Body (EB)', type: 'torus', pos: [0, 0.25, 0], scale: [0.65, 0.65, 0.22], color: 0x10b981, desc: '360° Heading Compass (E-PG Ring Attractor)' },
      { name: 'Fan-shaped Body (FB)', type: 'box', pos: [0, 0.55, -0.15], scale: [1.2, 0.45, 0.35], color: 0x22c55e, desc: 'Steering Vector & Goal Direction' },
      { name: 'Protocerebral Bridge (PB)', type: 'curve', pos: [0, 0.85, -0.3], scale: [1.8, 0.25, 0.2], color: 0x84cc16, desc: 'Bilateral Phase-Shifting Network' },
      { name: 'Noduli (NO)', type: 'sphere', pos: [-0.25, 0.1, -0.1], scale: [0.22, 0.22, 0.22], color: 0x14b8a6, desc: 'Angular & Translational Velocity' },
      { name: 'Noduli R (NO)', type: 'sphere', pos: [0.25, 0.1, -0.1], scale: [0.22, 0.22, 0.22], color: 0x14b8a6, desc: 'Angular & Translational Velocity' },

      // Mushroom Bodies (Learning, Olfaction & Memory)
      { name: 'Mushroom Body Calyx Left', type: 'sphere', pos: [-1.0, 0.9, -0.6], scale: [0.6, 0.55, 0.55], color: 0xec4899, desc: 'Kenyon Cell Dendrites (Odor Input)' },
      { name: 'Mushroom Body Calyx Right', type: 'sphere', pos: [1.0, 0.9, -0.6], scale: [0.6, 0.55, 0.55], color: 0xec4899, desc: 'Kenyon Cell Dendrites (Odor Input)' },
      { name: 'Mushroom Body Lobes Left (α/β/γ)', type: 'cylinder', pos: [-0.65, 0.35, 0.2], scale: [0.25, 0.9, 0.25], color: 0xf43f5e, desc: 'Dopaminergic Modulation & Recall' },
      { name: 'Mushroom Body Lobes Right (α/β/γ)', type: 'cylinder', pos: [0.65, 0.35, 0.2], scale: [0.25, 0.9, 0.25], color: 0xf43f5e, desc: 'Dopaminergic Modulation & Recall' },

      // Antennal Lobes (Primary Olfaction)
      { name: 'Antennal Lobe Left (AL_L)', type: 'sphere', pos: [-0.55, -0.25, 0.45], scale: [0.45, 0.45, 0.4], color: 0xf59e0b, desc: '54 Olfactory Glomeruli' },
      { name: 'Antennal Lobe Right (AL_R)', type: 'sphere', pos: [0.55, -0.25, 0.45], scale: [0.45, 0.45, 0.4], color: 0xf59e0b, desc: '54 Olfactory Glomeruli' },

      // Optic Lobes (Compound Eye Vision & Motion)
      { name: 'Medulla Left (ME_L)', type: 'box', pos: [-2.1, 0.4, 0.1], scale: [0.75, 1.4, 0.9], color: 0x06b6d4, desc: 'Retinotopic Columns (Mi1, Tm1)' },
      { name: 'Medulla Right (ME_R)', type: 'box', pos: [2.1, 0.4, 0.1], scale: [0.75, 1.4, 0.9], color: 0x06b6d4, desc: 'Retinotopic Columns (Mi1, Tm1)' },
      { name: 'Lobula Left (LO_L)', type: 'sphere', pos: [-1.45, 0.35, -0.2], scale: [0.65, 1.1, 0.65], color: 0x3b82f6, desc: 'Visual Feature & Shape Processing' },
      { name: 'Lobula Right (LO_R)', type: 'sphere', pos: [1.45, 0.35, -0.2], scale: [0.65, 1.1, 0.65], color: 0x3b82f6, desc: 'Visual Feature & Shape Processing' },
      { name: 'Lobula Plate Left (LOP_L)', type: 'box', pos: [-1.75, 0.4, -0.55], scale: [0.4, 0.95, 0.7], color: 0x6366f1, desc: 'Optical Flow & Rotational Motion (LPTC)' },
      { name: 'Lobula Plate Right (LOP_R)', type: 'box', pos: [1.75, 0.4, -0.55], scale: [0.4, 0.95, 0.7], color: 0x6366f1, desc: 'Optical Flow & Rotational Motion (LPTC)' },

      // Subesophageal Zone (Gnathal ganglion / feeding & grooming)
      { name: 'Subesophageal Zone (SEZ)', type: 'sphere', pos: [0, -0.7, 0.1], scale: [0.95, 0.6, 0.75], color: 0xa855f7, desc: 'Taste Processing & Proboscis Extension' },

      // Ventral Nerve Cord (VNC - Thoracic & Abdominal Locomotion CPG)
      { name: 'VNC Cervical Connective', type: 'cylinder', pos: [0, -1.35, -0.1], scale: [0.22, 0.8, 0.22], color: 0x0284c7, desc: 'Descending & Ascending Axon Highway' },
      { name: 'Prothoracic Neuropil (T1)', type: 'box', pos: [0, -2.0, -0.15], scale: [1.1, 0.55, 0.7], color: 0x0284c7, desc: 'Front Legs (L1/R1) Motor Center' },
      { name: 'Mesothoracic Neuropil (T2)', type: 'box', pos: [0, -2.6, -0.2], scale: [1.3, 0.6, 0.8], color: 0x2563eb, desc: 'Middle Legs (L2/R2) & Wings Motor Center' },
      { name: 'Metathoracic Neuropil (T3)', type: 'box', pos: [0, -3.2, -0.25], scale: [1.1, 0.55, 0.7], color: 0x1d4ed8, desc: 'Hind Legs (L3/R3) Motor Center' },
      { name: 'Abdominal Neuropil (AN)', type: 'sphere', pos: [0, -3.8, -0.3], scale: [0.75, 0.7, 0.55], color: 0x4338ca, desc: 'Abdomen & Genital Ganglion' },
    ];

    neuropils.forEach((np) => {
      let geo;
      if (np.type === 'torus') {
        geo = new THREE.TorusGeometry(np.scale[0], np.scale[2], 16, 32);
      } else if (np.type === 'cylinder') {
        geo = new THREE.CylinderGeometry(np.scale[0], np.scale[0], np.scale[1], 20);
      } else if (np.type === 'box') {
        geo = new THREE.BoxGeometry(np.scale[0], np.scale[1], np.scale[2]);
      } else {
        geo = new THREE.SphereGeometry(np.scale[0], 24, 20);
      }

      // Semi-transparent glowing holographic material (inspired by Janelia Neuroglancer)
      const mat = new THREE.MeshPhysicalMaterial({
        color: np.color,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.32,
        transmission: 0.55,
        wireframe: false,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...np.pos);
      if (np.type === 'torus') {
        mesh.rotation.x = Math.PI / 2;
      }
      mesh.userData = {
        name: np.name,
        category: 'Neuropilo Anatómico',
        description: np.desc,
        colorHex: `#${np.color.toString(16).padStart(6, '0')}`
      };
      group.add(mesh);

      // Fine contour wireframe
      const wireMat = new THREE.MeshBasicMaterial({
        color: np.color,
        wireframe: true,
        transparent: true,
        opacity: 0.18
      });
      const wire = new THREE.Mesh(geo, wireMat);
      wire.position.set(...np.pos);
      if (np.type === 'torus') wire.rotation.x = Math.PI / 2;
      group.add(wire);
    });

    return group;
  }

  /**
   * Builds high-resolution 3D neuronal skeletons representing key canonical circuits
   */
  static buildNeuronSkeletons() {
    const group = new THREE.Group();
    group.name = 'DrosophilaNeuronsGroup';

    // 1. Central Complex E-PG Compass Ring Attractor (Ring of heading neurons)
    const ringRadius = 0.65;
    const ringY = 0.25;
    const epgCount = 16;
    const epgPoints = [];

    for (let i = 0; i < epgCount; i++) {
      const angle = (i / epgCount) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius * 0.4;
      epgPoints.push(new THREE.Vector3(x, ringY, z));

      // Dendrite projection up into Protocerebral Bridge
      const pbTarget = new THREE.Vector3(
        (i - epgCount / 2) * 0.11,
        0.85,
        -0.3 + Math.sin(angle) * 0.05
      );

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, ringY, z),
        new THREE.Vector3(x * 0.7, 0.5, -0.1),
        pbTarget
      ]);

      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.018, 6, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x059669,
        emissiveIntensity: 0.45,
        roughness: 0.3
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.userData = {
        name: `E-PG Brújula Heading ${i + 1}/${epgCount}`,
        class: 'E-PG Neuron (Compass)',
        neurotransmitter: 'Acetylcholine (Excitatorio)'
      };
      group.add(tubeMesh);
    }

    // 2. Descending Neurons DNa01 / DNa02 (Brain to VNC motor commands)
    const dnLeftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 0.45, 0.1), // Brain dendritic tree
      new THREE.Vector3(-0.15, -0.4, 0.05),
      new THREE.Vector3(-0.06, -1.35, -0.1), // Cervical connective
      new THREE.Vector3(-0.25, -2.0, -0.15), // T1 Front leg motor branch
      new THREE.Vector3(-0.35, -2.6, -0.2),  // T2 Middle leg motor branch
      new THREE.Vector3(-0.2, -3.2, -0.25)   // T3 Hind leg motor branch
    ]);

    const dnRightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.4, 0.45, 0.1),
      new THREE.Vector3(0.15, -0.4, 0.05),
      new THREE.Vector3(0.06, -1.35, -0.1),
      new THREE.Vector3(0.25, -2.0, -0.15),
      new THREE.Vector3(0.35, -2.6, -0.2),
      new THREE.Vector3(0.2, -3.2, -0.25)
    ]);

    [dnLeftCurve, dnRightCurve].forEach((c, idx) => {
      const dnGeo = new THREE.TubeGeometry(c, 32, 0.032, 8, false);
      const dnMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.2
      });
      const dnMesh = new THREE.Mesh(dnGeo, dnMat);
      dnMesh.userData = {
        name: `Neurona Descendente Motora ${idx === 0 ? 'DNa01-L' : 'DNa01-R'}`,
        class: 'Descending Motor Neuron (Locomotion Command)',
        neurotransmitter: 'Acetylcholine / Glutamato'
      };
      group.add(dnMesh);
    });

    // 3. Mushroom Body Kenyon Cells (Learning & Dopamine Reward Circuit)
    for (let k = 0; k < 12; k++) {
      const side = k % 2 === 0 ? -1 : 1;
      const offsetX = (k * 0.04) * side;
      const kcCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 1.0 + offsetX, 0.9, -0.6 + (k * 0.03)), // Calyx claw
        new THREE.Vector3(side * 0.6 + offsetX * 0.5, 0.65, -0.3), // Pedunculus trunk
        new THREE.Vector3(side * 0.65, 0.35, 0.2 + (k * 0.02)) // Vertical & medial lobes
      ]);

      const kcGeo = new THREE.TubeGeometry(kcCurve, 18, 0.014, 6, false);
      const kcMat = new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        emissive: 0xdb2777,
        emissiveIntensity: 0.5,
        roughness: 0.3
      });
      const kcMesh = new THREE.Mesh(kcGeo, kcMat);
      kcMesh.userData = {
        name: `Célula de Kenyon KC-${k + 1}`,
        class: 'Kenyon Cell (Mushroom Body)',
        neurotransmitter: 'Acetylcholine (Modulado por Dopamina)'
      };
      group.add(kcMesh);
    }

    return { neuronGroup: group, epgPoints, dnLeftCurve, dnRightCurve };
  }

  /**
   * Action potential pulse particles that travel continuously along the connectome
   */
  static createActionPotentialSystem() {
    const pulseCount = 80;
    const positions = new Float32Array(pulseCount * 3);
    const colors = new Float32Array(pulseCount * 3);

    for (let i = 0; i < pulseCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      colors[i * 3] = 0.2 + Math.random() * 0.8;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.9;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Glowing particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#38bdf8');
    grad.addColorStop(0.7, '#0284c7');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Points(geo, mat);
  }

  /**
   * Builds the 3D Biomechanical Virtual Fly (FlyGym / NeuroMechFly)
   * Articulated fruit fly body with head, compound eyes, thorax, abdomen, wings, and 6 legs
   */
  static buildFlyGymModel() {
    const flyRoot = new THREE.Group();
    flyRoot.name = 'FlyGymDrosophilaModel';

    // Natural chitin & exoskeleton materials
    const chitinDark = new THREE.MeshStandardMaterial({
      color: 0x3d2714, // Dark amber chitin
      roughness: 0.35,
      metalness: 0.25
    });

    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0xb91c1c, // Vibrant ommatidia red
      roughness: 0.15,
      metalness: 0.3,
      clearcoat: 0.8
    });

    const wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.1,
      transmission: 0.92,
      transparent: true,
      opacity: 0.55,
      ior: 1.45,
      side: THREE.DoubleSide
    });

    // 1. Thorax (Center of mass)
    const thoraxGeo = new THREE.SphereGeometry(0.55, 20, 16);
    thoraxGeo.scale(1.0, 1.15, 1.4);
    const thorax = new THREE.Mesh(thoraxGeo, chitinDark);
    thorax.position.set(0, 0.8, 0);
    thorax.castShadow = true;
    flyRoot.add(thorax);

    // 2. Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.92, 0.82);

    const headGeo = new THREE.SphereGeometry(0.38, 18, 16);
    headGeo.scale(1.15, 0.95, 0.95);
    const headMesh = new THREE.Mesh(headGeo, chitinDark);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Left Compound Eye
    const eyeGeo = new THREE.SphereGeometry(0.24, 16, 14);
    eyeGeo.scale(0.85, 1.1, 1.25);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.28, 0.08, 0.06);
    leftEye.rotation.y = -0.35;
    headGroup.add(leftEye);

    // Right Compound Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.28, 0.08, 0.06);
    rightEye.rotation.y = 0.35;
    headGroup.add(rightEye);

    // Antennae with arista bristles
    [-0.08, 0.08].forEach(ax => {
      const antCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(ax, 0.1, 0.35),
        new THREE.Vector3(ax * 1.5, 0.24, 0.52),
        new THREE.Vector3(ax * 2.2, 0.32, 0.65)
      ]);
      const antGeo = new THREE.TubeGeometry(antCurve, 8, 0.012, 5, false);
      const antMesh = new THREE.Mesh(antGeo, chitinDark);
      headGroup.add(antMesh);
    });

    flyRoot.add(headGroup);

    // 3. Abdomen (Segmented striped pattern)
    const abdomenGroup = new THREE.Group();
    abdomenGroup.position.set(0, 0.68, -0.85);

    const abdGeo = new THREE.SphereGeometry(0.58, 20, 16);
    abdGeo.scale(0.92, 0.88, 1.75);
    const abdMesh = new THREE.Mesh(abdGeo, chitinDark);
    abdMesh.rotation.x = -0.15;
    abdMesh.castShadow = true;
    abdomenGroup.add(abdMesh);
    flyRoot.add(abdomenGroup);

    // 4. Wings (Left & Right with delicate venation)
    const wingGeo = new THREE.PlaneGeometry(1.0, 2.3);
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.35, 1.25, -0.6);
    leftWing.rotation.x = Math.PI / 2 - 0.15;
    leftWing.rotation.z = 0.35;
    flyRoot.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.35, 1.25, -0.6);
    rightWing.rotation.x = Math.PI / 2 - 0.15;
    rightWing.rotation.z = -0.35;
    flyRoot.add(rightWing);

    // 5. 6 Articulated Legs (Tripod Locomotion System)
    // L1/R1 (Front), L2/R2 (Middle), L3/R3 (Hind)
    const legData = [
      { id: 'L1', side: -1, z: 0.35, angle: 0.45 },
      { id: 'R1', side: 1, z: 0.35, angle: -0.45 },
      { id: 'L2', side: -1, z: -0.05, angle: 0.1 },
      { id: 'R2', side: 1, z: -0.05, angle: -0.1 },
      { id: 'L3', side: -1, z: -0.45, angle: -0.35 },
      { id: 'R3', side: 1, z: -0.45, angle: 0.35 },
    ];

    const legNodes = {};

    legData.forEach(l => {
      const legRoot = new THREE.Group();
      legRoot.position.set(l.side * 0.42, 0.65, l.z);

      // Coxa
      const coxa = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.28), chitinDark);
      coxa.rotation.z = l.side * 0.7;
      coxa.position.set(l.side * 0.12, 0, 0);
      legRoot.add(coxa);

      // Femur
      const femurGroup = new THREE.Group();
      femurGroup.position.set(l.side * 0.25, 0.08, 0);
      const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.55), chitinDark);
      femur.rotation.z = l.side * 1.0;
      femur.position.set(l.side * 0.22, 0.1, 0);
      femurGroup.add(femur);

      // Tibia
      const tibiaGroup = new THREE.Group();
      tibiaGroup.position.set(l.side * 0.45, 0.2, 0);
      const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.02, 0.65), chitinDark);
      tibia.rotation.z = -l.side * 0.75;
      tibia.position.set(l.side * 0.22, -0.28, 0);
      tibiaGroup.add(tibia);

      // Tarsi / Claws (Contact points with ground)
      const tarsus = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.01, 0.32), chitinDark);
      tarsus.position.set(l.side * 0.42, -0.65, 0);
      tibiaGroup.add(tarsus);

      femurGroup.add(tibiaGroup);
      legRoot.add(femurGroup);
      flyRoot.add(legRoot);

      legNodes[l.id] = { legRoot, femurGroup, tibiaGroup, side: l.side, phaseOffset: l.id === 'L1' || l.id === 'R2' || l.id === 'L3' ? 0 : Math.PI };
    });

    return { flyRoot, headGroup, leftWing, rightWing, legNodes };
  }

  /**
   * Updates tripod walking gait kinematics based on motor neuron frequency
   */
  static updateTripodGait(legNodes, timeSec, speed = 1.0) {
    if (!legNodes) return;
    const freq = 4.2 * speed; // 4.2 Hz standard fly walking frequency

    Object.values(legNodes).forEach(leg => {
      const t = timeSec * freq * Math.PI * 2 + leg.phaseOffset;
      const swing = Math.sin(t);
      const lift = Math.max(0, Math.cos(t));

      // Femur swing forward & backward
      leg.femurGroup.rotation.y = swing * 0.35 * leg.side;
      leg.femurGroup.rotation.z = (leg.side * 1.0) - (lift * 0.25);

      // Tibia flexion/extension
      leg.tibiaGroup.rotation.z = (-leg.side * 0.75) + (lift * 0.35);
    });
  }

  /**
   * Updates 3D flight kinematics and high-frequency wing beat flutter
   * (Drosophila wing beat frequency ~200Hz, rendered as fast trigonometric flutter)
   */
  static updateFlightKinematics(wings, legNodes, timeSec, isFlying) {
    if (!wings) return;
    const { leftWing, rightWing } = wings;

    if (isFlying) {
      // High-speed wing oscillation during flight
      const wingBeatFreq = 50.0; // Rendered visual frequency
      const stroke = Math.sin(timeSec * wingBeatFreq) * 0.85;
      const pitch = Math.cos(timeSec * wingBeatFreq) * 0.28;

      if (leftWing) {
        leftWing.rotation.z = 0.45 + stroke;
        leftWing.rotation.x = Math.PI / 2 - 0.2 + pitch;
      }
      if (rightWing) {
        rightWing.rotation.z = -0.45 - stroke;
        rightWing.rotation.x = Math.PI / 2 - 0.2 + pitch;
      }

      // In flight, legs retract and tuck into a streamlined aerodynamic posture
      if (legNodes) {
        Object.values(legNodes).forEach(leg => {
          leg.femurGroup.rotation.y = THREE.MathUtils.lerp(leg.femurGroup.rotation.y, 0, 0.1);
          leg.femurGroup.rotation.z = THREE.MathUtils.lerp(leg.femurGroup.rotation.z, leg.side * 1.35, 0.1);
          leg.tibiaGroup.rotation.z = THREE.MathUtils.lerp(leg.tibiaGroup.rotation.z, -leg.side * 1.15, 0.1);
        });
      }
    } else {
      // When walking or resting, wings fold back smoothly across the abdomen
      if (leftWing) {
        leftWing.rotation.z = THREE.MathUtils.lerp(leftWing.rotation.z, 0.25, 0.1);
        leftWing.rotation.x = THREE.MathUtils.lerp(leftWing.rotation.x, Math.PI / 2 - 0.1, 0.1);
      }
      if (rightWing) {
        rightWing.rotation.z = THREE.MathUtils.lerp(rightWing.rotation.z, -0.25, 0.1);
        rightWing.rotation.x = THREE.MathUtils.lerp(rightWing.rotation.x, Math.PI / 2 - 0.1, 0.1);
      }
    }
  }
}

/**
 * Palette of Household Odorous Products for Scent Testing
 * Real biological olfaction profiles for Drosophila melanogaster
 */
export const HOUSEHOLD_ODOR_PRODUCTS = [
  {
    id: 'banana_ripe',
    name: 'Plátano Maduro',
    icon: '🍌',
    compound: 'Acetato de Isoamilo / Etanol',
    category: 'Fruta Fermentada',
    color: '#eab308',
    colorHex: 0xeab308,
    emissive: 0xca8a04,
    naturalValence: 0.92,
    kcPattern: [1, 0, 1, 0, 0, 1, 0, 0],
    reactionType: 'attraction',
    glomerulus: 'DM1 / DM4 (Or42b)',
    description: 'Atracción extrema apetitiva. Señal de azúcar y nutrición inmediata. Estimula vuelo de aproximación y extensión de probóscide.'
  },
  {
    id: 'apple_vinegar',
    name: 'Vinagre de Manzana',
    icon: '🍷',
    compound: 'Ácido Acético (AcA) / Acetato de Etilo',
    category: 'Fermentación Ácida',
    color: '#ef4444',
    colorHex: 0xef4444,
    emissive: 0xb91c1c,
    naturalValence: 0.85,
    kcPattern: [1, 1, 0, 0, 0, 1, 0, 0],
    reactionType: 'attraction',
    glomerulus: 'VA2 / DM1 (Or42b, Or92a)',
    description: 'Fuerte atractivo olfativo. Indica fermentación acética activa, hábitat clásico de ovoposición y alimentación.'
  },
  {
    id: 'bread_yeast',
    name: 'Levadura de Pan',
    icon: '🍞',
    compound: 'Trehalosa / 2-Feniletanol / Etanol',
    category: 'Levadura & Nutrición',
    color: '#d97706',
    colorHex: 0xd97706,
    emissive: 0xb45309,
    naturalValence: 0.88,
    kcPattern: [0, 1, 1, 0, 0, 0, 1, 0],
    reactionType: 'attraction',
    glomerulus: 'VM2 / VA1v',
    description: 'Atracción proteica vital. Las moscas necesitan levadura para ovogénesis y síntesis de aminoácidos.'
  },
  {
    id: 'honey_sugar',
    name: 'Miel & Azúcar',
    icon: '🍯',
    compound: 'Sacarosa / Fructosa / Glucosa',
    category: 'Carbohidratos Puros',
    color: '#f59e0b',
    colorHex: 0xf59e0b,
    emissive: 0xd97706,
    naturalValence: 0.95,
    kcPattern: [1, 0, 0, 1, 0, 1, 0, 0],
    reactionType: 'attraction',
    glomerulus: 'Gr5a (Gnatál / SEZ)',
    description: 'Recompensa gustativa máxima. Desencadena danza de alimentación y extensión completa del aparato bucal.'
  },
  {
    id: 'lemon_citrus',
    name: 'Cáscara de Limón',
    icon: '🍋',
    compound: 'D-Limoneno / Citral',
    category: 'Cítrico Repelente',
    color: '#84cc16',
    colorHex: 0x84cc16,
    emissive: 0x65a30d,
    naturalValence: -0.65,
    kcPattern: [0, 0, 0, 1, 1, 0, 0, 1],
    reactionType: 'repulsion',
    glomerulus: 'Or85a / DL5',
    description: 'Repelente natural. El limoneno es tóxico para larvas y ahuyenta a la mosca adulta mediante reflejo aversivo.'
  },
  {
    id: 'ground_coffee',
    name: 'Café Molido',
    icon: '☕',
    compound: 'Cafeína / 2-Etilpirazina / Amargor',
    category: 'Amargo / Inhibidor',
    color: '#78350f',
    colorHex: 0x78350f,
    emissive: 0x451a03,
    naturalValence: -0.50,
    kcPattern: [0, 1, 0, 0, 1, 0, 1, 0],
    reactionType: 'repulsion',
    glomerulus: 'Gr66a (Receptores amargos)',
    description: 'Rechazo por amargor. La cafeína actúa como insecticida natural en altas concentraciones; inhibe la puesta de huevos.'
  },
  {
    id: 'crushed_garlic',
    name: 'Ajo Picado',
    icon: '🧄',
    compound: 'Alacina / Disulfuro de Dialilo',
    category: 'Irritante Sulfurador',
    color: '#f8fafc',
    colorHex: 0xf8fafc,
    emissive: 0x94a3b8,
    naturalValence: -0.88,
    kcPattern: [0, 0, 0, 0, 1, 0, 1, 1],
    reactionType: 'repulsion',
    glomerulus: 'TRPA1 (Quimiosensorial nociceptivo)',
    description: 'Fuerte repelente nociceptivo. Los vapores sulfurados activan canales de dolor celular (TRPA1); provoca despegue y escape inmediato.'
  },
  {
    id: 'lavender_soap',
    name: 'Jabón de Lavanda',
    icon: '🧼',
    compound: 'Linalool / Tensoactivos sintéticos',
    category: 'Limpieza / Químico',
    color: '#c084fc',
    colorHex: 0xc084fc,
    emissive: 0x9333ea,
    naturalValence: -0.72,
    kcPattern: [0, 0, 1, 0, 1, 0, 0, 1],
    reactionType: 'repulsion',
    glomerulus: 'Or67a / Or10a',
    description: 'Repulsión química. Altera la tensión superficial de los tarsos e induce desorientación olfativa.'
  },
  {
    id: 'fresh_mint',
    name: 'Menta Fresca',
    icon: '🌿',
    compound: 'Mentol / 1,8-Cineol',
    category: 'Aromático / Repelente',
    color: '#10b981',
    colorHex: 0x10b981,
    emissive: 0x059669,
    naturalValence: -0.60,
    kcPattern: [0, 0, 0, 1, 0, 1, 1, 0],
    reactionType: 'repulsion',
    glomerulus: 'TRPM8 / Or49a',
    description: 'Repulsión térmica sensorial. El mentol activa termorreceptores de frío/química, alejando a la mosca de la columna de aire.'
  }
];

/**
 * Biologically Realistic Drosophila Mushroom Body Associative Learning Engine
 * ============================================================================
 * Implements the canonical Kenyon Cell (KC) -> MBON synaptic plasticity circuit
 * gated by Dopaminergic Neurons (PAM cluster = Reward, PPL1 cluster = Punishment).
 */
export class FlyLearningMemoryEngine {
  constructor() {
    this.stimuli = HOUSEHOLD_ODOR_PRODUCTS;

    // Synaptic weights from 8 Kenyon Cell clusters to MBON populations
    // In naive flies, initial weights are neutral (0.5)
    this.weightsApproach = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    this.weightsAvoidance = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

    // Learning parameters
    this.learningRate = 0.24;
    this.minWeight = 0.05;
    this.maxWeight = 0.95;

    // Memory status
    this.shortTermMemory = 0; // 0 to 100%
    this.longTermMemory = 0;  // Consolidated memory (CREB-dependent)
    this.trialsCount = 0;
    this.lastConditioningEvent = null;
  }

  /**
   * Applies Dopaminergic Reinforcement Learning (Dopamine-gated Plasticity)
   * In Drosophila:
   * - REWARD (Sugar / PAM DANs): Depresses KC -> MBON_avoidance synapses via LTD.
   *   Result: Net valence shifts to ATTRACCIÓN (approach).
   * - PUNISHMENT (Shock / PPL1 DANs): Depresses KC -> MBON_approach synapses via LTD.
   *   Result: Net valence shifts to AVERSIÓN (avoidance).
   */
  train(stimulusIndex, reinforcementType = 'reward') {
    const stimulus = this.stimuli[stimulusIndex];
    if (!stimulus) return null;

    const pattern = stimulus.kcPattern;
    this.trialsCount += 1;

    let deltaSum = 0;

    pattern.forEach((active, i) => {
      if (active) {
        if (reinforcementType === 'reward') {
          // Depress avoidance synapses
          const delta = this.learningRate * (this.weightsAvoidance[i] - this.minWeight);
          this.weightsAvoidance[i] = Math.max(this.minWeight, this.weightsAvoidance[i] - delta);
          deltaSum += delta;
        } else if (reinforcementType === 'punishment') {
          // Depress approach synapses
          const delta = this.learningRate * (this.weightsApproach[i] - this.minWeight);
          this.weightsApproach[i] = Math.max(this.minWeight, this.weightsApproach[i] - delta);
          deltaSum += delta;
        }
      }
    });

    // Update Memory Consolidations
    this.shortTermMemory = Math.min(100, Math.round(this.shortTermMemory + 35));
    if (this.trialsCount >= 3) {
      // Repetition triggers Long-Term Memory (CREB gene transcription)
      this.longTermMemory = Math.min(100, Math.round(this.longTermMemory + 25));
    }

    const valence = this.getNetValence(stimulusIndex);
    this.lastConditioningEvent = {
      stimulus: stimulus.name,
      type: reinforcementType,
      valence,
      timestamp: Date.now()
    };

    return {
      stimulus,
      reinforcementType,
      valence,
      shortTermMemory: this.shortTermMemory,
      longTermMemory: this.longTermMemory,
      trialsCount: this.trialsCount
    };
  }

  /**
   * Calculates net behavioral valence (-1.0 = strong avoidance, +1.0 = strong approach)
   */
  getNetValence(stimulusIndex) {
    const stimulus = this.stimuli[stimulusIndex];
    if (!stimulus) return 0;

    let approachDrive = 0;
    let avoidanceDrive = 0;
    let count = 0;

    stimulus.kcPattern.forEach((active, i) => {
      if (active) {
        approachDrive += this.weightsApproach[i];
        avoidanceDrive += this.weightsAvoidance[i];
        count += 1;
      }
    });

    const learnedNet = count > 0 ? (approachDrive - avoidanceDrive) / count : 0;
    const baseline = stimulus.naturalValence || 0;
    // When naive (0 trials), express innate biological valence; with trials, experience modulates valence
    const combined = this.trialsCount === 0 ? baseline : (baseline * 0.3 + learnedNet * 0.7);
    return parseFloat(combined.toFixed(2));
  }

  /**
   * Passive forgetting / memory decay over time
   */
  decayMemory(deltaSec) {
    if (this.shortTermMemory > 0) {
      // Short-term memory decays gradually
      const decayRate = 0.5 * deltaSec;
      this.shortTermMemory = Math.max(0, this.shortTermMemory - decayRate);
    }
  }

  /**
   * Resets synaptic weights back to naive baseline
   */
  reset() {
    this.weightsApproach = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    this.weightsAvoidance = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    this.shortTermMemory = 0;
    this.longTermMemory = 0;
    this.trialsCount = 0;
    this.lastConditioningEvent = null;
  }
}


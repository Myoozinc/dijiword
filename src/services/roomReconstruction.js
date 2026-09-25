/**
 * Room Reconstruction & 3D Procedural Assets Service
 * Builds Three.js PointClouds, Textured Room Meshes, CAD Blueprints and 3D Simulation Assets
 */
import * as THREE from 'three';

export class RoomReconstruction {
  /**
   * Create dynamic PointCloud from spatial points
   */
  static createPointCloud(points, mode = 'rgb') {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    let minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    const heightRange = Math.max(0.1, maxY - minY);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      if (mode === 'rgb') {
        colors[i * 3] = p.r ?? 0.2;
        colors[i * 3 + 1] = p.g ?? 0.7;
        colors[i * 3 + 2] = p.b ?? 0.9;
      } else if (mode === 'thermal') {
        // Distance heatmap: blue -> cyan -> yellow -> red
        const dist = Math.sqrt(p.x * p.x + p.z * p.z);
        const norm = Math.min(1.0, Math.max(0, (dist - 0.8) / 4.0));
        const color = new THREE.Color().setHSL(0.66 * (1.0 - norm), 1.0, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      } else if (mode === 'height') {
        // Height gradient (floor to ceiling)
        const normY = Math.min(1.0, Math.max(0, (p.y - minY) / heightRange));
        const color = new THREE.Color().setHSL(0.55 + normY * 0.45, 0.9, 0.55);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom circle particle texture
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const ctx = particleCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Procedural parquet wooden floor texture
   */
  static createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base oak wood color
    ctx.fillStyle = '#b88958';
    ctx.fillRect(0, 0, 512, 512);

    // Plank lines
    const planks = 8;
    const plankH = 512 / planks;

    for (let i = 0; i < planks; i++) {
      const y = i * plankH;
      // Slight wood tone variance
      const tone = (i % 2 === 0) ? '#be9160' : '#b28352';
      ctx.fillStyle = tone;
      ctx.fillRect(0, y, 512, plankH);

      // Plank grooves
      ctx.strokeStyle = 'rgba(60, 40, 20, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      // Vertical stagger joints
      const staggers = [0.35, 0.75, 0.2, 0.6, 0.85];
      const jointX = (staggers[i % staggers.length]) * 512;
      ctx.beginPath();
      ctx.moveTo(jointX, y);
      ctx.lineTo(jointX, y + plankH);
      ctx.stroke();
    }

    // Subtle grain
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let g = 0; g < 400; g++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 40 + 10, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  /**
   * Procedural modern wall texture with subtle plaster texture
   */
  static createWallTexture(wallName) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Soft warm modern off-white wall
    ctx.fillStyle = '#e8ebed';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle noise plaster
    for (let i = 0; i < 2000; i++) {
      const alpha = Math.random() * 0.04;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Build complete 3D Textured Room Mesh with Floor, Ceiling, Walls, Baseboards & Window
   */
  static buildRoomMesh(bounds, keyframes = []) {
    const group = new THREE.Group();
    group.name = 'RoomMeshGroup';

    const { width, length, height, min, max, center } = bounds;

    const floorTex = this.createFloorTexture();
    const wallTex = this.createWallTexture();

    // 1. Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.45,
      metalness: 0.1,
      side: THREE.FrontSide
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(center.x, min.y, center.z);
    floorMesh.receiveShadow = true;
    floorMesh.name = 'FloorMesh';
    group.add(floorMesh);

    // 2. Ceiling Mesh
    const ceilingGeo = new THREE.PlaneGeometry(width, length);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xf3f4f6,
      roughness: 0.9,
      side: THREE.BackSide
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = -Math.PI / 2;
    ceilingMesh.position.set(center.x, max.y, center.z);
    ceilingMesh.name = 'CeilingMesh';
    group.add(ceilingMesh);

    // 3. Walls Material
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // North Wall (Z = min.z)
    const northGeo = new THREE.PlaneGeometry(width, height);
    const northMesh = new THREE.Mesh(northGeo, wallMat);
    northMesh.position.set(center.x, center.y, min.z);
    northMesh.receiveShadow = true;
    group.add(northMesh);

    // South Wall (Z = max.z)
    const southGeo = new THREE.PlaneGeometry(width, height);
    const southMesh = new THREE.Mesh(southGeo, wallMat);
    southMesh.position.set(center.x, center.y, max.z);
    southMesh.rotation.y = Math.PI;
    southMesh.receiveShadow = true;
    group.add(southMesh);

    // East Wall (X = max.x)
    const eastGeo = new THREE.PlaneGeometry(length, height);
    const eastMesh = new THREE.Mesh(eastGeo, wallMat);
    eastMesh.position.set(max.x, center.y, center.z);
    eastMesh.rotation.y = -Math.PI / 2;
    eastMesh.receiveShadow = true;
    group.add(eastMesh);

    // West Wall (X = min.x) - with Architectural Panoramic Window
    const westGroup = new THREE.Group();
    westGroup.position.set(min.x, center.y, center.z);
    westGroup.rotation.y = Math.PI / 2;

    // Window frame
    const winWidth = Math.min(2.4, length * 0.6);
    const winHeight = Math.min(1.6, height * 0.6);

    const leftWallW = (length - winWidth) / 2;
    if (leftWallW > 0.2) {
      const leftGeo = new THREE.PlaneGeometry(leftWallW, height);
      const leftMesh = new THREE.Mesh(leftGeo, wallMat);
      leftMesh.position.x = -(winWidth / 2 + leftWallW / 2);
      westGroup.add(leftMesh);

      const rightGeo = new THREE.PlaneGeometry(leftWallW, height);
      const rightMesh = new THREE.Mesh(rightGeo, wallMat);
      rightMesh.position.x = (winWidth / 2 + leftWallW / 2);
      westGroup.add(rightMesh);
    }

    // Glass Window Pane
    const glassGeo = new THREE.PlaneGeometry(winWidth, winHeight);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.9,
      opacity: 0.4,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.5,
      side: THREE.DoubleSide
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    westGroup.add(glassMesh);

    // Window Frame Trim
    const frameGeo = new THREE.BoxGeometry(winWidth + 0.1, winHeight + 0.1, 0.06);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    westGroup.add(frameMesh);

    group.add(westGroup);

    // 4. White Baseboard Trims along the floor
    const trimHeight = 0.08;
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    
    // North trim
    const nTrimGeo = new THREE.BoxGeometry(width, trimHeight, 0.02);
    const nTrim = new THREE.Mesh(nTrimGeo, trimMat);
    nTrim.position.set(center.x, min.y + trimHeight / 2, min.z + 0.01);
    group.add(nTrim);

    // South trim
    const sTrim = new THREE.Mesh(nTrimGeo, trimMat);
    sTrim.position.set(center.x, min.y + trimHeight / 2, max.z - 0.01);
    group.add(sTrim);

    return group;
  }

  /**
   * Build Wireframe / CAD Blueprint representation with dimensional guides
   */
  static buildWireframeCAD(bounds) {
    const group = new THREE.Group();
    group.name = 'CADWireframeGroup';

    const { width, length, height, min, max, center } = bounds;

    // Room Box Wireframe
    const boxGeo = new THREE.BoxGeometry(width, height, length);
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4, // Cyan blueprint glow
      linewidth: 1.5,
      transparent: true,
      opacity: 0.8
    });
    const boxWire = new THREE.LineSegments(wireGeo, wireMat);
    boxWire.position.set(center.x, center.y, center.z);
    group.add(boxWire);

    // Grid on floor
    const grid = new THREE.GridHelper(Math.max(width, length) * 1.2, Math.round(Math.max(width, length) * 2), 0x06b6d4, 0x1e293b);
    grid.position.set(center.x, min.y + 0.005, center.z);
    group.add(grid);

    return group;
  }

  /**
   * Procedural Furniture Generator
   * High performance 3D components for space layout simulation
   */
  static createFurniture(type, position = { x: 0, y: 0, z: 0 }, rotationY = 0) {
    const item = new THREE.Group();
    item.userData = { type, id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` };

    switch (type) {
      case 'sofa': {
        // Modern 3-seater fabric sofa
        const fabricMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });

        // Base seat cushion
        const seatGeo = new THREE.BoxGeometry(2.1, 0.35, 0.85);
        const seat = new THREE.Mesh(seatGeo, fabricMat);
        seat.position.y = 0.35 / 2 + 0.12;
        seat.castShadow = true;
        seat.receiveShadow = true;
        item.add(seat);

        // Backrest
        const backGeo = new THREE.BoxGeometry(2.1, 0.45, 0.2);
        const back = new THREE.Mesh(backGeo, fabricMat);
        back.position.set(0, 0.55, -0.32);
        back.castShadow = true;
        item.add(back);

        // Armrests
        const armGeo = new THREE.BoxGeometry(0.2, 0.35, 0.85);
        const leftArm = new THREE.Mesh(armGeo, fabricMat);
        leftArm.position.set(-1.05, 0.42, 0);
        leftArm.castShadow = true;
        item.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, fabricMat);
        rightArm.position.set(1.05, 0.42, 0);
        rightArm.castShadow = true;
        item.add(rightArm);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.12);
        [[-0.95, -0.35], [0.95, -0.35], [-0.95, 0.35], [0.95, 0.35]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.set(lx, 0.06, lz);
          item.add(leg);
        });
        break;
      }

      case 'bed': {
        // Queen bed with pillows and mattress
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
        const sheetMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });

        // Bed frame
        const frameGeo = new THREE.BoxGeometry(1.7, 0.25, 2.1);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 0.15;
        frame.castShadow = true;
        item.add(frame);

        // Mattress
        const mattGeo = new THREE.BoxGeometry(1.6, 0.25, 2.0);
        const matt = new THREE.Mesh(mattGeo, sheetMat);
        matt.position.y = 0.38;
        matt.castShadow = true;
        item.add(matt);

        // Headboard
        const headGeo = new THREE.BoxGeometry(1.7, 0.75, 0.12);
        const head = new THREE.Mesh(headGeo, frameMat);
        head.position.set(0, 0.55, -1.0);
        head.castShadow = true;
        item.add(head);

        // Pillows
        const pilGeo = new THREE.BoxGeometry(0.55, 0.12, 0.35);
        const p1 = new THREE.Mesh(pilGeo, pillowMat);
        p1.position.set(-0.4, 0.53, -0.7);
        p1.rotation.x = -0.15;
        item.add(p1);

        const p2 = new THREE.Mesh(pilGeo, pillowMat);
        p2.position.set(0.4, 0.53, -0.7);
        p2.rotation.x = -0.15;
        item.add(p2);
        break;
      }

      case 'desk': {
        // Work desk with monitor and laptop
        const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });

        // Tabletop
        const topGeo = new THREE.BoxGeometry(1.4, 0.05, 0.75);
        const top = new THREE.Mesh(topGeo, woodMat);
        top.position.y = 0.75;
        top.castShadow = true;
        item.add(top);

        // 4 Legs
        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.73);
        [[-0.65, -0.32], [0.65, -0.32], [-0.65, 0.32], [0.65, 0.32]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, steelMat);
          leg.position.set(lx, 0.365, lz);
          item.add(leg);
        });

        // Ultrawide curved monitor on desk
        const monMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 });
        const monGeo = new THREE.BoxGeometry(0.7, 0.32, 0.03);
        const mon = new THREE.Mesh(monGeo, monMat);
        mon.position.set(0, 0.98, -0.2);
        item.add(mon);

        // Monitor stand
        const standGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18);
        const stand = new THREE.Mesh(standGeo, steelMat);
        stand.position.set(0, 0.84, -0.2);
        item.add(stand);
        break;
      }

      case 'dining': {
        // Round dining table with chairs
        const tableMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
        const legMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });

        // Round tabletop
        const topGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.04, 32);
        const top = new THREE.Mesh(topGeo, tableMat);
        top.position.y = 0.74;
        top.castShadow = true;
        item.add(top);

        // Central pillar leg
        const centerLegGeo = new THREE.CylinderGeometry(0.08, 0.15, 0.72, 16);
        const centerLeg = new THREE.Mesh(centerLegGeo, legMat);
        centerLeg.position.y = 0.36;
        item.add(centerLeg);
        break;
      }

      case 'plant': {
        // Indoor monstera potted plant
        const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const plantMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

        // Ceramic pot
        const potGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.45, 24);
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.y = 0.225;
        pot.castShadow = true;
        item.add(pot);

        // Green leaves (procedural fans)
        for (let i = 0; i < 7; i++) {
          const leafGeo = new THREE.PlaneGeometry(0.25, 0.4);
          const leaf = new THREE.Mesh(leafGeo, plantMat);
          const angle = (i / 7) * Math.PI * 2;
          leaf.position.set(Math.cos(angle) * 0.12, 0.48 + (i % 3) * 0.08, Math.sin(angle) * 0.12);
          leaf.rotation.x = 0.6;
          leaf.rotation.y = angle;
          leaf.rotation.z = -0.3;
          item.add(leaf);
        }
        break;
      }

      case 'lamp': {
        // Scandinavian tripod standing floor lamp with working light point!
        const lampMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });

        // Shade
        const shadeGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.3, 24, 1, true);
        const shade = new THREE.Mesh(shadeGeo, lampMat);
        shade.position.y = 1.45;
        item.add(shade);

        // Tripod legs
        const legGeo = new THREE.CylinderGeometry(0.015, 0.01, 1.45);
        for (let a = 0; a < 3; a++) {
          const angle = (a / 3) * Math.PI * 2;
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.set(Math.cos(angle) * 0.2, 0.725, Math.sin(angle) * 0.2);
          leg.rotation.x = Math.sin(angle) * 0.12;
          leg.rotation.z = -Math.cos(angle) * 0.12;
          item.add(leg);
        }

        // Functional warm point light inside lamp
        const lampLight = new THREE.PointLight(0xffedd5, 1.5, 4.5);
        lampLight.position.y = 1.45;
        lampLight.castShadow = true;
        item.add(lampLight);
        break;
      }

      case 'tv': {
        // 65-inch Smart TV on modern media unit
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1 });
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const consoleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });

        // Media unit
        const consoleGeo = new THREE.BoxGeometry(1.8, 0.35, 0.4);
        const con = new THREE.Mesh(consoleGeo, consoleMat);
        con.position.y = 0.175;
        con.castShadow = true;
        item.add(con);

        // TV Frame
        const tvGeo = new THREE.BoxGeometry(1.45, 0.85, 0.04);
        const tv = new THREE.Mesh(tvGeo, blackMat);
        tv.position.set(0, 0.82, 0);
        item.add(tv);

        // Screen
        const scrGeo = new THREE.PlaneGeometry(1.4, 0.8);
        const scr = new THREE.Mesh(scrGeo, screenMat);
        scr.position.set(0, 0.82, 0.022);
        item.add(scr);
        break;
      }

      case 'mannequin': {
        // 1:1 Scale Human Avatar for spatial ergonomics comparison (1.75m height)
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4, metalness: 0.1 });

        // Head
        const headGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.63;
        item.add(head);

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.65, 16);
        const torso = new THREE.Mesh(torsoGeo, skinMat);
        torso.position.y = 1.2;
        torso.castShadow = true;
        item.add(torso);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.85, 12);
        const leftLeg = new THREE.Mesh(legGeo, skinMat);
        leftLeg.position.set(-0.1, 0.425, 0);
        item.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, skinMat);
        rightLeg.position.set(0.1, 0.425, 0);
        item.add(rightLeg);
        break;
      }

      default:
        break;
    }

    item.position.set(position.x, position.y, position.z);
    item.rotation.y = rotationY;
    return item;
  }

  /**
   * Pre-scanned high-fidelity presets for instant simulation testing
   */
  static getPresetRooms() {
    return [
      {
        id: 'preset_apartment',
        name: 'Apartamento de Diseño',
        category: 'Residencial',
        description: 'Sala de estar moderna con luz natural, ventanal amplio y suelo de roble.',
        bounds: {
          width: 4.6,
          length: 3.8,
          height: 2.7,
          area: 17.48,
          volume: 47.2,
          min: { x: -2.3, y: 0, z: -1.9 },
          max: { x: 2.3, y: 2.7, z: 1.9 },
          center: { x: 0, y: 1.35, z: 0 }
        },
        points: this.generateProceduralPoints(4.6, 3.8, 2.7, 4500),
        defaultItems: [
          { type: 'sofa', position: { x: 0, y: 0, z: 0.8 }, rotationY: Math.PI },
          { type: 'tv', position: { x: 0, y: 0, z: -1.6 }, rotationY: 0 },
          { type: 'plant', position: { x: -1.8, y: 0, z: -1.5 }, rotationY: 0 },
          { type: 'lamp', position: { x: 1.8, y: 0, z: 1.4 }, rotationY: 0 }
        ]
      },
      {
        id: 'preset_office',
        name: 'Estudio Creativo & Tech',
        category: 'Oficina / Trabajo',
        description: 'Espacio de trabajo diáfano con estación tecnológica ergonómica y plano de planta CAD.',
        bounds: {
          width: 5.2,
          length: 4.2,
          height: 2.8,
          area: 21.84,
          volume: 61.15,
          min: { x: -2.6, y: 0, z: -2.1 },
          max: { x: 2.6, y: 2.8, z: 2.1 },
          center: { x: 0, y: 1.4, z: 0 }
        },
        points: this.generateProceduralPoints(5.2, 4.2, 2.8, 6000),
        defaultItems: [
          { type: 'desk', position: { x: 0, y: 0, z: -1.2 }, rotationY: 0 },
          { type: 'mannequin', position: { x: 0, y: 0, z: -0.6 }, rotationY: Math.PI },
          { type: 'plant', position: { x: 2.0, y: 0, z: -1.7 }, rotationY: 0 },
          { type: 'lamp', position: { x: -2.0, y: 0, z: -1.6 }, rotationY: 0 }
        ]
      },
      {
        id: 'preset_bedroom',
        name: 'Dormitorio Minimalista',
        category: 'Dormitorio',
        description: 'Habitación acogedora con cama matrimonial, iluminación suave y cálculo de cotas.',
        bounds: {
          width: 3.8,
          length: 3.4,
          height: 2.6,
          area: 12.92,
          volume: 33.59,
          min: { x: -1.9, y: 0, z: -1.7 },
          max: { x: 1.9, y: 2.6, z: 1.7 },
          center: { x: 0, y: 1.3, z: 0 }
        },
        points: this.generateProceduralPoints(3.8, 3.4, 2.6, 3800),
        defaultItems: [
          { type: 'bed', position: { x: 0, y: 0, z: -0.4 }, rotationY: 0 },
          { type: 'lamp', position: { x: -1.4, y: 0, z: -1.2 }, rotationY: 0 },
          { type: 'plant', position: { x: 1.4, y: 0, z: 1.2 }, rotationY: 0 }
        ]
      }
    ];
  }

  /**
   * Generates realistic spatial point clouds matching real room laser/camera scans
   */
  static generateProceduralPoints(w, l, h, count = 4000) {
    const points = [];
    const halfW = w / 2;
    const halfL = l / 2;

    for (let i = 0; i < count; i++) {
      const surface = Math.random();
      let x = 0, y = 0, z = 0;
      let r = 0.8, g = 0.8, b = 0.85;

      if (surface < 0.35) {
        // Floor points
        x = (Math.random() - 0.5) * w;
        y = Math.random() * 0.05;
        z = (Math.random() - 0.5) * l;
        r = 0.72 + Math.random() * 0.1;
        g = 0.54 + Math.random() * 0.1;
        b = 0.35 + Math.random() * 0.1; // wood tone
      } else if (surface < 0.5) {
        // Ceiling points
        x = (Math.random() - 0.5) * w;
        y = h - Math.random() * 0.05;
        z = (Math.random() - 0.5) * l;
        r = 0.95; g = 0.95; b = 0.98;
      } else {
        // Wall points (North, South, East, West)
        const wallSide = Math.floor(Math.random() * 4);
        y = Math.random() * h;
        const noise = (Math.random() - 0.5) * 0.06;

        if (wallSide === 0) {
          x = (Math.random() - 0.5) * w;
          z = -halfL + noise;
        } else if (wallSide === 1) {
          x = (Math.random() - 0.5) * w;
          z = halfL + noise;
        } else if (wallSide === 2) {
          x = halfW + noise;
          z = (Math.random() - 0.5) * l;
        } else {
          x = -halfW + noise;
          z = (Math.random() - 0.5) * l;
        }
        r = 0.85 + Math.random() * 0.1;
        g = 0.88 + Math.random() * 0.1;
        b = 0.92;
      }

      points.push({
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        z: Number(z.toFixed(3)),
        r, g, b
      });
    }
    return points;
  }
}

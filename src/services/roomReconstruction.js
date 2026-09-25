/**
 * High-Fidelity Room Reconstruction & 3D Procedural Assets Service
 * Photorealistic materials, real texture projection, lighting fixtures & AI detected objects
 */
import * as THREE from 'three';

export class RoomReconstruction {
  /**
   * Create dynamic PointCloud from spatial points with vibrant shaders
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
        const normY = Math.min(1.0, Math.max(0, (p.y - minY) / heightRange));
        const color = new THREE.Color().setHSL(0.55 + normY * 0.45, 0.9, 0.55);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom circle particle texture with glowing core
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 64;
    particleCanvas.height = 64;
    const ctx = particleCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(34,211,238,0.9)');
    grad.addColorStop(0.7, 'rgba(6,182,212,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Photorealistic parquet wooden floor with reflections & bevels
   */
  static createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Rich warm oak background
    ctx.fillStyle = '#b38050';
    ctx.fillRect(0, 0, 1024, 1024);

    const rows = 12;
    const rowH = 1024 / rows;
    const cols = 6;
    const colW = 1024 / cols;

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const offsetX = (r % 3) * (colW * 0.4);

      for (let c = -1; c <= cols + 1; c++) {
        const x = c * colW + offsetX;

        // Subtle plank tone variance
        const toneRand = Math.sin(r * 12.3 + c * 4.7);
        const plankColor = toneRand > 0.3 ? '#ba8857' : toneRand < -0.3 ? '#a87545' : '#b17d4b';
        ctx.fillStyle = plankColor;
        ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

        // Wood grain streaks
        ctx.fillStyle = 'rgba(70, 40, 15, 0.06)';
        for (let g = 0; g < 15; g++) {
          const gy = y + Math.random() * rowH;
          ctx.fillRect(x + 2, gy, colW - 4, 1 + Math.random() * 2);
        }

        // Deep groove border
        ctx.strokeStyle = 'rgba(40, 20, 5, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, colW, rowH);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  /**
   * Architectural wall texture with subtle warm plaster finish
   */
  static createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0f3f6';
    ctx.fillRect(0, 0, 512, 512);

    // Fine plaster noise
    for (let i = 0; i < 3000; i++) {
      const alpha = Math.random() * 0.035;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Procedural outdoor backdrop texture (City skyline & blue sky)
   */
  static createOutdoorBackdropTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(0.6, '#bae6fd');
    skyGrad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Distant city silhouette
    ctx.fillStyle = '#94a3b8';
    let cx = 0;
    while (cx < 1024) {
      const bw = 30 + Math.random() * 60;
      const bh = 80 + Math.random() * 140;
      ctx.fillRect(cx, 400 - bh, bw, bh);

      // Windows
      ctx.fillStyle = '#fef08a';
      for (let wy = 400 - bh + 10; wy < 390; wy += 14) {
        for (let wx = cx + 6; wx < cx + bw - 6; wx += 10) {
          if (Math.random() > 0.3) ctx.fillRect(wx, wy, 4, 6);
        }
      }
      ctx.fillStyle = '#94a3b8';
      cx += bw + 8;
    }

    // Lush green trees horizon
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(200, 410, 70, 0, Math.PI * 2);
    ctx.arc(350, 415, 80, 0, Math.PI * 2);
    ctx.arc(700, 410, 75, 0, Math.PI * 2);
    ctx.arc(880, 415, 85, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Build complete 3D Textured Room Mesh with Floor, Ceiling, Walls, Baseboards & Window
   */
  static buildRoomMesh(bounds, keyframes = [], showCeiling = false) {
    const group = new THREE.Group();
    group.name = 'RoomMeshGroup';

    const { width, length, height, min, max, center } = bounds;

    const floorTex = this.createFloorTexture();
    const wallTex = this.createWallTexture();

    // 1. Floor Mesh with subtle sheen
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.FrontSide
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(center.x, min.y, center.z);
    floorMesh.receiveShadow = true;
    floorMesh.name = 'FloorMesh';
    group.add(floorMesh);

    // 2. Ceiling Mesh (Semi-transparent or removable for Dollhouse simulation)
    const ceilingGeo = new THREE.PlaneGeometry(width, length);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: showCeiling ? 0.95 : 0.05 // Cutaway so sunlight and view enter room!
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = -Math.PI / 2;
    ceilingMesh.position.set(center.x, max.y, center.z);
    ceilingMesh.name = 'CeilingMesh';
    group.add(ceilingMesh);

    // 3. Walls Material
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.8,
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

    // West Wall (X = min.x) - Architectural Panoramic Window
    const westGroup = new THREE.Group();
    westGroup.position.set(min.x, center.y, center.z);
    westGroup.rotation.y = Math.PI / 2;

    const winWidth = Math.min(2.8, length * 0.75);
    const winHeight = Math.min(1.8, height * 0.7);

    const leftWallW = Math.max(0.1, (length - winWidth) / 2);
    if (leftWallW > 0.15) {
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
      color: 0xe0f2fe,
      transmission: 0.95,
      opacity: 0.35,
      transparent: true,
      roughness: 0.05,
      metalness: 0.1,
      ior: 1.5,
      side: THREE.DoubleSide
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    westGroup.add(glassMesh);

    // Window Frame Trim (Matte black aluminum)
    const frameGeo = new THREE.BoxGeometry(winWidth + 0.08, winHeight + 0.08, 0.05);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    westGroup.add(frameMesh);

    // Outdoor backdrop plane visible through the window!
    const backdropTex = this.createOutdoorBackdropTexture();
    const backdropGeo = new THREE.PlaneGeometry(winWidth * 2.2, winHeight * 1.8);
    const backdropMat = new THREE.MeshBasicMaterial({ map: backdropTex, side: THREE.DoubleSide });
    const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
    backdropMesh.position.set(0, 0, -3.5); // 3.5m outside window
    westGroup.add(backdropMesh);

    group.add(westGroup);

    // 4. Modern Baseboards along floor perimeter
    const trimHeight = 0.09;
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    
    const nTrimGeo = new THREE.BoxGeometry(width, trimHeight, 0.02);
    const nTrim = new THREE.Mesh(nTrimGeo, trimMat);
    nTrim.position.set(center.x, min.y + trimHeight / 2, min.z + 0.01);
    group.add(nTrim);

    const sTrim = new THREE.Mesh(nTrimGeo, trimMat);
    sTrim.position.set(center.x, min.y + trimHeight / 2, max.z - 0.01);
    group.add(sTrim);

    return group;
  }

  /**
   * Build Wireframe / CAD Blueprint representation
   */
  static buildWireframeCAD(bounds) {
    const group = new THREE.Group();
    group.name = 'CADWireframeGroup';

    const { width, length, height, min, max, center } = bounds;

    // Room Box Wireframe
    const boxGeo = new THREE.BoxGeometry(width, height, length);
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const boxWire = new THREE.LineSegments(wireGeo, wireMat);
    boxWire.position.set(center.x, center.y, center.z);
    group.add(boxWire);

    // Floor grid
    const grid = new THREE.GridHelper(Math.max(width, length) * 1.3, Math.round(Math.max(width, length) * 2), 0x22d3ee, 0x1e293b);
    grid.position.set(center.x, min.y + 0.005, center.z);
    group.add(grid);

    return group;
  }

  /**
   * Build Faithful Continuous 3D Surface Mesh from Scanned Points
   * Recreates the actual continuous physical topography and 3D relief of the room and furniture
   * Eliminates distorted slopes, fills floor cleanly, and models real elevation steps
   */
  static buildDenseSurfaceMesh(points, bounds) {
    if (!bounds || !bounds.min || !bounds.max) return new THREE.Group();

    const group = new THREE.Group();
    group.name = 'DenseSurfaceMeshGroup';

    const safePoints = Array.isArray(points) ? points : [];
    const { min, max } = bounds;
    const gridResX = 60;
    const gridResZ = 60;

    const stepX = (max.x - min.x) / gridResX;
    const stepZ = (max.z - min.z) / gridResZ;

    const cellCount = gridResX * gridResZ;
    const heightGrid = new Float32Array(cellCount);
    const colorGridR = new Float32Array(cellCount);
    const colorGridG = new Float32Array(cellCount);
    const colorGridB = new Float32Array(cellCount);
    const countGrid = new Uint16Array(cellCount);
    const sumYGrid = new Float32Array(cellCount);

    // Filter points and bin into grid
    // Exclude extreme ceiling outliers (above 85% room height) from floor surface topography
    const maxSurfaceHeight = Math.min(2.4, bounds.height * 0.85);

    for (const p of safePoints) {
      if (p.y > maxSurfaceHeight) continue; // Skip ceiling points for floor surface

      const gx = Math.floor((p.x - min.x) / stepX);
      const gz = Math.floor((p.z - min.z) / stepZ);

      if (gx >= 0 && gx < gridResX && gz >= 0 && gz < gridResZ) {
        const idx = gz * gridResX + gx;
        const py = Math.max(0, p.y);
        sumYGrid[idx] += py;
        colorGridR[idx] += (p.r ?? 0.6);
        colorGridG[idx] += (p.g ?? 0.6);
        colorGridB[idx] += (p.b ?? 0.6);
        countGrid[idx]++;
      }
    }

    // Default neutral floor tone (clean modern architectural slate)
    const defaultFloorR = 0.28;
    const defaultFloorG = 0.32;
    const defaultFloorB = 0.38;

    // Compute cell heights & colors
    for (let i = 0; i < cellCount; i++) {
      if (countGrid[i] > 0) {
        heightGrid[i] = Number((sumYGrid[i] / countGrid[i]).toFixed(3));
        colorGridR[i] = Number((colorGridR[i] / countGrid[i]).toFixed(3));
        colorGridG[i] = Number((colorGridG[i] / countGrid[i]).toFixed(3));
        colorGridB[i] = Number((colorGridB[i] / countGrid[i]).toFixed(3));
      } else {
        heightGrid[i] = 0; // Flat floor
        colorGridR[i] = defaultFloorR;
        colorGridG[i] = defaultFloorG;
        colorGridB[i] = defaultFloorB;
      }
    }

    const vertices = [];
    const colors = [];
    const indices = [];
    let vertIndex = 0;

    const vertMap = new Int32Array(cellCount).fill(-1);

    // Create primary surface vertices
    for (let gz = 0; gz < gridResZ; gz++) {
      for (let gx = 0; gx < gridResX; gx++) {
        const idx = gz * gridResX + gx;
        const x = min.x + (gx + 0.5) * stepX;
        const z = min.z + (gz + 0.5) * stepZ;
        const y = Math.max(0, heightGrid[idx]);

        vertices.push(x, y, z);
        colors.push(colorGridR[idx], colorGridG[idx], colorGridB[idx]);
        vertMap[idx] = vertIndex++;
      }
    }

    // Triangulate grid with smart elevation step handling
    // If delta Y between adjacent cells is large (> 0.40m), do NOT create stretched slanting triangles
    const maxSlopeDelta = 0.40;

    for (let gz = 0; gz < gridResZ - 1; gz++) {
      for (let gx = 0; gx < gridResX - 1; gx++) {
        const i0 = vertMap[gz * gridResX + gx];
        const i1 = vertMap[gz * gridResX + (gx + 1)];
        const i2 = vertMap[(gz + 1) * gridResX + gx];
        const i3 = vertMap[(gz + 1) * gridResX + (gx + 1)];

        const y0 = vertices[i0 * 3 + 1];
        const y1 = vertices[i1 * 3 + 1];
        const y2 = vertices[i2 * 3 + 1];
        const y3 = vertices[i3 * 3 + 1];

        // Triangle 1: (i0, i2, i1)
        const d01 = Math.abs(y0 - y1);
        const d02 = Math.abs(y0 - y2);
        const d12 = Math.abs(y1 - y2);

        if (d01 <= maxSlopeDelta && d02 <= maxSlopeDelta && d12 <= maxSlopeDelta) {
          indices.push(i0, i2, i1);
        }

        // Triangle 2: (i1, i2, i3)
        const d13 = Math.abs(y1 - y3);
        const d23 = Math.abs(y2 - y3);

        if (d13 <= maxSlopeDelta && d23 <= maxSlopeDelta && d12 <= maxSlopeDelta) {
          indices.push(i1, i2, i3);
        }

        // Vertical step skirts: If cell is elevated and neighbor is at ground level, create vertical wall face
        // Edge 0->1
        if (d01 > maxSlopeDelta) {
          const vFloorA = vertIndex++;
          const vFloorB = vertIndex++;
          vertices.push(vertices[i0 * 3], 0, vertices[i0 * 3 + 2]);
          colors.push(colorGridR[gz * gridResX + gx] * 0.8, colorGridG[gz * gridResX + gx] * 0.8, colorGridB[gz * gridResX + gx] * 0.8);
          vertices.push(vertices[i1 * 3], 0, vertices[i1 * 3 + 2]);
          colors.push(colorGridR[gz * gridResX + (gx + 1)] * 0.8, colorGridG[gz * gridResX + (gx + 1)] * 0.8, colorGridB[gz * gridResX + (gx + 1)] * 0.8);

          indices.push(i0, vFloorA, i1);
          indices.push(i1, vFloorA, vFloorB);
        }

        // Edge 0->2
        if (d02 > maxSlopeDelta) {
          const vFloorA = vertIndex++;
          const vFloorB = vertIndex++;
          vertices.push(vertices[i0 * 3], 0, vertices[i0 * 3 + 2]);
          colors.push(colorGridR[gz * gridResX + gx] * 0.8, colorGridG[gz * gridResX + gx] * 0.8, colorGridB[gz * gridResX + gx] * 0.8);
          vertices.push(vertices[i2 * 3], 0, vertices[i2 * 3 + 2]);
          colors.push(colorGridR[(gz + 1) * gridResX + gx] * 0.8, colorGridG[(gz + 1) * gridResX + gx] * 0.8, colorGridB[(gz + 1) * gridResX + gx] * 0.8);

          indices.push(i0, i2, vFloorA);
          indices.push(i2, vFloorB, vFloorA);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // High quality standard material with real vertex colors
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.6,
      metalness: 0.15,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    group.add(mesh);

    // Subtle Cyan Architectural Topography Contour Lines
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.14
    });
    const wireMesh = new THREE.Mesh(geo, wireMat);
    wireMesh.position.y += 0.002;
    group.add(wireMesh);

    return group;
  }

  /**
   * Create an AI Detected Object with Clean Architectural 3D Geometry
   * STRICTLY REMOVES FLOATING PHOTO CARDS AND FLOATING TEXT BADGES TO ELIMINATE SCENE CLUTTER
   */
  static createAIObjectMesh(detectedObj) {
    const cls = (detectedObj.class || '').toLowerCase().trim();

    // Never render mannequins or persons as permanent room objects
    if (cls.includes('person')) {
      return new THREE.Group();
    }

    const group = new THREE.Group();
    group.userData = {
      id: detectedObj.id,
      class: detectedObj.class,
      label: detectedObj.label,
      isAIObject: true
    };

    const { width = 1.0, height = 0.85, depth = 0.8 } = detectedObj.size3D || {};
    const pos = detectedObj.position3D || { x: 0, y: 0, z: 0 };

    // 1. Soft Floor Contact Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    sGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(width * 1.25, depth * 1.25);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.005;
    group.add(shadowMesh);

    // 2. Sculpted Physical 3D Shape based on class
    let object3D;
    if (cls.includes('couch') || cls.includes('sofa')) {
      object3D = this.createFurniture('sofa');
    } else if (cls.includes('bed')) {
      object3D = this.createFurniture('bed');
    } else if (cls.includes('desk')) {
      object3D = this.createFurniture('desk');
    } else if (cls.includes('table')) {
      object3D = this.createFurniture('dining');
    } else if (cls.includes('plant')) {
      object3D = this.createFurniture('plant');
    } else if (cls.includes('tv')) {
      object3D = this.createFurniture('tv');
    } else if (cls.includes('chair')) {
      // Sculpted 3D Chair
      const chairGroup = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), woodMat);
      seat.position.y = 0.45;
      chairGroup.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.05), woodMat);
      back.position.set(0, 0.68, -0.22);
      chairGroup.add(back);
      [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.45), woodMat);
        leg.position.set(lx, 0.225, lz);
        chairGroup.add(leg);
      });
      object3D = chairGroup;
    } else {
      // Clean Architectural Semi-Transparent Massing Box
      const boxGeo = new THREE.BoxGeometry(width, height, depth);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.35,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85
      });
      object3D = new THREE.Mesh(boxGeo, boxMat);
      object3D.position.y = height / 2;
    }

    object3D.castShadow = true;
    object3D.receiveShadow = true;
    group.add(object3D);

    // 3. Crisp Cyan Architectural Bounds Wireframe
    const wireBoxGeo = new THREE.BoxGeometry(width, height, depth);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(wireBoxGeo), wireMat);
    wire.position.y = height / 2;
    group.add(wire);

    // Set 3D world position (firmly grounded at floor level y = 0)
    group.position.set(pos.x, 0, pos.z);
    return group;
  }

  /**
   * Procedural Furniture Generator
   */
  static createFurniture(type, position = { x: 0, y: 0, z: 0 }, rotationY = 0) {
    const item = new THREE.Group();
    item.userData = { type, id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` };

    switch (type) {
      case 'sofa': {
        const fabricMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });

        const seatGeo = new THREE.BoxGeometry(2.1, 0.35, 0.85);
        const seat = new THREE.Mesh(seatGeo, fabricMat);
        seat.position.y = 0.35 / 2 + 0.12;
        seat.castShadow = true;
        seat.receiveShadow = true;
        item.add(seat);

        const backGeo = new THREE.BoxGeometry(2.1, 0.45, 0.2);
        const back = new THREE.Mesh(backGeo, fabricMat);
        back.position.set(0, 0.55, -0.32);
        back.castShadow = true;
        item.add(back);

        const armGeo = new THREE.BoxGeometry(0.2, 0.35, 0.85);
        const leftArm = new THREE.Mesh(armGeo, fabricMat);
        leftArm.position.set(-1.05, 0.42, 0);
        leftArm.castShadow = true;
        item.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, fabricMat);
        rightArm.position.set(1.05, 0.42, 0);
        rightArm.castShadow = true;
        item.add(rightArm);
        break;
      }

      case 'bed': {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
        const sheetMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });

        const frameGeo = new THREE.BoxGeometry(1.7, 0.25, 2.1);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 0.15;
        frame.castShadow = true;
        item.add(frame);

        const mattGeo = new THREE.BoxGeometry(1.6, 0.25, 2.0);
        const matt = new THREE.Mesh(mattGeo, sheetMat);
        matt.position.y = 0.38;
        matt.castShadow = true;
        item.add(matt);

        const headGeo = new THREE.BoxGeometry(1.7, 0.75, 0.12);
        const head = new THREE.Mesh(headGeo, frameMat);
        head.position.set(0, 0.55, -1.0);
        head.castShadow = true;
        item.add(head);

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
        const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });

        const topGeo = new THREE.BoxGeometry(1.4, 0.05, 0.75);
        const top = new THREE.Mesh(topGeo, woodMat);
        top.position.y = 0.75;
        top.castShadow = true;
        item.add(top);

        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.73);
        [[-0.65, -0.32], [0.65, -0.32], [-0.65, 0.32], [0.65, 0.32]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, steelMat);
          leg.position.set(lx, 0.365, lz);
          item.add(leg);
        });

        const monMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 });
        const monGeo = new THREE.BoxGeometry(0.7, 0.32, 0.03);
        const mon = new THREE.Mesh(monGeo, monMat);
        mon.position.set(0, 0.98, -0.2);
        item.add(mon);
        break;
      }

      case 'plant': {
        const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const plantMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

        const potGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.45, 24);
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.y = 0.225;
        pot.castShadow = true;
        item.add(pot);

        for (let i = 0; i < 7; i++) {
          const leafGeo = new THREE.PlaneGeometry(0.25, 0.4);
          const leaf = new THREE.Mesh(leafGeo, plantMat);
          const angle = (i / 7) * Math.PI * 2;
          leaf.position.set(Math.cos(angle) * 0.12, 0.48 + (i % 3) * 0.08, Math.sin(angle) * 0.12);
          leaf.rotation.x = 0.6;
          leaf.rotation.y = angle;
          item.add(leaf);
        }
        break;
      }

      case 'lamp': {
        const lampMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3, emissive: 0xfef08a, emissiveIntensity: 0.6 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });

        const shadeGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.3, 24);
        const shade = new THREE.Mesh(shadeGeo, lampMat);
        shade.position.y = 1.45;
        item.add(shade);

        const legGeo = new THREE.CylinderGeometry(0.015, 0.01, 1.45);
        for (let a = 0; a < 3; a++) {
          const angle = (a / 3) * Math.PI * 2;
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.set(Math.cos(angle) * 0.2, 0.725, Math.sin(angle) * 0.2);
          item.add(leg);
        }

        // Functional warm point light inside lamp
        const lampLight = new THREE.PointLight(0xffedd5, 2.0, 5.0);
        lampLight.position.y = 1.45;
        lampLight.castShadow = true;
        item.add(lampLight);
        break;
      }

      case 'mannequin': {
        // 1:1 Scale Human Avatar (1.75m height)
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4, metalness: 0.1 });

        const headGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.63;
        item.add(head);

        const torsoGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.65, 16);
        const torso = new THREE.Mesh(torsoGeo, skinMat);
        torso.position.y = 1.2;
        torso.castShadow = true;
        item.add(torso);

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
   * Pre-scanned high-fidelity presets
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
          { type: 'plant', position: { x: -1.8, y: 0, z: -1.5 }, rotationY: 0 },
          { type: 'lamp', position: { x: 1.8, y: 0, z: 1.4 }, rotationY: 0 }
        ],
        aiDetectedObjects: [
          {
            id: 'ai_sofa_1',
            class: 'couch',
            label: 'Sofá de Salón',
            score: 96,
            depth: 2.1,
            position3D: { x: 0, y: 0, z: 0.8 },
            size3D: { width: 2.1, height: 0.85, depth: 0.9 },
            timestamp: Date.now()
          },
          {
            id: 'ai_plant_1',
            class: 'potted plant',
            label: 'Planta de Interior',
            score: 91,
            depth: 2.4,
            position3D: { x: -1.8, y: 0, z: -1.5 },
            size3D: { width: 0.6, height: 0.9, depth: 0.6 },
            timestamp: Date.now()
          }
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
          { type: 'plant', position: { x: 2.0, y: 0, z: -1.7 }, rotationY: 0 },
          { type: 'lamp', position: { x: -2.0, y: 0, z: -1.6 }, rotationY: 0 }
        ],
        aiDetectedObjects: [
          {
            id: 'ai_desk_1',
            class: 'desk',
            label: 'Escritorio Tech',
            score: 94,
            depth: 1.8,
            position3D: { x: 0, y: 0, z: -1.2 },
            size3D: { width: 1.4, height: 0.75, depth: 0.8 },
            timestamp: Date.now()
          }
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
        ],
        aiDetectedObjects: [
          {
            id: 'ai_bed_1',
            class: 'bed',
            label: 'Cama Matrimonial',
            score: 97,
            depth: 2.0,
            position3D: { x: 0, y: 0, z: -0.4 },
            size3D: { width: 1.7, height: 0.9, depth: 2.1 },
            timestamp: Date.now()
          }
        ]
      }
    ];
  }

  static generateProceduralPoints(w, l, h, count = 4000) {
    const points = [];
    const halfW = w / 2;
    const halfL = l / 2;

    for (let i = 0; i < count; i++) {
      const surface = Math.random();
      let x = 0, y = 0, z = 0;
      let r = 0.8, g = 0.8, b = 0.85;

      if (surface < 0.35) {
        x = (Math.random() - 0.5) * w;
        y = Math.random() * 0.05;
        z = (Math.random() - 0.5) * l;
        r = 0.72 + Math.random() * 0.1;
        g = 0.54 + Math.random() * 0.1;
        b = 0.35 + Math.random() * 0.1;
      } else if (surface < 0.5) {
        x = (Math.random() - 0.5) * w;
        y = h - Math.random() * 0.05;
        z = (Math.random() - 0.5) * l;
        r = 0.95; g = 0.95; b = 0.98;
      } else {
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

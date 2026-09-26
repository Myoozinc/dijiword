/**
 * 3D Virtual Kitchen Environment for Drosophila melanogaster (FlyGym)
 * ===================================================================
 * A hyper-realistic 3D kitchen habitat designed for fruit fly behavioral simulation:
 * - Quartz kitchen island countertop with modern wood cabinetry
 * - Fruit bowl with ripe bananas (isoamyl acetate) & apples
 * - Open apple cider vinegar bottle (acetic acid) with removable cork
 * - Stainless steel sink with gooseneck faucet (water/humidity gradient)
 * - Wooden cutting board with sliced lemon & honey jar
 * - Organic kitchen trash bin (fermentation & amines)
 * - Overhead warm Edison pendant lamp (phototaxis flight attraction target)
 * - Subway tile backsplash wall, floating open shelves & kitchen floor
 */
import * as THREE from 'three';

export class KitchenEnvironment {
  /**
   * Builds the complete 3D Kitchen hierarchy
   */
  static buildKitchen() {
    const kitchenRoot = new THREE.Group();
    kitchenRoot.name = 'VirtualKitchenEnvironment';

    // Materials
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.18,
      metalness: 0.08
    });

    const cabinetWoodMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Modern slate navy cabinetry
      roughness: 0.5,
      metalness: 0.1
    });

    const stainlessMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.25,
      metalness: 0.85
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.1,
      metalness: 0.95
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xfef3c7,
      transmission: 0.88,
      opacity: 0.65,
      transparent: true,
      roughness: 0.12,
      ior: 1.52,
      thickness: 0.4
    });

    const woodBoardMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Amber butcher block wood
      roughness: 0.6,
      metalness: 0.05
    });

    const tileMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.05
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate tile floor
      roughness: 0.45,
      metalness: 0.15
    });

    // 1. Kitchen Floor
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    kitchenRoot.add(floorMesh);

    // Floor tile grid pattern
    const floorGrid = new THREE.GridHelper(12, 24, 0x475569, 0x1e293b);
    floorGrid.position.y = 0.002;
    kitchenRoot.add(floorGrid);

    // 2. Kitchen Island Base Cabinet (Width: 3.6m, Depth: 1.8m, Height: 0.95m)
    const cabinetGeo = new THREE.BoxGeometry(3.6, 0.95, 1.8);
    const cabinetMesh = new THREE.Mesh(cabinetGeo, cabinetWoodMat);
    cabinetMesh.position.set(0, 0.475, 0);
    cabinetMesh.castShadow = true;
    cabinetMesh.receiveShadow = true;
    kitchenRoot.add(cabinetMesh);

    // Cabinet toe kick recessed base
    const kickGeo = new THREE.BoxGeometry(3.4, 0.12, 1.6);
    const kickMesh = new THREE.Mesh(kickGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    kickMesh.position.set(0, 0.06, 0);
    kitchenRoot.add(kickMesh);

    // Cabinet door panels (4 front doors)
    for (let d = 0; d < 4; d++) {
      const doorX = -1.35 + d * 0.9;
      const doorGeo = new THREE.BoxGeometry(0.84, 0.78, 0.04);
      const doorMesh = new THREE.Mesh(doorGeo, cabinetWoodMat);
      doorMesh.position.set(doorX, 0.52, 0.91);
      kitchenRoot.add(doorMesh);

      // Chrome bar handle
      const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12);
      const handleMesh = new THREE.Mesh(handleGeo, chromeMat);
      handleMesh.position.set(doorX + (d % 2 === 0 ? 0.32 : -0.32), 0.72, 0.95);
      kitchenRoot.add(handleMesh);
    }

    // 3. Quartz Island Countertop (Height top at y = 1.02m)
    const counterGeo = new THREE.BoxGeometry(3.8, 0.07, 2.0);
    const counterMesh = new THREE.Mesh(counterGeo, marbleMat);
    counterMesh.position.set(0, 0.985, 0);
    counterMesh.castShadow = true;
    counterMesh.receiveShadow = true;
    kitchenRoot.add(counterMesh);

    // 4. Complete Enclosed Architectural Room Walls & Ceiling
    const wallPaintMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Deep slate modern wall
      roughness: 0.8,
      metalness: 0.05
    });

    // Back wall (with backsplash)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4.2, 0.1), tileMat);
    backWall.position.set(0, 2.1, -3.5);
    backWall.receiveShadow = true;
    kitchenRoot.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 8.0), wallPaintMat);
    leftWall.position.set(-4.8, 2.1, 0);
    leftWall.receiveShadow = true;
    kitchenRoot.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 8.0), wallPaintMat);
    rightWall.position.set(4.8, 2.1, 0);
    rightWall.receiveShadow = true;
    kitchenRoot.add(rightWall);

    // Front boundary wall with warm architectural framing
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4.2, 0.1), wallPaintMat);
    frontWall.position.set(0, 2.1, 3.8);
    frontWall.receiveShadow = true;
    kitchenRoot.add(frontWall);

    // Ceiling with recessed track lights
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = 3.6;
    kitchenRoot.add(ceilingMesh);

    // 4.5 Simulated Glass Terrarium Enclosure (Clear Glass Walls around Island)
    const glassTerrariumGroup = new THREE.Group();
    glassTerrariumGroup.name = 'SimulatedGlassTerrarium';

    const terrariumGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc, // Subtle light cyan glass tint
      transmission: 0.9,
      opacity: 0.22,
      transparent: true,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.48,
      side: THREE.DoubleSide
    });

    const frameMetalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.2
    });

    // Glass side panels (Countertop height 1.02m to 2.45m)
    const glassHeight = 1.42;
    const glassCenterY = 1.02 + glassHeight / 2;

    // Back glass panel
    const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(3.8, glassHeight), terrariumGlassMat);
    backGlass.position.set(0, glassCenterY, -1.02);
    glassTerrariumGroup.add(backGlass);

    // Front glass panel
    const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(3.8, glassHeight), terrariumGlassMat);
    frontGlass.position.set(0, glassCenterY, 1.02);
    glassTerrariumGroup.add(frontGlass);

    // Left glass panel
    const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.04, glassHeight), terrariumGlassMat);
    leftGlass.rotation.y = Math.PI / 2;
    leftGlass.position.set(-1.9, glassCenterY, 0);
    glassTerrariumGroup.add(leftGlass);

    // Right glass panel
    const rightGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.04, glassHeight), terrariumGlassMat);
    rightGlass.rotation.y = -Math.PI / 2;
    rightGlass.position.set(1.9, glassCenterY, 0);
    glassTerrariumGroup.add(rightGlass);

    // Top glass ceiling lid
    const topGlass = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.04), terrariumGlassMat);
    topGlass.rotation.x = Math.PI / 2;
    topGlass.position.set(0, 1.02 + glassHeight, 0);
    glassTerrariumGroup.add(topGlass);

    // 4 Corner Structural Bevel Pillars with subtle glow
    const postGeo = new THREE.CylinderGeometry(0.016, 0.016, glassHeight, 12);
    [
      [-1.9, -1.02],
      [1.9, -1.02],
      [-1.9, 1.02],
      [1.9, 1.02]
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, frameMetalMat);
      post.position.set(px, glassCenterY, pz);
      glassTerrariumGroup.add(post);
    });

    kitchenRoot.add(glassTerrariumGroup);

    // Floating wooden shelf
    const shelfGeo = new THREE.BoxGeometry(5.0, 0.06, 0.35);
    const shelfMesh = new THREE.Mesh(shelfGeo, woodBoardMat);
    shelfMesh.position.set(0, 2.4, -3.05);
    shelfMesh.castShadow = true;
    kitchenRoot.add(shelfMesh);

    // Spice jars and olive oil on shelf
    for (let s = 0; s < 5; s++) {
      const jarGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16);
      const jarMat = new THREE.MeshStandardMaterial({
        color: s === 2 ? 0x15803d : 0xd97706,
        roughness: 0.3
      });
      const jar = new THREE.Mesh(jarGeo, jarMat);
      jar.position.set(-1.2 + s * 0.6, 2.52, -3.05);
      kitchenRoot.add(jar);
    }

    // 5. Stainless Steel Inset Sink & Gooseneck Faucet
    const sinkGroup = new THREE.Group();
    sinkGroup.position.set(-1.1, 1.02, 0);

    const sinkBasinGeo = new THREE.BoxGeometry(0.75, 0.35, 0.55);
    const sinkBasinMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.8 });
    const sinkBasin = new THREE.Mesh(sinkBasinGeo, sinkBasinMat);
    sinkBasin.position.y = -0.15;
    sinkGroup.add(sinkBasin);

    // Water surface inside sink
    const waterGeo = new THREE.PlaneGeometry(0.7, 0.5);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.08;
    sinkGroup.add(waterMesh);

    // Gooseneck Faucet (Curved tube)
    const faucetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, -0.32),
      new THREE.Vector3(0, 0.35, -0.32),
      new THREE.Vector3(0, 0.48, -0.22),
      new THREE.Vector3(0, 0.44, -0.05),
      new THREE.Vector3(0, 0.36, -0.05)
    ]);
    const faucetGeo = new THREE.TubeGeometry(faucetCurve, 24, 0.022, 12, false);
    const faucetMesh = new THREE.Mesh(faucetGeo, chromeMat);
    faucetMesh.castShadow = true;
    sinkGroup.add(faucetMesh);

    kitchenRoot.add(sinkGroup);

    // 6. Fruit Bowl with Ripe Bananas & Apples (Primary Attraction Target)
    const fruitBowlGroup = new THREE.Group();
    fruitBowlGroup.position.set(0.65, 1.02, -0.35);

    // Ceramic fruit bowl
    const bowlGeo = new THREE.CylinderGeometry(0.45, 0.25, 0.22, 24, 1, true);
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, side: THREE.DoubleSide });
    const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
    bowlMesh.position.y = 0.11;
    bowlMesh.castShadow = true;
    fruitBowlGroup.add(bowlMesh);

    // Fruit bowl base
    const bowlBaseGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.03, 24);
    const bowlBase = new THREE.Mesh(bowlBaseGeo, bowlMat);
    bowlBase.position.y = 0.015;
    fruitBowlGroup.add(bowlBase);

    // 3 Bananas (Curved yellow chitin with brown ripe spots)
    const bananaMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4
    });
    [-0.12, 0.04, 0.16].forEach((bx, idx) => {
      const bCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(bx - 0.2, 0.14, -0.15 + idx * 0.12),
        new THREE.Vector3(bx, 0.22, 0.0 + idx * 0.08),
        new THREE.Vector3(bx + 0.22, 0.16, 0.15 + idx * 0.08)
      ]);
      const bGeo = new THREE.TubeGeometry(bCurve, 16, 0.042, 8, false);
      const bMesh = new THREE.Mesh(bGeo, bananaMat);
      bMesh.rotation.y = idx * 0.4;
      bMesh.castShadow = true;
      fruitBowlGroup.add(bMesh);
    });

    // 2 Apples (Red Gala & Green Granny Smith)
    const redAppleMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25 });
    const greenAppleMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.25 });

    const appleGeo = new THREE.SphereGeometry(0.11, 16, 16);
    appleGeo.scale(1.0, 0.95, 1.0);

    const redApple = new THREE.Mesh(appleGeo, redAppleMat);
    redApple.position.set(-0.16, 0.16, 0.08);
    redApple.castShadow = true;
    fruitBowlGroup.add(redApple);

    const greenApple = new THREE.Mesh(appleGeo, greenAppleMat);
    greenApple.position.set(0.18, 0.17, -0.05);
    greenApple.castShadow = true;
    fruitBowlGroup.add(greenApple);

    // Luminous halo around fruit bowl
    const fruitHaloGeo = new THREE.RingGeometry(0.52, 0.62, 32);
    const fruitHaloMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
    const fruitHalo = new THREE.Mesh(fruitHaloGeo, fruitHaloMat);
    fruitHalo.rotation.x = Math.PI / 2;
    fruitHalo.position.y = 0.005;
    fruitBowlGroup.add(fruitHalo);

    kitchenRoot.add(fruitBowlGroup);

    // 7. Apple Cider Vinegar Bottle (Open glass bottle with acetic acid plume)
    const vinegarGroup = new THREE.Group();
    vinegarGroup.position.set(-0.15, 1.02, 0.45);

    // Bottle body
    const bottleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.38, 20);
    const bottleMesh = new THREE.Mesh(bottleGeo, glassMat);
    bottleMesh.position.y = 0.19;
    bottleMesh.castShadow = true;
    vinegarGroup.add(bottleMesh);

    // Vinegar liquid inside
    const liquidGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.28, 18);
    const liquidMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.2 });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = 0.14;
    vinegarGroup.add(liquidMesh);

    // Bottle neck
    const neckGeo = new THREE.CylinderGeometry(0.045, 0.075, 0.18, 16);
    const neckMesh = new THREE.Mesh(neckGeo, glassMat);
    neckMesh.position.y = 0.44;
    vinegarGroup.add(neckMesh);

    // Removed cork stopper lying beside bottle
    const corkGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.07, 12);
    const corkMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
    const corkMesh = new THREE.Mesh(corkGeo, corkMat);
    corkMesh.rotation.z = Math.PI / 2;
    corkMesh.position.set(0.18, 0.035, 0.08);
    vinegarGroup.add(corkMesh);

    kitchenRoot.add(vinegarGroup);

    // 8. Wooden Cutting Board with Sliced Lemon & Honey Pot
    const boardGroup = new THREE.Group();
    boardGroup.position.set(1.25, 1.02, 0.25);

    const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.035, 0.45), woodBoardMat);
    boardMesh.position.y = 0.018;
    boardMesh.castShadow = true;
    boardGroup.add(boardMesh);

    // Lemon slice (Yellow cylinder wheel)
    const lemonGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.025, 20);
    const lemonMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.35 });
    const lemonMesh = new THREE.Mesh(lemonGeo, lemonMat);
    lemonMesh.position.set(-0.14, 0.045, 0.04);
    boardGroup.add(lemonMesh);

    // Honey Pot (Small glass jar)
    const honeyGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.16, 16);
    const honeyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.15, metalness: 0.1 });
    const honeyMesh = new THREE.Mesh(honeyGeo, honeyMat);
    honeyMesh.position.set(0.14, 0.095, -0.06);
    boardGroup.add(honeyMesh);

    kitchenRoot.add(boardGroup);

    // 9. Kitchen Stainless Steel Trash Bin on the Floor
    const trashGroup = new THREE.Group();
    trashGroup.position.set(2.4, 0, 1.2);

    const trashBodyGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.72, 24);
    const trashBody = new THREE.Mesh(trashBodyGeo, stainlessMat);
    trashBody.position.y = 0.36;
    trashBody.castShadow = true;
    trashGroup.add(trashBody);

    // Lid slightly open/cracked
    const lidGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.04, 24);
    const lidMesh = new THREE.Mesh(lidGeo, stainlessMat);
    lidMesh.position.set(0, 0.73, 0.04);
    lidMesh.rotation.x = -0.22; // Ajar lid
    trashGroup.add(lidMesh);

    kitchenRoot.add(trashGroup);

    // 10. Overhead Hanging Kitchen Pendant Lamp (Phototaxis attraction light)
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, 2.85, 0); // Directly over center of island

    // Cord
    const cordGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.2, 8);
    const cordMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const cordMesh = new THREE.Mesh(cordGeo, cordMat);
    cordMesh.position.y = 0.6;
    lampGroup.add(cordMesh);

    // Conical shade
    const shadeGeo = new THREE.ConeGeometry(0.38, 0.32, 24, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Matte black shade
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const shadeMesh = new THREE.Mesh(shadeGeo, shadeMat);
    shadeMesh.rotation.x = Math.PI;
    shadeMesh.position.y = 0.05;
    lampGroup.add(shadeMesh);

    // Warm Glowing Edison Bulb
    const bulbGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf97316,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.y = -0.06;
    lampGroup.add(bulbMesh);

    // Dedicated spotlight casting warm cone on the island
    const spotLight = new THREE.SpotLight(0xffedd5, 4.5, 6, Math.PI / 3, 0.4, 1.2);
    spotLight.position.set(0, -0.06, 0);
    spotLight.target.position.set(0, 1.0, 0);
    spotLight.castShadow = true;
    lampGroup.add(spotLight);
    lampGroup.add(spotLight.target);

    kitchenRoot.add(lampGroup);

    // 11. Multi-source Animated Scent Vapor Plume System (Bananas, Vinegar, Trash)
    const plumeParticleCount = 80;
    const plumePositions = new Float32Array(plumeParticleCount * 3);
    const plumeColors = new Float32Array(plumeParticleCount * 3);

    for (let p = 0; p < plumeParticleCount; p++) {
      // 50% from Fruit Bowl, 30% from Vinegar Bottle, 20% from Trash Bin
      let origin;
      let color;
      if (p < 40) {
        // Fruit Bowl (Bananas)
        origin = fruitBowlGroup.position;
        color = [0.98, 0.8, 0.08]; // Yellow
      } else if (p < 65) {
        // Vinegar
        origin = vinegarGroup.position;
        color = [0.95, 0.5, 0.1]; // Amber
      } else {
        // Trash
        origin = trashGroup.position;
        color = [0.55, 0.45, 0.35]; // Gray-brown
      }

      plumePositions[p * 3] = origin.x + (Math.random() - 0.5) * 0.3;
      plumePositions[p * 3 + 1] = origin.y + 0.1 + Math.random() * 1.2;
      plumePositions[p * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.3;

      plumeColors[p * 3] = color[0];
      plumeColors[p * 3 + 1] = color[1];
      plumeColors[p * 3 + 2] = color[2];
    }

    const plumeGeo = new THREE.BufferGeometry();
    plumeGeo.setAttribute('position', new THREE.BufferAttribute(plumePositions, 3));
    plumeGeo.setAttribute('color', new THREE.BufferAttribute(plumeColors, 3));

    const plumeMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const kitchenPlumes = new THREE.Points(plumeGeo, plumeMat);
    kitchenRoot.add(kitchenPlumes);

    return {
      kitchenRoot,
      counterSurfaceY: 1.02, // Exact resting/walking level on the island
      floorSurfaceY: 0.0,
      fruitBowlGroup,
      vinegarGroup,
      boardGroup,
      sinkGroup,
      trashGroup,
      lampGroup,
      bulbMesh,
      kitchenPlumes,
      glassTerrariumGroup,
      islandBounds: {
        minX: -1.8,
        maxX: 1.8,
        minZ: -0.95,
        maxZ: 0.95,
        minY: 1.02,
        maxY: 2.45
      },
      roomBounds: {
        minX: -4.5,
        maxX: 4.5,
        minZ: -3.2,
        maxZ: 3.5,
        minY: 0.0,
        maxY: 3.5
      }
    };
  }

  /**
   * Updates animated vapor plumes rising from kitchen food items
   */
  static updatePlumes(kitchenPlumes, fruitPos, vinegarPos, trashPos, delta, time) {
    if (!kitchenPlumes) return;
    const pArr = kitchenPlumes.geometry.attributes.position.array;
    const count = pArr.length / 3;

    for (let i = 0; i < count; i++) {
      pArr[i * 3 + 1] += delta * 0.42; // Rise vertically
      pArr[i * 3] += Math.sin(time * 2.2 + i) * 0.004; // Atmospheric dispersion
      pArr[i * 3 + 2] += Math.cos(time * 2.2 + i) * 0.004;

      // Reset when particle reaches ceiling height
      if (pArr[i * 3 + 1] > 2.6) {
        let origin = fruitPos;
        if (i >= 40 && i < 65) origin = vinegarPos;
        else if (i >= 65) origin = trashPos;

        pArr[i * 3] = origin.x + (Math.random() - 0.5) * 0.25;
        pArr[i * 3 + 1] = origin.y + 0.1;
        pArr[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.25;
      }
    }

    kitchenPlumes.geometry.attributes.position.needsUpdate = true;
  }
}

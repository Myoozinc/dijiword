import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Orbit, 
  Footprints, 
  Sun, 
  Moon, 
  Ruler, 
  Plus, 
  Trash2, 
  RotateCw, 
  Download, 
  Share2, 
  Camera, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Eye, 
  Box, 
  Sparkles,
  ChevronDown,
  Info,
  Check,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { RoomReconstruction } from '../services/roomReconstruction';
import { Exporter } from '../services/exporter';

export function SimulationViewer({ scanData, onBackToScan }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);

  // Scene Objects References
  const roomGroupRef = useRef(null);
  const pointCloudRef = useRef(null);
  const cadGroupRef = useRef(null);
  const furnitureGroupRef = useRef(null);
  const sunLightRef = useRef(null);
  const hemiLightRef = useRef(null);
  const measureLineRef = useRef(null);

  // Viewer State
  const [navMode, setNavMode] = useState('orbit'); // 'orbit' | 'walk'
  const [renderStyle, setRenderStyle] = useState('mesh'); // 'mesh' | 'points' | 'cad' | 'thermal'
  const [timeOfDay, setTimeOfDay] = useState(14); // 8 to 22 hrs
  const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'furniture' | 'stats' | 'export'
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(null);
  const [furnitureList, setFurnitureList] = useState([]);
  
  // Measurement state
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measuredDistance, setMeasuredDistance] = useState(null);

  // Walk controls state
  const walkStateRef = useRef({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    yaw: 0,
    pitch: 0,
    position: new THREE.Vector3(0, 1.6, 0),
    speed: 0.05
  });

  // Touch interaction tracking
  const touchStateRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    orbitTheta: Math.PI / 4,
    orbitPhi: Math.PI / 3,
    orbitRadius: 7.0,
    target: new THREE.Vector3(0, 1.3, 0),
    pinchDist: 0
  });

  const { bounds, points } = scanData;

  // 1. Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.7);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(5, 8, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Furniture Group
    const furnitureGroup = new THREE.Group();
    furnitureGroup.name = 'FurnitureGroup';
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    // Build Room Meshes
    updateSceneGeometry();

    // Default Furniture from scan if present
    if (scanData.defaultItems && scanData.defaultItems.length > 0) {
      scanData.defaultItems.forEach(item => {
        addFurniture(item.type, item.position, item.rotationY);
      });
    }

    // Set initial orbit camera position
    updateOrbitCamera();

    // Animation Loop
    let lastTime = performance.now();
    const animate = (currentTime) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Handle First-person walk movement
      if (navMode === 'walk') {
        updateWalkMovement();
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update Geometry & Styles
  const updateSceneGeometry = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous groups
    if (roomGroupRef.current) scene.remove(roomGroupRef.current);
    if (pointCloudRef.current) scene.remove(pointCloudRef.current);
    if (cadGroupRef.current) scene.remove(cadGroupRef.current);

    // 1. Build Room Mesh
    const roomGroup = RoomReconstruction.buildRoomMesh(bounds, scanData.keyframes);
    roomGroupRef.current = roomGroup;
    scene.add(roomGroup);

    // 2. Build Point Cloud
    const pointCloud = RoomReconstruction.createPointCloud(points, renderStyle === 'thermal' ? 'thermal' : 'rgb');
    pointCloudRef.current = pointCloud;
    scene.add(pointCloud);

    // 3. Build CAD Wireframe
    const cadGroup = RoomReconstruction.buildWireframeCAD(bounds);
    cadGroupRef.current = cadGroup;
    scene.add(cadGroup);

    // Visibility toggles based on style
    applyRenderStyle(renderStyle);
  };

  const applyRenderStyle = (style) => {
    setRenderStyle(style);
    if (roomGroupRef.current) roomGroupRef.current.visible = (style === 'mesh');
    if (pointCloudRef.current) {
      pointCloudRef.current.visible = (style === 'points' || style === 'thermal');
      if (style === 'thermal' || style === 'points') {
        // Recreate with correct color shader
        const scene = sceneRef.current;
        scene.remove(pointCloudRef.current);
        const newPC = RoomReconstruction.createPointCloud(points, style === 'thermal' ? 'thermal' : 'rgb');
        pointCloudRef.current = newPC;
        scene.add(newPC);
      }
    }
    if (cadGroupRef.current) cadGroupRef.current.visible = (style === 'cad');
  };

  // Sun Simulation
  useEffect(() => {
    if (!sunLightRef.current || !hemiLightRef.current || !sceneRef.current) return;
    
    // Hour to sun angle (8 to 22)
    const normalizedHour = (timeOfDay - 6) / 14; // 0 to 1
    const sunAngle = normalizedHour * Math.PI;

    const sunX = Math.cos(sunAngle) * 8;
    const sunY = Math.max(0.5, Math.sin(sunAngle) * 9);
    const sunZ = 5;

    sunLightRef.current.position.set(sunX, sunY, sunZ);

    if (timeOfDay < 9) {
      // Golden morning
      sunLightRef.current.color.setHex(0xffedd5);
      sunLightRef.current.intensity = 1.2;
      hemiLightRef.current.color.setHex(0xfef3c7);
      sceneRef.current.background = new THREE.Color(0x1e1b4b);
    } else if (timeOfDay < 17) {
      // Crisp daylight
      sunLightRef.current.color.setHex(0xffffff);
      sunLightRef.current.intensity = 1.5;
      hemiLightRef.current.color.setHex(0xe2e8f0);
      sceneRef.current.background = new THREE.Color(0x0f172a);
    } else if (timeOfDay < 20) {
      // Golden sunset
      sunLightRef.current.color.setHex(0xf97316);
      sunLightRef.current.intensity = 1.3;
      hemiLightRef.current.color.setHex(0x7c2d12);
      sceneRef.current.background = new THREE.Color(0x27102e);
    } else {
      // Night simulation
      sunLightRef.current.color.setHex(0x38bdf8);
      sunLightRef.current.intensity = 0.2;
      hemiLightRef.current.color.setHex(0x0f172a);
      sceneRef.current.background = new THREE.Color(0x030712);
    }
  }, [timeOfDay]);

  // Orbit Camera calculation
  const updateOrbitCamera = () => {
    if (!cameraRef.current) return;
    const { orbitTheta, orbitPhi, orbitRadius, target } = touchStateRef.current;
    const x = target.x + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta);
    const y = target.y + orbitRadius * Math.cos(orbitPhi);
    const z = target.z + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  // Walk movement update
  const updateWalkMovement = () => {
    if (!cameraRef.current) return;
    const walk = walkStateRef.current;
    const { min, max } = bounds;

    // Movement vector
    const forward = new THREE.Vector3(Math.sin(walk.yaw), 0, Math.cos(walk.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(walk.yaw), 0, -Math.sin(walk.yaw)).normalize();

    if (walk.moveForward) walk.position.addScaledVector(forward, walk.speed);
    if (walk.moveBackward) walk.position.addScaledVector(forward, -walk.speed);
    if (walk.moveRight) walk.position.addScaledVector(right, walk.speed);
    if (walk.moveLeft) walk.position.addScaledVector(right, -walk.speed);

    // Wall collision clamping
    const margin = 0.4;
    walk.position.x = Math.max(min.x + margin, Math.min(max.x - margin, walk.position.x));
    walk.position.z = Math.max(min.z + margin, Math.min(max.z - margin, walk.position.z));
    walk.position.y = 1.6; // Eye level height

    cameraRef.current.position.copy(walk.position);

    // Look direction
    const lookTarget = new THREE.Vector3(
      walk.position.x + Math.sin(walk.yaw) * Math.cos(walk.pitch),
      walk.position.y + Math.sin(walk.pitch),
      walk.position.z + Math.cos(walk.yaw) * Math.cos(walk.pitch)
    );
    cameraRef.current.lookAt(lookTarget);
  };

  // Touch Handlers for Orbit & First-Person Look
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStateRef.current.isDown = true;
      touchStateRef.current.startX = e.touches[0].clientX;
      touchStateRef.current.startY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStateRef.current.pinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e) => {
    if (navMode === 'orbit') {
      if (e.touches.length === 1 && touchStateRef.current.isDown) {
        const deltaX = e.touches[0].clientX - touchStateRef.current.startX;
        const deltaY = e.touches[0].clientY - touchStateRef.current.startY;
        touchStateRef.current.startX = e.touches[0].clientX;
        touchStateRef.current.startY = e.touches[0].clientY;

        touchStateRef.current.orbitTheta -= deltaX * 0.008;
        touchStateRef.current.orbitPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.02, touchStateRef.current.orbitPhi - deltaY * 0.008));
        updateOrbitCamera();
      } else if (e.touches.length === 2) {
        // Pinch Zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const factor = dist / (touchStateRef.current.pinchDist || dist);
        touchStateRef.current.pinchDist = dist;

        touchStateRef.current.orbitRadius = Math.max(2.0, Math.min(18.0, touchStateRef.current.orbitRadius / factor));
        updateOrbitCamera();
      }
    } else if (navMode === 'walk') {
      if (e.touches.length === 1 && touchStateRef.current.isDown) {
        const deltaX = e.touches[0].clientX - touchStateRef.current.startX;
        const deltaY = e.touches[0].clientY - touchStateRef.current.startY;
        touchStateRef.current.startX = e.touches[0].clientX;
        touchStateRef.current.startY = e.touches[0].clientY;

        walkStateRef.current.yaw -= deltaX * 0.006;
        walkStateRef.current.pitch = Math.max(-1.1, Math.min(1.1, walkStateRef.current.pitch - deltaY * 0.006));
      }
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current.isDown = false;
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    if (navMode === 'orbit') {
      touchStateRef.current.orbitRadius = Math.max(2.0, Math.min(20.0, touchStateRef.current.orbitRadius + e.deltaY * 0.008));
      updateOrbitCamera();
    }
  };

  // Quick Orbit Preset Views
  const setPresetView = (view) => {
    const { center } = bounds;
    touchStateRef.current.target.set(center.x, center.y, center.z);

    if (view === 'top') {
      // 2D Floorplan Top View
      touchStateRef.current.orbitTheta = 0;
      touchStateRef.current.orbitPhi = 0.05;
      touchStateRef.current.orbitRadius = Math.max(bounds.width, bounds.length) * 1.5;
    } else if (view === 'iso') {
      // Isometric 3D Showcase
      touchStateRef.current.orbitTheta = Math.PI / 4;
      touchStateRef.current.orbitPhi = Math.PI / 3.2;
      touchStateRef.current.orbitRadius = Math.max(bounds.width, bounds.length) * 1.4;
    } else if (view === 'front') {
      touchStateRef.current.orbitTheta = 0;
      touchStateRef.current.orbitPhi = Math.PI / 2.2;
      touchStateRef.current.orbitRadius = bounds.length * 1.6;
    }
    updateOrbitCamera();
  };

  // Switch Navigation Mode
  const toggleNavMode = (mode) => {
    setNavMode(mode);
    if (mode === 'walk') {
      walkStateRef.current.position.set(0, 1.6, 0);
      walkStateRef.current.yaw = 0;
      walkStateRef.current.pitch = 0;
    } else {
      updateOrbitCamera();
    }
  };

  // Furniture Management
  const addFurniture = (type, pos = null, rotY = 0) => {
    const defaultPos = pos || { x: (Math.random() - 0.5) * (bounds.width * 0.5), y: 0, z: (Math.random() - 0.5) * (bounds.length * 0.5) };
    const itemMesh = RoomReconstruction.createFurniture(type, defaultPos, rotY);
    
    furnitureGroupRef.current.add(itemMesh);
    
    const newEntry = {
      id: itemMesh.userData.id,
      type,
      name: getFurnitureLabel(type),
      position: { ...defaultPos },
      rotationY: rotY,
      mesh: itemMesh
    };

    setFurnitureList(prev => [...prev, newEntry]);
    setSelectedFurnitureId(newEntry.id);
  };

  const removeFurniture = (id) => {
    const target = furnitureList.find(f => f.id === id);
    if (target && target.mesh) {
      furnitureGroupRef.current.remove(target.mesh);
    }
    setFurnitureList(prev => prev.filter(f => f.id !== id));
    if (selectedFurnitureId === id) setSelectedFurnitureId(null);
  };

  const rotateSelectedFurniture = (deltaRad) => {
    if (!selectedFurnitureId) return;
    const item = furnitureList.find(f => f.id === selectedFurnitureId);
    if (item && item.mesh) {
      item.mesh.rotation.y += deltaRad;
      item.rotationY = item.mesh.rotation.y;
      setFurnitureList([...furnitureList]);
    }
  };

  const moveSelectedFurniture = (dx, dz) => {
    if (!selectedFurnitureId) return;
    const item = furnitureList.find(f => f.id === selectedFurnitureId);
    if (item && item.mesh) {
      item.mesh.position.x += dx;
      item.mesh.position.z += dz;
      item.position.x = item.mesh.position.x;
      item.position.z = item.mesh.position.z;
      setFurnitureList([...furnitureList]);
    }
  };

  const getFurnitureLabel = (type) => {
    const labels = {
      sofa: 'Sofá 3 Plazas',
      bed: 'Cama Queen',
      desk: 'Escritorio de Trabajo',
      dining: 'Mesa Comedor',
      plant: 'Planta de Interior',
      lamp: 'Lámpara de Pie',
      tv: 'Smart TV & Mueble',
      mannequin: 'Maniquí Escala (1.75m)'
    };
    return labels[type] || type;
  };

  // 3D Laser Measure Tool
  const handleCanvasClick = (e) => {
    if (!measureMode || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // Intersect with floor or room
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0].point;
      const newPoints = [...measurePoints, hit];

      if (newPoints.length === 2) {
        const dist = newPoints[0].distanceTo(newPoints[1]);
        setMeasuredDistance(dist.toFixed(2));
        drawMeasurementLine(newPoints[0], newPoints[1]);
        setMeasurePoints([]);
      } else {
        setMeasurePoints(newPoints);
        setMeasuredDistance(null);
      }
    }
  };

  const drawMeasurementLine = (p1, p2) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (measureLineRef.current) scene.remove(measureLineRef.current);

    const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const mat = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 3 });
    const line = new THREE.Line(geo, mat);
    
    // Add endpoint marker spheres
    const sphereGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const s1 = new THREE.Mesh(sphereGeo, sphereMat);
    s1.position.copy(p1);
    const s2 = new THREE.Mesh(sphereGeo, sphereMat);
    s2.position.copy(p2);

    const group = new THREE.Group();
    group.add(line);
    group.add(s1);
    group.add(s2);
    scene.add(group);
    measureLineRef.current = group;
  };

  // Export handlers
  const handleExportPLY = () => Exporter.exportPLY(points, `${scanData.name || 'scan'}.ply`);
  const handleExportOBJ = () => Exporter.exportOBJ(bounds, `${scanData.name || 'scan'}.obj`);
  const handleExportJSON = () => {
    Exporter.exportSimulationJSON({
      scan: scanData,
      furniture: furnitureList.map(f => ({ type: f.type, position: f.position, rotationY: f.rotationY })),
      lighting: { timeOfDay },
      version: '1.0.0'
    }, `${scanData.name || 'scan'}-sim.json`);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#090d16] overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={onBackToScan}
            className="p-2 rounded-xl glass-btn text-slate-300 hover:text-white flex items-center space-x-1"
            title="Volver a Escanear"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">Escanear</span>
          </button>
          
          <div className="glass-pill px-3 py-1.5 rounded-xl border border-cyan-500/20">
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[140px] sm:max-w-xs block">
              {scanData.name || 'Espacio Mapeado 3D'}
            </span>
          </div>
        </div>

        {/* View Mode & Preset Toggles */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Navigation Mode (Orbit vs Walk) */}
          <div className="flex p-0.5 rounded-xl glass-pill border border-white/10">
            <button
              onClick={() => toggleNavMode('orbit')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                navMode === 'orbit' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Orbital</span>
            </button>
            <button
              onClick={() => toggleNavMode('walk')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                navMode === 'walk' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Caminar 1ªP</span>
            </button>
          </div>

          {/* Render Style Menu */}
          <div className="flex p-0.5 rounded-xl glass-pill border border-white/10">
            <button
              onClick={() => applyRenderStyle('mesh')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                renderStyle === 'mesh' ? 'bg-cyan-500/40 text-cyan-300' : 'text-slate-400'
              }`}
              title="Render Texturizado 3D"
            >
              <Box className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyRenderStyle('points')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                renderStyle === 'points' ? 'bg-cyan-500/40 text-cyan-300' : 'text-slate-400'
              }`}
              title="Nube de Puntos LiDAR"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyRenderStyle('cad')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                renderStyle === 'cad' ? 'bg-cyan-500/40 text-cyan-300' : 'text-slate-400'
              }`}
              title="Plano CAD Blueprint"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
      />

      {/* Quick Camera Angle Buttons (Top, Isometric, Front) - for Orbit mode */}
      {navMode === 'orbit' && (
        <div className="absolute top-16 right-3 z-20 flex flex-col space-y-1.5">
          <button
            onClick={() => setPresetView('top')}
            className="p-2 rounded-xl glass-btn text-xs font-mono font-bold text-cyan-400 hover:text-white"
            title="Vista Planta 2D (Cenital)"
          >
            Planta
          </button>
          <button
            onClick={() => setPresetView('iso')}
            className="p-2 rounded-xl glass-btn text-xs font-mono font-bold text-cyan-400 hover:text-white"
            title="Vista Isométrica 3D"
          >
            3D Iso
          </button>
          <button
            onClick={() => setPresetView('front')}
            className="p-2 rounded-xl glass-btn text-xs font-mono font-bold text-cyan-400 hover:text-white"
            title="Vista Frontal"
          >
            Frontal
          </button>
        </div>
      )}

      {/* Touch Dual Joystick for Walk Mode */}
      {navMode === 'walk' && (
        <div className="absolute bottom-28 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Left Movement D-Pad */}
          <div className="relative w-36 h-36 rounded-full glass-panel border border-cyan-500/30 flex items-center justify-center pointer-events-auto shadow-2xl">
            <button
              onMouseDown={() => { walkStateRef.current.moveForward = true; }}
              onMouseUp={() => { walkStateRef.current.moveForward = false; }}
              onTouchStart={() => { walkStateRef.current.moveForward = true; }}
              onTouchEnd={() => { walkStateRef.current.moveForward = false; }}
              className="absolute top-2 px-3 py-1.5 rounded-lg bg-slate-800/80 active:bg-cyan-500 text-xs font-bold text-white"
            >
              ▲
            </button>
            <button
              onMouseDown={() => { walkStateRef.current.moveBackward = true; }}
              onMouseUp={() => { walkStateRef.current.moveBackward = false; }}
              onTouchStart={() => { walkStateRef.current.moveBackward = true; }}
              onTouchEnd={() => { walkStateRef.current.moveBackward = false; }}
              className="absolute bottom-2 px-3 py-1.5 rounded-lg bg-slate-800/80 active:bg-cyan-500 text-xs font-bold text-white"
            >
              ▼
            </button>
            <button
              onMouseDown={() => { walkStateRef.current.moveLeft = true; }}
              onMouseUp={() => { walkStateRef.current.moveLeft = false; }}
              onTouchStart={() => { walkStateRef.current.moveLeft = true; }}
              onTouchEnd={() => { walkStateRef.current.moveLeft = false; }}
              className="absolute left-2 py-1.5 px-2.5 rounded-lg bg-slate-800/80 active:bg-cyan-500 text-xs font-bold text-white"
            >
              ◀
            </button>
            <button
              onMouseDown={() => { walkStateRef.current.moveRight = true; }}
              onMouseUp={() => { walkStateRef.current.moveRight = false; }}
              onTouchStart={() => { walkStateRef.current.moveRight = true; }}
              onTouchEnd={() => { walkStateRef.current.moveRight = false; }}
              className="absolute right-2 py-1.5 px-2.5 rounded-lg bg-slate-800/80 active:bg-cyan-500 text-xs font-bold text-white"
            >
              ▶
            </button>
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold">
              PASO
            </div>
          </div>

          {/* Right Touch Look Hint */}
          <div className="glass-pill px-3 py-2 rounded-xl text-center pointer-events-none max-w-[150px]">
            <span className="text-[11px] text-slate-300">Desliza la pantalla derecha para rotar la mirada 360°</span>
          </div>
        </div>
      )}

      {/* Measurement HUD banner if active */}
      {measureMode && (
        <div className="absolute top-16 left-4 z-20 glass-pill px-4 py-2 rounded-xl flex items-center space-x-2 border border-cyan-400/40">
          <Ruler className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white">
            {measuredDistance 
              ? `Distancia: ${measuredDistance} m (${(measuredDistance * 3.28084).toFixed(2)} ft)` 
              : measurePoints.length === 1 
                ? 'Toca el segundo punto...' 
                : 'Toca 2 puntos para medir'}
          </span>
        </div>
      )}

      {/* Bottom Floating Interactive Simulation Drawer */}
      <div className="absolute bottom-0 inset-x-0 z-30 glass-panel rounded-t-3xl border-t border-cyan-500/20 shadow-2xl flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-around px-4 pt-3 pb-2 border-b border-white/5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tools')}
            className={`pb-1 flex items-center space-x-1.5 transition ${
              activeTab === 'tools' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Iluminación & Sol</span>
          </button>
          <button
            onClick={() => setActiveTab('furniture')}
            className={`pb-1 flex items-center space-x-1.5 transition ${
              activeTab === 'furniture' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Mobiliario ({furnitureList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-1 flex items-center space-x-1.5 transition ${
              activeTab === 'stats' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Cotas & Medidas</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-1 flex items-center space-x-1.5 transition ${
              activeTab === 'export' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar 3D</span>
          </button>
        </div>

        {/* Tab 1: Lighting & Solar Simulation */}
        {activeTab === 'tools' && (
          <div className="p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                {timeOfDay >= 19 || timeOfDay < 7 ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <span>Simulación Solar y Sombras en Tiempo Real</span>
              </div>
              <div className="text-xs font-mono font-bold text-cyan-400">
                {timeOfDay}:00 hrs
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[11px] text-slate-400">08:00</span>
              <input
                type="range"
                min="8"
                max="22"
                step="1"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">22:00</span>
            </div>

            {/* Quick time buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
              <button
                onClick={() => setTimeOfDay(9)}
                className={`py-1.5 rounded-lg border transition ${
                  timeOfDay === 9 ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'glass-btn text-slate-400'
                }`}
              >
                Mañana
              </button>
              <button
                onClick={() => setTimeOfDay(13)}
                className={`py-1.5 rounded-lg border transition ${
                  timeOfDay === 13 ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'glass-btn text-slate-400'
                }`}
              >
                Mediodía
              </button>
              <button
                onClick={() => setTimeOfDay(18)}
                className={`py-1.5 rounded-lg border transition ${
                  timeOfDay === 18 ? 'bg-orange-500/20 border-orange-400 text-orange-300' : 'glass-btn text-slate-400'
                }`}
              >
                Atardecer
              </button>
              <button
                onClick={() => setTimeOfDay(21)}
                className={`py-1.5 rounded-lg border transition ${
                  timeOfDay === 21 ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : 'glass-btn text-slate-400'
                }`}
              >
                Noche
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Furniture Simulator */}
        {activeTab === 'furniture' && (
          <div className="p-4 flex flex-col space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              Añadir Mobiliario para Simular Distribución Espacial:
            </div>

            {/* Furniture catalog buttons */}
            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => addFurniture('sofa')}
                className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap hover:border-cyan-400/50"
              >
                🛋️ Sofá 3P
              </button>
              <button
                onClick={() => addFurniture('bed')}
                className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap hover:border-cyan-400/50"
              >
                🛏️ Cama Queen
              </button>
              <button
                onClick={() => addFurniture('desk')}
                className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap hover:border-cyan-400/50"
              >
                🖥️ Escritorio
              </button>
              <button
                onClick={() => addFurniture('dining')}
                className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap hover:border-cyan-400/50"
              >
                🪑 Comedor
              </button>
              <button
                onClick={() => addFurniture('tv')}
                className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap hover:border-cyan-400/50"
              >
                📺 Smart TV
              </button>
              <button
                onClick={() => addFurniture('plant')}
                className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap hover:border-cyan-400/50"
              >
                🪴 Planta
              </button>
              <button
                onClick={() => addFurniture('lamp')}
                className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap hover:border-cyan-400/50"
              >
                💡 Lámpara
              </button>
              <button
                onClick={() => addFurniture('mannequin')}
                className="px-3 py-2 rounded-xl glass-btn text-cyan-300 font-semibold whitespace-nowrap hover:border-cyan-400/50"
              >
                🧍 Maniquí (1:1)
              </button>
            </div>

            {/* Selected furniture transform controls */}
            {selectedFurnitureId && (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between">
                <div className="text-xs font-semibold text-cyan-300 truncate max-w-[130px]">
                  {furnitureList.find(f => f.id === selectedFurnitureId)?.name}
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => moveSelectedFurniture(-0.2, 0)}
                    className="p-1.5 rounded-lg glass-btn text-xs text-white"
                    title="Mover Izquierda"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => moveSelectedFurniture(0.2, 0)}
                    className="p-1.5 rounded-lg glass-btn text-xs text-white"
                    title="Mover Derecha"
                  >
                    ▶
                  </button>
                  <button
                    onClick={() => moveSelectedFurniture(0, -0.2)}
                    className="p-1.5 rounded-lg glass-btn text-xs text-white"
                    title="Mover Fondo"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveSelectedFurniture(0, 0.2)}
                    className="p-1.5 rounded-lg glass-btn text-xs text-white"
                    title="Mover Frente"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => rotateSelectedFurniture(Math.PI / 4)}
                    className="p-1.5 rounded-lg glass-btn text-cyan-400"
                    title="Girar 45°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFurniture(selectedFurnitureId)}
                    className="p-1.5 rounded-lg glass-btn text-red-400 hover:text-red-300"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Dimensions & CAD Stats */}
        {activeTab === 'stats' && (
          <div className="p-4 flex flex-col space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Ancho</div>
                <div className="text-base font-bold text-cyan-400 font-mono">{bounds.width} m</div>
                <div className="text-[10px] text-slate-500 font-mono">{(bounds.width * 3.28084).toFixed(1)} ft</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Largo</div>
                <div className="text-base font-bold text-cyan-400 font-mono">{bounds.length} m</div>
                <div className="text-[10px] text-slate-500 font-mono">{(bounds.length * 3.28084).toFixed(1)} ft</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Altura</div>
                <div className="text-base font-bold text-cyan-400 font-mono">{bounds.height} m</div>
                <div className="text-[10px] text-slate-500 font-mono">{(bounds.height * 3.28084).toFixed(1)} ft</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-300 font-semibold uppercase">Superficie de Planta</div>
                <div className="text-lg font-extrabold text-white font-mono">{bounds.area} m²</div>
                <div className="text-[10px] text-cyan-400/80 font-mono">{(bounds.area * 10.7639).toFixed(1)} sq ft</div>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-300 font-semibold uppercase">Volumen Total</div>
                <div className="text-lg font-extrabold text-white font-mono">{bounds.volume} m³</div>
                <div className="text-[10px] text-cyan-400/80 font-mono">{(bounds.volume * 35.3147).toFixed(1)} cu ft</div>
              </div>
            </div>

            {/* Toggle Measure Tool */}
            <button
              onClick={() => {
                setMeasureMode(!measureMode);
                setMeasurePoints([]);
                setMeasuredDistance(null);
              }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition ${
                measureMode 
                  ? 'bg-cyan-500 text-white border-cyan-400' 
                  : 'glass-btn text-cyan-300 border-cyan-500/30'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>{measureMode ? 'Desactivar Cinta Métrica' : 'Activar Cinta Métrica 3D (Medir Puntos)'}</span>
            </button>
          </div>
        )}

        {/* Tab 4: Export Formats */}
        {activeTab === 'export' && (
          <div className="p-4 flex flex-col space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 mb-1">
              Descargar Archivos del Modelo 3D:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleExportOBJ}
                className="py-3 px-2 rounded-xl glass-btn hover:border-cyan-400/60 flex flex-col items-center justify-center space-y-1"
              >
                <Box className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold text-white">.OBJ Mesh</span>
                <span className="text-[9px] text-slate-400">Blender / CAD</span>
              </button>

              <button
                onClick={handleExportPLY}
                className="py-3 px-2 rounded-xl glass-btn hover:border-cyan-400/60 flex flex-col items-center justify-center space-y-1"
              >
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-white">.PLY Puntos</span>
                <span className="text-[9px] text-slate-400">LiDAR Scan</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="py-3 px-2 rounded-xl glass-btn hover:border-cyan-400/60 flex flex-col items-center justify-center space-y-1"
              >
                <Download className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-white">.JSON Escena</span>
                <span className="text-[9px] text-slate-400">Simulación</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

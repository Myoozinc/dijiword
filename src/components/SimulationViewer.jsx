import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
  Layers, 
  Box, 
  Sparkles,
  Info,
  ArrowLeft,
  Lightbulb,
  Thermometer,
  Sliders,
  Scan,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Target,
  Activity
} from 'lucide-react';
import { RoomReconstruction } from '../services/roomReconstruction';
import { Exporter } from '../services/exporter';

export function SimulationViewer({ scanData, onBackToScan }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);

  // Scene references
  const roomGroupRef = useRef(null);
  const pointCloudRef = useRef(null);
  const cadGroupRef = useRef(null);
  const furnitureGroupRef = useRef(null);
  const aiObjectsGroupRef = useRef(null);
  const sunLightRef = useRef(null);
  const hemiLightRef = useRef(null);
  const spotLightsRef = useRef([]);
  const measureLineRef = useRef(null);
  const surfaceMeshRef = useRef(null);

  // Viewer State
  const [navMode, setNavMode] = useState('orbit'); // 'orbit' | 'walk'
  const [renderStyle, setRenderStyle] = useState('surface'); // 'surface' | 'mesh' | 'points' | 'cad' | 'thermal'
  const [timeOfDay, setTimeOfDay] = useState(14); // 8 to 22 hrs
  const [lightsOn, setLightsOn] = useState(true);
  const [lightTemp, setLightTemp] = useState(3500); // 2700K warm to 6500K cool
  const [showCeiling, setShowCeiling] = useState(false); // Dollhouse cutaway
  const [activeTab, setActiveTab] = useState('lighting'); // 'lighting' | 'ai_objects' | 'furniture' | 'stats' | 'export'
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(null);
  const [furnitureList, setFurnitureList] = useState([]);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [showAIObjects, setShowAIObjects] = useState(false); // Default to clean faithful 3D room geometry!
  const [activeAIObjects, setActiveAIObjects] = useState(scanData.aiDetectedObjects || []);
  
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
    position: new THREE.Vector3(0, 1.65, 0),
    speed: 0.08
  });

  const { bounds, points, aiDetectedObjects = [] } = scanData;

  // 1. Initialize Three.js WebGL Scene with official OrbitControls
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls for rock-solid mobile touch and mouse navigation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // Don't go below floor
    controls.minDistance = 1.5;
    controls.maxDistance = 25;
    controls.target.set(bounds.center.x, bounds.center.y * 0.6, bounds.center.z);
    
    // Position camera for beautiful 3D isometric view of the room
    const initDist = Math.max(bounds.width, bounds.length) * 1.5;
    camera.position.set(bounds.center.x + initDist * 0.7, bounds.height * 1.5, bounds.center.z + initDist * 0.9);
    controls.update();
    controlsRef.current = controls;

    // Lights
    // 1. Hemisphere ambient
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.85);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // 2. Directional Sun shining through the panoramic window
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    sunLight.position.set(bounds.min.x - 4, bounds.height + 3, bounds.center.z);
    sunLight.target.position.set(bounds.center.x, 0, bounds.center.z);
    scene.add(sunLight.target);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // 3. Interior Ceiling Spotlights
    const spots = [];
    const spotCoords = [
      [bounds.center.x - bounds.width * 0.25, bounds.center.z - bounds.length * 0.25],
      [bounds.center.x + bounds.width * 0.25, bounds.center.z - bounds.length * 0.25],
      [bounds.center.x - bounds.width * 0.25, bounds.center.z + bounds.length * 0.25],
      [bounds.center.x + bounds.width * 0.25, bounds.center.z + bounds.length * 0.25],
    ];

    spotCoords.forEach(([sx, sz], i) => {
      const spot = new THREE.SpotLight(0xffedd5, 1.8, 8, Math.PI / 4, 0.4, 1);
      spot.position.set(sx, bounds.max.y - 0.05, sz);
      spot.target.position.set(sx, 0, sz);
      scene.add(spot.target);
      spot.castShadow = true;
      spot.shadow.mapSize.width = 512;
      spot.shadow.mapSize.height = 512;
      scene.add(spot);
      spots.push(spot);
    });
    spotLightsRef.current = spots;

    // Groups
    const furnitureGroup = new THREE.Group();
    furnitureGroup.name = 'FurnitureGroup';
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    const aiObjectsGroup = new THREE.Group();
    aiObjectsGroup.name = 'AIObjectsGroup';
    scene.add(aiObjectsGroup);
    aiObjectsGroupRef.current = aiObjectsGroup;

    // Build Room Meshes & Geometries
    rebuildRoomMesh(false);

    // Populate AI Detected Objects with clean volumetric geometry (no floating photo cards)
    if (activeAIObjects && activeAIObjects.length > 0) {
      activeAIObjects.forEach(obj => {
        const objMesh = RoomReconstruction.createAIObjectMesh(obj);
        aiObjectsGroup.add(objMesh);
      });
    }
    aiObjectsGroup.visible = false;

    // Default Furniture if any
    if (scanData.defaultItems && scanData.defaultItems.length > 0) {
      scanData.defaultItems.forEach(item => {
        addFurniture(item.type, item.position, item.rotationY);
      });
    }

    // Keyboard controls for walking
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') walkStateRef.current.moveForward = true;
      if (key === 's' || key === 'arrowdown') walkStateRef.current.moveBackward = true;
      if (key === 'a' || key === 'arrowleft') walkStateRef.current.moveLeft = true;
      if (key === 'd' || key === 'arrowright') walkStateRef.current.moveRight = true;
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') walkStateRef.current.moveForward = false;
      if (key === 's' || key === 'arrowdown') walkStateRef.current.moveBackward = false;
      if (key === 'a' || key === 'arrowleft') walkStateRef.current.moveLeft = false;
      if (key === 'd' || key === 'arrowright') walkStateRef.current.moveRight = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Render Loop
    const animate = () => {
      if (controlsRef.current && navMode === 'orbit') {
        controlsRef.current.update();
      } else if (navMode === 'walk') {
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current && rendererRef.current.domElement) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Rebuild Room Mesh
  const rebuildRoomMesh = (isCeilingVisible) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (roomGroupRef.current) scene.remove(roomGroupRef.current);
    if (pointCloudRef.current) scene.remove(pointCloudRef.current);
    if (cadGroupRef.current) scene.remove(cadGroupRef.current);
    if (surfaceMeshRef.current) scene.remove(surfaceMeshRef.current);

    // 1. Room Mesh
    const roomGroup = RoomReconstruction.buildRoomMesh(bounds, scanData.keyframes, isCeilingVisible);
    roomGroupRef.current = roomGroup;
    scene.add(roomGroup);

    // 2. Point Cloud
    const pointCloud = RoomReconstruction.createPointCloud(points, renderStyle === 'thermal' ? 'thermal' : 'rgb');
    pointCloudRef.current = pointCloud;
    scene.add(pointCloud);

    // 3. CAD Wireframe
    const cadGroup = RoomReconstruction.buildWireframeCAD(bounds);
    cadGroupRef.current = cadGroup;
    scene.add(cadGroup);

    // 4. Dense Continuous Surface Mesh (Faithful 3D Topography)
    const surfaceMesh = RoomReconstruction.buildDenseSurfaceMesh(points, bounds);
    surfaceMeshRef.current = surfaceMesh;
    scene.add(surfaceMesh);

    applyRenderStyle(renderStyle);
  };

  const applyRenderStyle = (style) => {
    setRenderStyle(style);
    if (surfaceMeshRef.current) {
      surfaceMeshRef.current.visible = (style === 'surface' || style === 'mesh');
    }
    if (roomGroupRef.current) {
      roomGroupRef.current.visible = (style === 'mesh');
    }
    if (pointCloudRef.current) {
      pointCloudRef.current.visible = (style === 'points' || style === 'thermal');
      if (style === 'thermal' || style === 'points') {
        const scene = sceneRef.current;
        scene.remove(pointCloudRef.current);
        const newPC = RoomReconstruction.createPointCloud(points, style === 'thermal' ? 'thermal' : 'rgb');
        pointCloudRef.current = newPC;
        scene.add(newPC);
      }
    }
    if (cadGroupRef.current) {
      cadGroupRef.current.visible = (style === 'cad');
    }
  };

  // Toggle Ceiling Cutaway Mode
  const toggleCeiling = () => {
    const next = !showCeiling;
    setShowCeiling(next);
    rebuildRoomMesh(next);
  };

  // Dynamic Lighting & Solar Simulation Handler
  useEffect(() => {
    if (!sunLightRef.current || !hemiLightRef.current || !sceneRef.current) return;

    // Convert Kelvin to Hex Color
    const kelvinToHex = (temp) => {
      if (temp < 3200) return 0xffe2b2; // Warm 2700K
      if (temp < 4800) return 0xfff4e6; // Neutral 4000K
      return 0xdbeafe; // Cool 6500K
    };
    const bulbColor = kelvinToHex(lightTemp);

    // Spotlights control
    spotLightsRef.current.forEach(spot => {
      spot.intensity = lightsOn ? 2.2 : 0;
      spot.color.setHex(bulbColor);
    });

    // Sun angle calculation based on hour of day
    const hourNormalized = (timeOfDay - 8) / 14; // 0 (8:00) to 1 (22:00)
    const sunAngle = (1 - hourNormalized) * Math.PI;

    // Sun shining in through the window on the West side
    const sunDist = 9;
    const sunX = bounds.min.x - Math.cos(sunAngle) * sunDist;
    const sunY = Math.max(0.6, Math.sin(sunAngle) * 8);
    const sunZ = bounds.center.z + Math.cos(sunAngle) * 4;

    sunLightRef.current.position.set(sunX, sunY, sunZ);

    if (timeOfDay < 10) {
      // Golden sunrise
      sunLightRef.current.color.setHex(0xffedd5);
      sunLightRef.current.intensity = 2.4;
      hemiLightRef.current.color.setHex(0xfef3c7);
      hemiLightRef.current.intensity = 0.9;
      sceneRef.current.background = new THREE.Color(0x1e1b4b);
    } else if (timeOfDay < 17) {
      // Crisp daylight
      sunLightRef.current.color.setHex(0xffffff);
      sunLightRef.current.intensity = 2.8;
      hemiLightRef.current.color.setHex(0xe2e8f0);
      hemiLightRef.current.intensity = 1.0;
      sceneRef.current.background = new THREE.Color(0x0f172a);
    } else if (timeOfDay < 20) {
      // Golden sunset
      sunLightRef.current.color.setHex(0xf97316);
      sunLightRef.current.intensity = 2.2;
      hemiLightRef.current.color.setHex(0x7c2d12);
      hemiLightRef.current.intensity = 0.7;
      sceneRef.current.background = new THREE.Color(0x2d1222);
    } else {
      // Night simulation (artificial room lamps shine)
      sunLightRef.current.color.setHex(0x38bdf8);
      sunLightRef.current.intensity = 0.2;
      hemiLightRef.current.color.setHex(0x090d16);
      hemiLightRef.current.intensity = 0.3;
      sceneRef.current.background = new THREE.Color(0x030712);
    }
  }, [timeOfDay, lightsOn, lightTemp]);

  // First-person Walk Movement Update
  const updateWalkMovement = () => {
    if (!cameraRef.current) return;
    const walk = walkStateRef.current;
    const { min, max } = bounds;

    const forward = new THREE.Vector3(Math.sin(walk.yaw), 0, Math.cos(walk.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(walk.yaw), 0, -Math.sin(walk.yaw)).normalize();

    if (walk.moveForward) walk.position.addScaledVector(forward, walk.speed);
    if (walk.moveBackward) walk.position.addScaledVector(forward, -walk.speed);
    if (walk.moveRight) walk.position.addScaledVector(right, walk.speed);
    if (walk.moveLeft) walk.position.addScaledVector(right, -walk.speed);

    // Wall collision boundaries
    const margin = 0.35;
    walk.position.x = Math.max(min.x + margin, Math.min(max.x - margin, walk.position.x));
    walk.position.z = Math.max(min.z + margin, Math.min(max.z - margin, walk.position.z));
    walk.position.y = 1.65; // Eye level

    cameraRef.current.position.copy(walk.position);

    const lookTarget = new THREE.Vector3(
      walk.position.x + Math.sin(walk.yaw) * Math.cos(walk.pitch),
      walk.position.y + Math.sin(walk.pitch),
      walk.position.z + Math.cos(walk.yaw) * Math.cos(walk.pitch)
    );
    cameraRef.current.lookAt(lookTarget);
  };

  // Toggle navigation mode (Orbit vs Walk)
  const toggleNavMode = (mode) => {
    setNavMode(mode);
    if (mode === 'walk') {
      if (controlsRef.current) controlsRef.current.enabled = false;
      walkStateRef.current.position.set(bounds.center.x, 1.65, bounds.center.z);
      walkStateRef.current.yaw = 0;
      walkStateRef.current.pitch = 0;
    } else {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.target.set(bounds.center.x, bounds.center.y * 0.6, bounds.center.z);
        controlsRef.current.update();
      }
    }
  };

  // Quick Preset Angles (Top-Down 2D, 3D Iso, Front)
  const setPresetView = (view) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const { center, width, length, height } = bounds;
    controlsRef.current.target.set(center.x, center.y * 0.5, center.z);

    if (view === 'top') {
      cameraRef.current.position.set(center.x, height * 2.8, center.z + 0.01);
    } else if (view === 'iso') {
      const dist = Math.max(width, length) * 1.5;
      cameraRef.current.position.set(center.x + dist * 0.7, height * 1.6, center.z + dist * 0.8);
    } else if (view === 'front') {
      cameraRef.current.position.set(center.x, center.y, center.z + length * 1.8);
    }
    controlsRef.current.update();
  };

  // 3D Tap to Teleport (Walk mode) or Measure Tool
  const handleCanvasClick = (e) => {
    if (!cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0].point;

      // 1. Measure Mode
      if (measureMode) {
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
        return;
      }

      // 2. Walk Mode Tap-to-Move: clicking on floor walks there!
      if (navMode === 'walk' && intersects[0].object.name === 'FloorMesh') {
        walkStateRef.current.position.x = hit.x;
        walkStateRef.current.position.z = hit.z;
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

    const sphereGeo = new THREE.SphereGeometry(0.05, 16, 16);
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

  // Furniture Catalog
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

  // Sync AI objects group visibility
  useEffect(() => {
    if (aiObjectsGroupRef.current) {
      aiObjectsGroupRef.current.visible = showAIObjects;
    }
  }, [showAIObjects]);

  const focusOnObject = (obj) => {
    if (!controlsRef.current || !cameraRef.current) return;
    if (!showAIObjects) setShowAIObjects(true);
    const { x, y = 0, z } = obj.position3D || {};
    controlsRef.current.target.set(x, y + 0.4, z);
    cameraRef.current.position.set(x + 1.8, y + 1.4, z + 1.8);
    controlsRef.current.update();
  };

  const removeAIObject = (id, e) => {
    e?.stopPropagation();
    setActiveAIObjects(prev => prev.filter(obj => obj.id !== id));
    if (aiObjectsGroupRef.current) {
      const child = aiObjectsGroupRef.current.children.find(c => c.userData?.id === id);
      if (child) aiObjectsGroupRef.current.remove(child);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-[#090d16] overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
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
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[130px] sm:max-w-xs block">
              {scanData.name || 'Simulación 3D'}
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
              <span>Orbital</span>
            </button>
            <button
              onClick={() => toggleNavMode('walk')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                navMode === 'walk' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Caminar</span>
            </button>
          </div>

          {/* Render Style Toggles & AI Objects View */}
          <div className="flex p-0.5 rounded-xl glass-pill border border-white/10">
            <button
              onClick={() => applyRenderStyle('surface')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                renderStyle === 'surface' ? 'bg-cyan-500/40 text-cyan-300' : 'text-slate-400'
              }`}
              title="Malla 3D Fiel (Superficie Continua Real sin distorsión)"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyRenderStyle('mesh')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                renderStyle === 'mesh' ? 'bg-cyan-500/40 text-cyan-300' : 'text-slate-400'
              }`}
              title="Modelo Híbrido (Malla + Muros)"
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
            <div className="w-[1px] h-4 bg-white/10 my-auto mx-0.5" />
            <button
              onClick={() => setShowAIObjects(!showAIObjects)}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                showAIObjects ? 'bg-cyan-500/40 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={showAIObjects ? "Objetos 3D visibles (Toca para ocultar y ver espacio limpio)" : "Objetos 3D ocultos (Toca para mostrar)"}
            >
              <Target className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
      />

      {/* Quick Camera Angle Buttons (Top, Isometric, Front) */}
      {navMode === 'orbit' && (
        <div className="absolute top-16 right-3 z-20 flex flex-col space-y-1.5">
          <button
            onClick={() => setPresetView('top')}
            className="p-2 rounded-xl glass-btn text-xs font-mono font-bold text-cyan-400 hover:text-white"
            title="Vista Planta 2D"
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

          {/* Toggle Dollhouse Cutaway */}
          <button
            onClick={toggleCeiling}
            className={`p-2 rounded-xl glass-btn text-xs font-mono font-bold transition ${
              showCeiling ? 'text-amber-400 border-amber-400/50' : 'text-cyan-400'
            }`}
            title="Techo Abierto / Casa de Muñecas"
          >
            {showCeiling ? 'Techo ON' : 'Techo OFF'}
          </button>
        </div>
      )}

      {/* Touch Dual Joystick for Walk Mode */}
      {navMode === 'walk' && (
        <div className="absolute bottom-28 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Movement D-Pad */}
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

          <div className="glass-pill px-3 py-2 rounded-xl text-center pointer-events-none max-w-[170px]">
            <span className="text-[11px] text-slate-300">Toca el suelo para teletransportarte o usa WASD / Flechas</span>
          </div>
        </div>
      )}

      {/* Measurement HUD banner */}
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
      <div className={`absolute bottom-0 inset-x-0 z-30 glass-panel rounded-t-3xl border-t border-cyan-500/20 shadow-2xl flex flex-col transition-all duration-300 pb-[max(0.75rem,env(safe-area-inset-bottom))]`}>
        {/* Drawer Pull Handle & Collapse Toggle */}
        <div 
          onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
          className="w-full flex items-center justify-between px-6 pt-2 pb-1 cursor-pointer"
        >
          <div className="w-8" />
          <div className="w-12 h-1 rounded-full bg-slate-600/70" />
          <button className="text-slate-400 hover:text-white p-1">
            {isDrawerCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-around px-3 pt-1 pb-2 border-b border-white/5 text-[11px] font-semibold">
          <button
            onClick={() => { setActiveTab('lighting'); setIsDrawerCollapsed(false); }}
            className={`pb-1 flex items-center space-x-1 transition ${
              activeTab === 'lighting' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Luz & Sol</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('ai_objects'); setIsDrawerCollapsed(false); }}
            className={`pb-1 flex items-center space-x-1 transition ${
              activeTab === 'ai_objects' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Objetos ({activeAIObjects.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('furniture'); setIsDrawerCollapsed(false); }}
            className={`pb-1 flex items-center space-x-1 transition ${
              activeTab === 'furniture' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mobiliario</span>
          </button>

          <button
            onClick={() => { setActiveTab('stats'); setIsDrawerCollapsed(false); }}
            className={`pb-1 flex items-center space-x-1 transition ${
              activeTab === 'stats' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Cotas</span>
          </button>

          <button
            onClick={() => { setActiveTab('export'); setIsDrawerCollapsed(false); }}
            className={`pb-1 flex items-center space-x-1 transition ${
              activeTab === 'export' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
        </div>

        {/* Collapsible Drawer Content */}
        {!isDrawerCollapsed && (
          <>
            {/* Tab 1: Functional Lighting & Solar Simulation */}
            {activeTab === 'lighting' && (
              <div className="p-4 flex flex-col space-y-3.5">
                {/* Sun Time of Day Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                      {timeOfDay >= 19 || timeOfDay < 7 ? (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-400" />
                      )}
                      <span>Posición Solar & Sombras:</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {timeOfDay}:00 hrs
                    </span>
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
                </div>

                {/* Interior Lights & Color Temp Controls */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setLightsOn(!lightsOn)}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                      lightsOn 
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' 
                        : 'glass-btn text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <span>Focos Techo</span>
                    </div>
                    <span>{lightsOn ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    onClick={() => setLightTemp(prev => (prev === 2700 ? 4000 : prev === 4000 ? 6500 : 2700))}
                    className="py-2 px-3 rounded-xl glass-btn border border-white/10 flex items-center justify-between text-xs font-bold text-cyan-300"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Thermometer className="w-4 h-4" />
                      <span>Temperatura</span>
                    </div>
                    <span className="text-[11px] font-mono">
                      {lightTemp === 2700 ? '2700K 🟡' : lightTemp === 4000 ? '4000K ⚪' : '6500K 🔵'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: AI Detected Objects & Textures */}
            {activeTab === 'ai_objects' && (
              <div className="p-4 flex flex-col space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Mobiliario Confirmado ({activeAIObjects.length}):
                  </span>
                  <button
                    onClick={() => setShowAIObjects(!showAIObjects)}
                    className="text-[11px] font-semibold text-cyan-400 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-400/30 hover:bg-cyan-500/20 transition"
                  >
                    {showAIObjects ? '👁️ Ocultar en 3D' : '📦 Mostrar en 3D'}
                  </button>
                </div>

                {activeAIObjects.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                    No hay objetos anclados. El espacio se visualiza en geometría 3D pura y limpia.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                    {activeAIObjects.map((obj) => (
                      <div
                        key={obj.id}
                        onClick={() => focusOnObject(obj)}
                        className="p-2 rounded-xl glass-btn border border-cyan-500/30 hover:border-cyan-400/80 cursor-pointer flex items-center space-x-2 active:scale-95 transition"
                        title="Toca para enfocar la cámara en 3D"
                      >
                        {obj.texture ? (
                          <img
                            src={obj.texture}
                            alt={obj.label}
                            className="w-10 h-10 rounded-lg object-cover border border-cyan-400/40 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 text-base">
                            {obj.icon || '📦'}
                          </div>
                        )}
                        <div className="flex-1 truncate">
                          <div className="text-xs font-bold text-white truncate flex items-center justify-between">
                            <span className="truncate">{obj.label}</span>
                            <button
                              onClick={(e) => removeAIObject(obj.id, e)}
                              className="text-slate-500 hover:text-red-400 p-0.5 shrink-0 ml-1"
                              title="Eliminar este anclaje"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-cyan-400 font-mono">
                            {obj.size3D ? `${obj.size3D.width}×${obj.size3D.depth}m` : `${obj.depth}m`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

        {/* Tab 3: Furniture Simulator */}
        {activeTab === 'furniture' && (
          <div className="p-4 flex flex-col space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              Añadir Mobiliario para Simular Distribución:
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button onClick={() => addFurniture('sofa')} className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap">🛋️ Sofá 3P</button>
              <button onClick={() => addFurniture('bed')} className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap">🛏️ Cama Queen</button>
              <button onClick={() => addFurniture('desk')} className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap">🖥️ Escritorio</button>
              <button onClick={() => addFurniture('plant')} className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap">🪴 Planta</button>
              <button onClick={() => addFurniture('lamp')} className="px-3 py-2 rounded-xl glass-btn text-slate-200 whitespace-nowrap">💡 Lámpara</button>
              <button onClick={() => addFurniture('mannequin')} className="px-3 py-2 rounded-xl glass-btn text-cyan-300 font-semibold whitespace-nowrap">🧍 Maniquí (1:1)</button>
            </div>

            {selectedFurnitureId && (
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between">
                <div className="text-xs font-semibold text-cyan-300 truncate max-w-[120px]">
                  {furnitureList.find(f => f.id === selectedFurnitureId)?.name}
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => moveSelectedFurniture(-0.25, 0)} className="p-1.5 rounded-lg glass-btn text-xs text-white">◀</button>
                  <button onClick={() => moveSelectedFurniture(0.25, 0)} className="p-1.5 rounded-lg glass-btn text-xs text-white">▶</button>
                  <button onClick={() => moveSelectedFurniture(0, -0.25)} className="p-1.5 rounded-lg glass-btn text-xs text-white">▲</button>
                  <button onClick={() => moveSelectedFurniture(0, 0.25)} className="p-1.5 rounded-lg glass-btn text-xs text-white">▼</button>
                  <button onClick={() => rotateSelectedFurniture(Math.PI / 4)} className="p-1.5 rounded-lg glass-btn text-cyan-400">
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeFurniture(selectedFurnitureId)} className="p-1.5 rounded-lg glass-btn text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: CAD Dimensions & Tape Measure */}
        {activeTab === 'stats' && (
          <div className="p-4 flex flex-col space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-[9px] text-slate-400 font-semibold uppercase">Ancho</div>
                <div className="text-sm font-bold text-cyan-400 font-mono">{bounds.width} m</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-[9px] text-slate-400 font-semibold uppercase">Largo</div>
                <div className="text-sm font-bold text-cyan-400 font-mono">{bounds.length} m</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-[9px] text-slate-400 font-semibold uppercase">Altura</div>
                <div className="text-sm font-bold text-cyan-400 font-mono">{bounds.height} m</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <div className="text-[9px] text-cyan-300 font-semibold uppercase">Superficie Útil</div>
                <div className="text-base font-extrabold text-white font-mono">{bounds.area} m²</div>
              </div>
              <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <div className="text-[9px] text-cyan-300 font-semibold uppercase">Volumen</div>
                <div className="text-base font-extrabold text-white font-mono">{bounds.volume} m³</div>
              </div>
            </div>

            <button
              onClick={() => {
                setMeasureMode(!measureMode);
                setMeasurePoints([]);
                setMeasuredDistance(null);
              }}
              className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition ${
                measureMode ? 'bg-cyan-500 text-white border-cyan-400' : 'glass-btn text-cyan-300 border-cyan-500/30'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>{measureMode ? 'Desactivar Cinta Métrica' : 'Activar Cinta Métrica (Tocar 2 Puntos)'}</span>
            </button>
          </div>
        )}

        {/* Tab 5: Export Formats */}
        {activeTab === 'export' && (
          <div className="p-4 flex flex-col space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => Exporter.exportOBJ(bounds, `${scanData.name || 'scan'}.obj`)}
                className="py-3 px-2 rounded-xl glass-btn hover:border-cyan-400/60 flex flex-col items-center justify-center space-y-1"
              >
                <Box className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold text-white">.OBJ Mesh</span>
                <span className="text-[9px] text-slate-400">Blender / 3D</span>
              </button>

              <button
                onClick={() => Exporter.exportPLY(points, `${scanData.name || 'scan'}.ply`)}
                className="py-3 px-2 rounded-xl glass-btn hover:border-cyan-400/60 flex flex-col items-center justify-center space-y-1"
              >
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-white">.PLY Puntos</span>
                <span className="text-[9px] text-slate-400">LiDAR Scan</span>
              </button>

              <button
                onClick={() => Exporter.exportSimulationJSON({
                  scan: scanData,
                  furniture: furnitureList.map(f => ({ type: f.type, position: f.position, rotationY: f.rotationY })),
                  lighting: { timeOfDay, lightsOn, lightTemp },
                  aiObjects: aiDetectedObjects
                }, `${scanData.name || 'scan'}-sim.json`)}
                className="py-3 px-2 rounded-xl glass-btn hover:border-cyan-400/60 flex flex-col items-center justify-center space-y-1"
              >
                <Download className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-white">.JSON Escena</span>
                <span className="text-[9px] text-slate-400">Simulación</span>
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

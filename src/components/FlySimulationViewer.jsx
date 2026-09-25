import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Brain,
  Bug,
  Activity,
  Zap,
  Sparkles,
  Download,
  Info,
  Play,
  Pause,
  RotateCcw,
  Sun,
  Compass,
  ArrowLeft,
  Sliders,
  Layers,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Flame,
  RefreshCw,
  Award
} from 'lucide-react';
import { FlyConnectomeEngine, FlyLearningMemoryEngine } from '../services/flyConnectomeEngine';

export function FlySimulationViewer({ onBackToRoomScanner }) {
  const containerRef = useRef(null);
  const flyContainerRef = useRef(null);

  // View state
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'connectome' | 'fly'
  const [isRunning, setIsRunning] = useState(true);
  const [firingRateHz, setFiringRateHz] = useState(4.2);
  const [activeStimulus, setActiveStimulus] = useState('memory'); // 'memory' | 'light' | 'mechanosensory' | 'none'
  const [selectedNeuropil, setSelectedNeuropil] = useState(null);
  const [dopamineBoostActive, setDopamineBoostActive] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [flyHeadingAngle, setFlyHeadingAngle] = useState(0);

  // Mushroom Body Learning & Synaptic Plasticity Engine
  const memoryEngineRef = useRef(new FlyLearningMemoryEngine());
  const [showLearningPanel, setShowLearningPanel] = useState(false);
  const [selectedStimulusIdx, setSelectedStimulusIdx] = useState(0);
  const [lastLearningEvent, setLastLearningEvent] = useState(null);
  const [memoryStats, setMemoryStats] = useState({
    valence: 0,
    stm: 0,
    ltm: 0,
    trials: 0,
    weightsApproach: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    weightsAvoidance: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
  });

  // Three.js scene refs for Connectome
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const pulsesRef = useRef(null);
  const neuropilsGroupRef = useRef(null);
  const neuronsGroupRef = useRef(null);

  // Three.js scene refs for Virtual Fly (FlyGym)
  const flySceneRef = useRef(null);
  const flyCameraRef = useRef(null);
  const flyRendererRef = useRef(null);
  const flyControlsRef = useRef(null);
  const flyModelRef = useRef(null);
  const flyLegsRef = useRef(null);
  const targetLightRef = useRef(null);
  const foodBeaconRef = useRef(null);

  const animFrameRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  // 1. Initialize Connectome 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.5;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight1.position.set(4, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.2);
    dirLight2.position.set(-4, -5, -3);
    scene.add(dirLight2);

    // Build Anatomical Neuropil Volumes
    const neuropilsGroup = FlyConnectomeEngine.buildNeuropilCompartments();
    neuropilsGroupRef.current = neuropilsGroup;
    scene.add(neuropilsGroup);

    // Build Morphological Neurons (E-PG Compass, Descending DNa, Kenyon Cells)
    const { neuronGroup } = FlyConnectomeEngine.buildNeuronSkeletons();
    neuronsGroupRef.current = neuronGroup;
    scene.add(neuronGroup);

    // Action Potential Particle Pulses
    const pulseSystem = FlyConnectomeEngine.createActionPotentialSystem();
    pulsesRef.current = pulseSystem;
    scene.add(pulseSystem);

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
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, []);

  // 2. Initialize FlyGym 3D Virtual Fly Arena
  useEffect(() => {
    if (!flyContainerRef.current) return;
    const width = flyContainerRef.current.clientWidth;
    const height = flyContainerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    flySceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 4.8);
    flyCameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    flyContainerRef.current.appendChild(renderer.domElement);
    flyRendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.target.set(0, 0.6, 0);
    flyControlsRef.current = controls;

    // Arena Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    sunLight.position.set(5, 8, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Interactive Light Target (Phototaxis stimulus)
    const targetLightGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const targetLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const targetLight = new THREE.Mesh(targetLightGeo, targetLightMat);
    targetLight.position.set(2.2, 0.35, 1.5);
    scene.add(targetLight);
    targetLightRef.current = targetLight;

    // Interactive Food / Conditioned Stimulus Beacon in Arena (Mushroom Body Learning Target)
    const foodGroup = new THREE.Group();
    foodGroup.position.set(2.4, 0.35, -2.0);

    const foodGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const foodMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      roughness: 0.3
    });
    const foodMesh = new THREE.Mesh(foodGeo, foodMat);
    foodMesh.castShadow = true;
    foodGroup.add(foodMesh);

    // Glowing Halo ring around beacon
    const haloGeo = new THREE.RingGeometry(0.35, 0.45, 24);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -0.3;
    foodGroup.add(halo);

    scene.add(foodGroup);
    foodBeaconRef.current = foodGroup;

    // Arena Floor
    const arenaFloorGeo = new THREE.CylinderGeometry(5.0, 5.0, 0.1, 48);
    const arenaFloorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.1
    });
    const arenaFloor = new THREE.Mesh(arenaFloorGeo, arenaFloorMat);
    arenaFloor.position.y = -0.05;
    arenaFloor.receiveShadow = true;
    scene.add(arenaFloor);

    // Arena Grid
    const arenaGrid = new THREE.GridHelper(10, 20, 0x06b6d4, 0x1e293b);
    arenaGrid.position.y = 0.005;
    scene.add(arenaGrid);

    // Arena Outer Boundary Ring
    const ringGeo = new THREE.TorusGeometry(5.0, 0.06, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    scene.add(ringMesh);

    // Build Biomechanical Fly Model (FlyGym)
    const { flyRoot, legNodes } = FlyConnectomeEngine.buildFlyGymModel();
    flyModelRef.current = flyRoot;
    flyLegsRef.current = legNodes;
    scene.add(flyRoot);

    const handleResize = () => {
      if (!flyContainerRef.current || !flyRendererRef.current || !flyCameraRef.current) return;
      const w = flyContainerRef.current.clientWidth;
      const h = flyContainerRef.current.clientHeight;
      flyCameraRef.current.aspect = w / h;
      flyCameraRef.current.updateProjectionMatrix();
      flyRendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (flyControlsRef.current) flyControlsRef.current.dispose();
      if (flyRendererRef.current && flyRendererRef.current.domElement) {
        flyRendererRef.current.domElement.remove();
      }
    };
  }, []);

  // 3. Main Animation Loop (Syncing Connectome with Fly Kinematics)
  useEffect(() => {
    let animId;

    const animate = () => {
      const delta = clockRef.current.getDelta();
      const time = clockRef.current.getElapsedTime();

      // Update Connectome scene
      if (controlsRef.current) controlsRef.current.update();
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        // Slowly revolve connectome for optimal 3D anatomical appreciation
        if (neuropilsGroupRef.current) {
          neuropilsGroupRef.current.rotation.y = time * 0.12;
        }
        if (neuronsGroupRef.current) {
          neuronsGroupRef.current.rotation.y = time * 0.12;
        }

        // Animate action potential particle pulses along axons
        if (pulsesRef.current && isRunning) {
          const positions = pulsesRef.current.geometry.attributes.position.array;
          for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 1] -= delta * 1.8 * (firingRateHz / 4.2);
            if (positions[i * 3 + 1] < -3.8) {
              positions[i * 3 + 1] = 1.2;
              positions[i * 3] = (Math.random() - 0.5) * 2.8;
              positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
            }
          }
          pulsesRef.current.geometry.attributes.position.needsUpdate = true;
          pulsesRef.current.rotation.y = time * 0.12;
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // Update Virtual Fly (FlyGym) scene
      if (flyControlsRef.current) flyControlsRef.current.update();
      if (flySceneRef.current && flyCameraRef.current && flyRendererRef.current) {
        if (isRunning && flyModelRef.current && flyLegsRef.current) {
          // Tripodal gait kinematic locomotion
          FlyConnectomeEngine.updateTripodGait(flyLegsRef.current, time, firingRateHz / 4.2);

          // Memory decay over time
          memoryEngineRef.current.decayMemory(delta);

          // Fly autonomous exploration: Phototaxis, Mechanosensory, or Learned Associative Memory
          if (activeStimulus === 'memory' && foodBeaconRef.current) {
            const currentValence = memoryEngineRef.current.getNetValence(selectedStimulusIdx);
            const beaconPos = foodBeaconRef.current.position;
            const flyPos = flyModelRef.current.position;
            const dist = flyPos.distanceTo(beaconPos);

            if (currentValence > 0.1) {
              // Learned Approach (Positive Valence): Guide fly towards the food beacon
              const targetYaw = Math.atan2(beaconPos.x - flyPos.x, beaconPos.z - flyPos.z);
              flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, targetYaw, 0.05);
              if (dist > 0.8) {
                flyModelRef.current.translateZ(0.016 * (firingRateHz / 4.2));
              }
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            } else if (currentValence < -0.1) {
              // Learned Avoidance (Negative Valence): Escape away from the beacon
              const escapeYaw = Math.atan2(flyPos.x - beaconPos.x, flyPos.z - beaconPos.z);
              flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, escapeYaw, 0.06);
              if (dist < 4.2) {
                flyModelRef.current.translateZ(0.02 * (firingRateHz / 4.2));
              }
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            } else {
              // Neutral exploratory wandering
              flyModelRef.current.rotation.y += Math.sin(time * 0.5) * 0.008;
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            }
          } else if (activeStimulus === 'light' && targetLightRef.current) {
            // Target light revolves around the arena
            const lightAngle = time * 0.45;
            targetLightRef.current.position.x = Math.cos(lightAngle) * 3.2;
            targetLightRef.current.position.z = Math.sin(lightAngle) * 3.2;

            // Turn fly head and body towards light (Closed-loop sensory motor steering)
            const targetYaw = Math.atan2(
              targetLightRef.current.position.x - flyModelRef.current.position.x,
              targetLightRef.current.position.z - flyModelRef.current.position.z
            );
            flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, targetYaw, 0.04);
            setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
          } else {
            // Forward walking trajectory
            flyModelRef.current.rotation.y += Math.sin(time * 0.5) * 0.008;
            setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
          }
        }

        flyRendererRef.current.render(flySceneRef.current, flyCameraRef.current);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, firingRateHz, activeStimulus, selectedStimulusIdx]);

  // Trigger virtual dopamine reward burst (as discussed in PDF)
  const triggerDopaminePulse = () => {
    setDopamineBoostActive(true);
    setFiringRateHz(prev => Math.min(10.0, prev + 2.5));

    if (pulsesRef.current) {
      const colors = pulsesRef.current.geometry.attributes.color.array;
      for (let i = 0; i < colors.length / 3; i++) {
        colors[i * 3] = 1.0;     // Gold / Magenta dopamine luminescence
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.15;
      }
      pulsesRef.current.geometry.attributes.color.needsUpdate = true;
    }

    setTimeout(() => {
      setDopamineBoostActive(false);
      setFiringRateHz(4.2);
      if (pulsesRef.current) {
        const colors = pulsesRef.current.geometry.attributes.color.array;
        for (let i = 0; i < colors.length / 3; i++) {
          colors[i * 3] = 0.2 + Math.random() * 0.8;
          colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
          colors[i * 3 + 2] = 0.9;
        }
        pulsesRef.current.geometry.attributes.color.needsUpdate = true;
      }
    }, 2800);
  };

  const handleTrain = (type) => { // 'reward' | 'punishment'
    const result = memoryEngineRef.current.train(selectedStimulusIdx, type);
    if (!result) return;

    setLastLearningEvent(result);
    setMemoryStats({
      valence: result.valence,
      stm: result.shortTermMemory,
      ltm: result.longTermMemory,
      trials: result.trialsCount,
      weightsApproach: [...memoryEngineRef.current.weightsApproach],
      weightsAvoidance: [...memoryEngineRef.current.weightsAvoidance]
    });

    // Dopamine burst in connectome
    if (pulsesRef.current) {
      const colors = pulsesRef.current.geometry.attributes.color.array;
      for (let i = 0; i < colors.length / 3; i++) {
        if (type === 'reward') {
          // Dopamine PAM gold
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.85;
          colors[i * 3 + 2] = 0.15;
        } else {
          // Shock PPL1 red/magenta
          colors[i * 3] = 0.95;
          colors[i * 3 + 1] = 0.15;
          colors[i * 3 + 2] = 0.45;
        }
      }
      pulsesRef.current.geometry.attributes.color.needsUpdate = true;
      setTimeout(() => {
        if (pulsesRef.current) {
          const c = pulsesRef.current.geometry.attributes.color.array;
          for (let i = 0; i < c.length / 3; i++) {
            c[i * 3] = 0.2 + Math.random() * 0.8;
            c[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            c[i * 3 + 2] = 0.9;
          }
          pulsesRef.current.geometry.attributes.color.needsUpdate = true;
        }
      }, 2500);
    }

    setActiveStimulus('memory');

    // Update food beacon visual feedback
    if (foodBeaconRef.current && foodBeaconRef.current.children[0]) {
      const color = type === 'reward' ? 0x10b981 : 0xef4444;
      foodBeaconRef.current.children[0].material.color.setHex(color);
      foodBeaconRef.current.children[0].material.emissive.setHex(color);
    }
  };

  const handleResetMemory = () => {
    memoryEngineRef.current.reset();
    setLastLearningEvent(null);
    setMemoryStats({
      valence: 0,
      stm: 0,
      ltm: 0,
      trials: 0,
      weightsApproach: [...memoryEngineRef.current.weightsApproach],
      weightsAvoidance: [...memoryEngineRef.current.weightsAvoidance]
    });
  };

  return (
    <div className="relative w-screen h-screen bg-[#060913] text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Top Header & Navigation Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 py-2.5 bg-black/60 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToRoomScanner}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            title="Volver al escáner de cuartos"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Espacios 3D</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider uppercase text-emerald-400 flex items-center space-x-1.5">
                <span>Drosophila Connectome 3D</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">MaleCNS v1.0</span>
              </div>
              <p className="text-[10px] text-slate-400">166.700 Neuronas · 124,2M Sinapsis · Simulación FlyGym</p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 p-0.5 rounded-xl bg-slate-900 border border-slate-700">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              viewMode === 'split' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Split Screen
          </button>
          <button
            onClick={() => setViewMode('connectome')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              viewMode === 'connectome' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            🧠 Conectoma 3D
          </button>
          <button
            onClick={() => setViewMode('fly')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              viewMode === 'fly' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            🪰 Mosca (FlyGym)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={triggerDopaminePulse}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg transition active:scale-95 ${
              dopamineBoostActive
                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 animate-pulse ring-2 ring-yellow-300'
                : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:brightness-110'
            }`}
            title="Envía una descarga de dopamina al cuerpo fúngico (PAM/Kenyon cells)"
          >
            <Sparkles className="w-4 h-4 text-yellow-200" />
            <span>{dopamineBoostActive ? '¡Dopamina Activa!' : 'Pulso Dopamina'}</span>
          </button>

          <button
            onClick={() => setShowLearningPanel(!showLearningPanel)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg transition active:scale-95 ${
              showLearningPanel
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110'
            }`}
            title="Abrir panel de condicionamiento asociativo y plasticidad sináptica (Cuerpos Fungiformes)"
          >
            <GraduationCap className="w-4 h-4 text-purple-200" />
            <span>🧠 Aprender & Memoria</span>
          </button>

          <button
            onClick={() => setShowDataModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-cyan-500/30 flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Datos & API</span>
          </button>
        </div>
      </header>

      {/* Main 3D Simulation Canvas Area */}
      <div className="relative flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: 3D Drosophila Connectome Brain & VNC */}
        <div
          ref={containerRef}
          className={`relative transition-all duration-300 ${
            viewMode === 'split'
              ? 'w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-cyan-500/20'
              : viewMode === 'connectome'
              ? 'w-full h-full'
              : 'hidden'
          }`}
        >
          {/* Connectome Badge */}
          <div className="absolute top-3 left-3 z-10 p-2.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 max-w-xs">
            <div className="text-[11px] font-bold text-cyan-400 flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5" />
              <span>Cerebro & Cordón Nervioso (VNC)</span>
            </div>
            <p className="text-[10px] text-slate-300 mt-0.5">
              Microscopía electrónica + reconstrucción celular completa (Janelia / Google Research).
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-400">
              <div>• Cpo. Elipsoidal: <span className="text-emerald-400">Brújula</span></div>
              <div>• Cpo. Fúngico: <span className="text-pink-400">Memoria</span></div>
              <div>• Lóbulo Óptico: <span className="text-cyan-400">Visión</span></div>
              <div>• VNC T1-T3: <span className="text-blue-400">Motor Patas</span></div>
            </div>
          </div>
        </div>

        {/* Right Side: FlyGym 3D Virtual Fly Arena */}
        <div
          ref={flyContainerRef}
          className={`relative transition-all duration-300 ${
            viewMode === 'split'
              ? 'w-full md:w-1/2 h-1/2 md:h-full'
              : viewMode === 'fly'
              ? 'w-full h-full'
              : 'hidden'
          }`}
        >
          {/* FlyGym Telemetry Badge */}
          <div className="absolute top-3 right-3 z-10 p-2.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-emerald-500/30 min-w-[200px]">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
              <Bug className="w-3.5 h-3.5" />
              <span>Simulación Física FlyGym (EPFL)</span>
            </div>
            <div className="mt-1.5 flex flex-col space-y-1 text-[10px] text-slate-300 font-mono">
              <div className="flex justify-between">
                <span>Rumbo (Compass):</span>
                <span className="text-cyan-400 font-bold">{flyHeadingAngle}°</span>
              </div>
              <div className="flex justify-between">
                <span>Paso Trípode:</span>
                <span className="text-emerald-400 font-bold">{firingRateHz.toFixed(1)} Hz</span>
              </div>
              <div className="flex justify-between">
                <span>Estímulo Activo:</span>
                <span className="text-yellow-300 capitalize">{activeStimulus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Dashboard & Telemetry */}
      <footer className="relative z-30 p-3 bg-slate-950/90 backdrop-blur-lg border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
        {/* Locomotion and Neural Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
              isRunning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-600 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunning ? 'Pausar' : 'Reanudar'}</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Frecuencia Motor:</span>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={firingRateHz}
              onChange={(e) => setFiringRateHz(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400"
            />
            <span className="text-xs font-mono font-bold text-cyan-400">{firingRateHz.toFixed(1)} Hz</span>
          </div>
        </div>

        {/* Sensory Stimuli Selectors */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Estímulo Sensorial:</span>
          <button
            onClick={() => setActiveStimulus('memory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
              activeStimulus === 'memory' ? 'bg-purple-500/30 text-purple-300 border border-purple-400/60' : 'bg-slate-900 text-slate-400'
            }`}
            title="Navegación guiada por memoria asociativa y valencia aprendida (Cuerpo Fungiforme)"
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-300" />
            <span>Memoria (MB)</span>
          </button>
          <button
            onClick={() => setActiveStimulus('light')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
              activeStimulus === 'light' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60' : 'bg-slate-900 text-slate-400'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-yellow-300" />
            <span>Luz (Fototaxis)</span>
          </button>
          <button
            onClick={() => setActiveStimulus('mechanosensory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
              activeStimulus === 'mechanosensory' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60' : 'bg-slate-900 text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-300" />
            <span>Viento / Antenas</span>
          </button>
          <button
            onClick={() => setActiveStimulus('none')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeStimulus === 'none' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Libre
          </button>
        </div>

        {/* Neurotransmitters Status Bar */}
        <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ACh (Excitatorio): 68%</span>
          </div>
          <div className="flex items-center space-x-1.5 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>GABA (Inhibitorio): 22%</span>
          </div>
          <div className="flex items-center space-x-1.5 text-pink-400">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Dopamina (Recompensa): {dopamineBoostActive ? '98%' : '10%'}</span>
          </div>
        </div>
      </footer>

      {/* Mushroom Body Associative Learning & Plasticity Modal */}
      {showLearningPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 max-w-2xl w-full flex flex-col space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Circuito de Aprendizaje y Memoria</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">Cuerpo Fungiforme (MB)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Plasticidad sináptica modulada por Dopamina (Células de Kenyon → MBONs)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLearningPanel(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            {/* Stimulus Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                1. Selecciona el Estímulo a Condicionar (Olor o Clave Sensorial):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {memoryEngineRef.current.stimuli.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSelectedStimulusIdx(idx);
                      setMemoryStats(prev => ({
                        ...prev,
                        valence: memoryEngineRef.current.getNetValence(idx)
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col space-y-1 ${
                      selectedStimulusIdx === idx
                        ? 'bg-purple-950/60 border-purple-400 ring-1 ring-purple-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-lg">{st.icon}</div>
                    <div className="text-xs font-bold text-white truncate">{st.name.split(':')[0]}</div>
                    <div className="text-[10px] text-slate-400 truncate">{st.name.split(':')[1] || ''}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Valence & Memory Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium">Valencia Aprendida:</span>
                <span className={`text-base font-extrabold font-mono mt-0.5 ${
                  memoryStats.valence > 0.1
                    ? 'text-emerald-400'
                    : memoryStats.valence < -0.1
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}>
                  {memoryStats.valence > 0 ? `+${memoryStats.valence}` : memoryStats.valence}
                </span>
                <span className="text-[10px] text-slate-400">
                  {memoryStats.valence > 0.1 ? '🟢 Búsqueda Activa / Atracción' : memoryStats.valence < -0.1 ? '🔴 Reflejo de Escape / Aversión' : '⚪ Neutro (Sin Condicionar)'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium">Memoria a Corto Plazo:</span>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${memoryStats.stm}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">{memoryStats.stm}% (decae si no se refuerza)</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium">Consolidación Larga (CREB):</span>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${memoryStats.ltm}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">{memoryStats.ltm}% ({memoryStats.trials} ensayos)</span>
              </div>
            </div>

            {/* Reinforcement Training Actions */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                2. Entrenar el Cerebro (Liberación de Dopamina / Refuerzo):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleTrain('reward')}
                  className="p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white flex items-center space-x-2.5 shadow-lg active:scale-95 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center text-lg">
                    🍬
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">Dar Azúcar / Recompensa (Dopamina PAM)</div>
                    <div className="text-[10px] text-emerald-200">Deprime sinapsis de evitación → Provoca atracción</div>
                  </div>
                </button>

                <button
                  onClick={() => handleTrain('punishment')}
                  className="p-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:brightness-110 text-white flex items-center space-x-2.5 shadow-lg active:scale-95 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-400/20 flex items-center justify-center text-lg">
                    ⚡
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">Dar Castigo / Shock (Dopamina PPL1)</div>
                    <div className="text-[10px] text-rose-200">Deprime sinapsis de atracción → Provoca huida</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Live Synaptic Weight Bars */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  Pesos Sinápticos (Células de Kenyon → Neuronas de Salida MBON):
                </span>
                <button
                  onClick={handleResetMemory}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resetear Memoria</span>
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1.5 text-center font-mono text-[9px]">
                {memoryStats.weightsApproach.map((w, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-14 w-full bg-slate-800 rounded flex flex-col justify-end p-0.5 space-y-0.5">
                      <div
                        className="w-full bg-emerald-400 rounded-t transition-all"
                        style={{ height: `${w * 100}%` }}
                        title={`KC-${i + 1} -> MBON Atracción: ${w.toFixed(2)}`}
                      />
                      <div
                        className="w-full bg-rose-400 rounded-t transition-all"
                        style={{ height: `${memoryStats.weightsAvoidance[i] * 100}%` }}
                        title={`KC-${i + 1} -> MBON Evitación: ${memoryStats.weightsAvoidance[i].toFixed(2)}`}
                      />
                    </div>
                    <span className="text-slate-400 mt-1">KC{i + 1}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center space-x-4 mt-2 text-[10px] text-slate-400">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded bg-emerald-400" />
                  <span>Sinapsis Atracción</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded bg-rose-400" />
                  <span>Sinapsis Evitación</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-slate-300 leading-relaxed">
              💡 <strong>Regla Biológica:</strong> En la mosca de la fruta el aprendizaje ocurre por <em>Depresión a Largo Plazo (LTD)</em>. Cuando se presenta comida, la dopamina debilita los canales de huida, inclinando el equilibrio motor para que la mosca camine automáticamente hacia ese olor en la arena.
            </div>

            <button
              onClick={() => setShowLearningPanel(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
            >
              Cerrar y Ver Comportamiento en la Arena
            </button>
          </div>
        </div>
      )}

      {/* Data Acquisition & API Modal */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 max-w-xl w-full flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Datos Oficiales del Conectoma (Drosophila)</h3>
              </div>
              <button
                onClick={() => setShowDataModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              El conjunto de datos <strong>MaleCNS v1.0</strong> y <strong>FlyWire</strong> representan la primera reconstrucción con resolución de sinapsis completas de un sistema nervioso animal adulto.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-cyan-400 mb-1 flex items-center space-x-1">
                  <span>1. Endpoint de neuPrint (API Pública Janelia)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <p className="text-slate-400 font-mono text-[11px] select-all">
                  https://neuprint.janelia.org (Dataset: male-cns:v1.0)
                </p>
                <p className="text-slate-400 mt-1">
                  Consulta de esqueletos .swc y grafos sinápticos usando la librería <code>neuprint-python</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-emerald-400 mb-1 flex items-center space-x-1">
                  <span>2. Google Cloud Storage Bucket (Descargas Planas)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <p className="text-slate-400 font-mono text-[11px] select-all">
                  gs://flyem-male-cns/v1.0/connectome-data/flat-connectome/
                </p>
                <p className="text-slate-400 mt-1">
                  Archivos .feather con tablas completas de sinapsis, neuronas y anotaciones celulares.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-purple-400 mb-1 flex items-center space-x-1">
                  <span>3. Ejecutar Script Local de Descarga</span>
                </div>
                <p className="text-slate-300 text-[11px] mb-1">
                  Ejecutá el script automatizado para descargar y estructurar los datos en tu Mac:
                </p>
                <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-cyan-300 select-all">
                  python3 scripts/fetch_fly_connectome.py
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDataModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

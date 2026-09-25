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
  Award,
  Wind,
  Rocket,
  Beaker,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Video
} from 'lucide-react';
import { 
  FlyConnectomeEngine, 
  FlyLearningMemoryEngine, 
  HOUSEHOLD_ODOR_PRODUCTS 
} from '../services/flyConnectomeEngine';

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

  // Flight kinematics & aerial status
  const [isFlying, setIsFlying] = useState(false);
  const flyWingsRef = useRef(null);
  const odorPlumeParticlesRef = useRef(null);
  const flightStateRef = useRef({
    targetY: 0,
    flyPhaseTimer: 0,
    flightSpeed: 0.038
  });

  // Live Fly Eye Viewport & Real-Time Compound Vision Analysis
  const flyEyeContainerRef = useRef(null);
  const flyEyeRendererRef = useRef(null);
  const flyEyeCameraRef = useRef(null);
  const lastYawRef = useRef(0);
  const lastTelemetryTimeRef = useRef(0);
  const [showEyeProjector, setShowEyeProjector] = useState(true);
  const [eyeVisionFilter, setEyeVisionFilter] = useState('ommatidia'); // 'ommatidia' | 'flow' | 'raw'
  const [isProjectorExpanded, setIsProjectorExpanded] = useState(false);
  const [visualTelemetry, setVisualTelemetry] = useState({
    opticalFlowHS: 0,
    opticalFlowVS: 0,
    expansionRate: 0,
    detectedContrast: 78,
    loomingAlert: false
  });

  // Mushroom Body Learning & Household Odor Olfactory Engine
  const memoryEngineRef = useRef(new FlyLearningMemoryEngine());
  const [showLearningPanel, setShowLearningPanel] = useState(false);
  const [selectedStimulusIdx, setSelectedStimulusIdx] = useState(0);
  const [lastLearningEvent, setLastLearningEvent] = useState(null);
  const [memoryStats, setMemoryStats] = useState({
    valence: HOUSEHOLD_ODOR_PRODUCTS[0]?.naturalValence || 0.92,
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

    // 3D Scent Vapor Plume Particles over Household Product
    const plumeCount = 45;
    const plumePositions = new Float32Array(plumeCount * 3);
    for (let p = 0; p < plumeCount; p++) {
      plumePositions[p * 3] = 2.4 + (Math.random() - 0.5) * 0.4;
      plumePositions[p * 3 + 1] = 0.35 + Math.random() * 1.5;
      plumePositions[p * 3 + 2] = -2.0 + (Math.random() - 0.5) * 0.4;
    }
    const plumeGeo = new THREE.BufferGeometry();
    plumeGeo.setAttribute('position', new THREE.BufferAttribute(plumePositions, 3));
    const initialProduct = HOUSEHOLD_ODOR_PRODUCTS[0];
    const plumeMat = new THREE.PointsMaterial({
      color: initialProduct?.colorHex || 0xeab308,
      size: 0.16,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const plumeParticles = new THREE.Points(plumeGeo, plumeMat);
    scene.add(plumeParticles);
    odorPlumeParticlesRef.current = plumeParticles;

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
    const { flyRoot, leftWing, rightWing, legNodes } = FlyConnectomeEngine.buildFlyGymModel();
    flyModelRef.current = flyRoot;
    flyLegsRef.current = legNodes;
    flyWingsRef.current = { leftWing, rightWing };
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

  // 2.5 Initialize Live First-Person Compound Eye WebGL Viewport
  useEffect(() => {
    if (!showEyeProjector || !flyEyeContainerRef.current) return;
    const container = flyEyeContainerRef.current;
    const width = container.clientWidth || (isProjectorExpanded ? 640 : 360);
    const height = container.clientHeight || (isProjectorExpanded ? 420 : 210);

    const eyeCamera = new THREE.PerspectiveCamera(118, width / height, 0.05, 60);
    flyEyeCameraRef.current = eyeCamera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    flyEyeRendererRef.current = renderer;

    const handleResize = () => {
      if (!flyEyeContainerRef.current || !flyEyeRendererRef.current || !flyEyeCameraRef.current) return;
      const w = flyEyeContainerRef.current.clientWidth;
      const h = flyEyeContainerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        flyEyeCameraRef.current.aspect = w / h;
        flyEyeCameraRef.current.updateProjectionMatrix();
        flyEyeRendererRef.current.setSize(w, h);
      }
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (flyEyeRendererRef.current && flyEyeRendererRef.current.domElement) {
        flyEyeRendererRef.current.domElement.remove();
      }
      flyEyeRendererRef.current = null;
      flyEyeCameraRef.current = null;
    };
  }, [showEyeProjector, isProjectorExpanded]);

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

      // Animate Scent Vapor Plume Particles over Household Product
      if (odorPlumeParticlesRef.current) {
        const pArr = odorPlumeParticlesRef.current.geometry.attributes.position.array;
        for (let p = 0; p < pArr.length / 3; p++) {
          pArr[p * 3 + 1] += delta * 0.45; // rise up into air
          pArr[p * 3] += Math.sin(time * 2.5 + p) * 0.003; // lateral diffusion
          pArr[p * 3 + 2] += Math.cos(time * 2.5 + p) * 0.003;
          if (pArr[p * 3 + 1] > 2.2) {
            const bPos = foodBeaconRef.current ? foodBeaconRef.current.position : new THREE.Vector3(2.4, 0.35, -2.0);
            pArr[p * 3] = bPos.x + (Math.random() - 0.5) * 0.3;
            pArr[p * 3 + 1] = bPos.y + 0.1;
            pArr[p * 3 + 2] = bPos.z + (Math.random() - 0.5) * 0.3;
          }
        }
        odorPlumeParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Update Virtual Fly (FlyGym) scene
      if (flyControlsRef.current) flyControlsRef.current.update();
      if (flySceneRef.current && flyCameraRef.current && flyRendererRef.current) {
        if (isRunning && flyModelRef.current && flyLegsRef.current) {
          // Flight kinematics vs Walking kinematics
          if (isFlying) {
            // High-speed wing flutter and aerodynamic leg tucking
            FlyConnectomeEngine.updateFlightKinematics(flyWingsRef.current, flyLegsRef.current, time, true);
          } else {
            // Wing resting and tripodal gait walking
            FlyConnectomeEngine.updateFlightKinematics(flyWingsRef.current, flyLegsRef.current, time, false);
            FlyConnectomeEngine.updateTripodGait(flyLegsRef.current, time, firingRateHz / 4.2);
          }

          // Memory decay over time
          memoryEngineRef.current.decayMemory(delta);

          // Autonomous Free Flight Cycles in "Libre" Status
          if (activeStimulus === 'none') {
            flightStateRef.current.flyPhaseTimer += delta;
            // Alternates: explores on floor for 9s -> takes off to fly for 12s -> lands smoothly
            if (!isFlying && flightStateRef.current.flyPhaseTimer > 9.0) {
              setIsFlying(true);
              flightStateRef.current.flyPhaseTimer = 0;
              flightStateRef.current.targetY = 1.3 + Math.random() * 0.9;
            } else if (isFlying && flightStateRef.current.flyPhaseTimer > 12.0) {
              flightStateRef.current.targetY = 0;
              if (flyModelRef.current.position.y <= 0.08) {
                setIsFlying(false);
                flyModelRef.current.position.y = 0;
                flightStateRef.current.flyPhaseTimer = 0;
              }
            }
          }

          // 3D Flight Altitude & Aerodynamics Attitude
          if (isFlying) {
            flyModelRef.current.position.y = THREE.MathUtils.lerp(
              flyModelRef.current.position.y,
              flightStateRef.current.targetY || 1.5,
              0.045
            );
            flyModelRef.current.rotation.x = THREE.MathUtils.lerp(flyModelRef.current.rotation.x, -0.2, 0.06);
            const flightSpeed = 0.038 * (firingRateHz / 4.2);
            flyModelRef.current.translateZ(flightSpeed);

            // Turn inwards when approaching arena perimeter
            const distCenter = Math.sqrt(flyModelRef.current.position.x ** 2 + flyModelRef.current.position.z ** 2);
            if (distCenter > 3.8) {
              const inwardAngle = Math.atan2(-flyModelRef.current.position.x, -flyModelRef.current.position.z);
              flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, inwardAngle, 0.06);
              flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0.35, 0.08);
            } else {
              flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0, 0.05);
            }
          } else {
            // Ground level recovery
            flyModelRef.current.position.y = THREE.MathUtils.lerp(flyModelRef.current.position.y, 0, 0.1);
            flyModelRef.current.rotation.x = THREE.MathUtils.lerp(flyModelRef.current.rotation.x, 0, 0.1);
            flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0, 0.1);
          }

          // Household Odor Olfactory Response or Light Phototaxis
          if (activeStimulus === 'memory' && foodBeaconRef.current) {
            const currentValence = memoryEngineRef.current.getNetValence(selectedStimulusIdx);
            const beaconPos = foodBeaconRef.current.position;
            const flyPos = flyModelRef.current.position;
            const dist = flyPos.distanceTo(beaconPos);

            if (currentValence > 0.1) {
              // Attraction: Seek and feed on household product (Banana, Vinegar, Yeast, Honey)
              if (isFlying && dist < 1.8) {
                flightStateRef.current.targetY = 0; // Prepare landing beside food
                if (flyPos.y < 0.15) setIsFlying(false);
              }
              const targetYaw = Math.atan2(beaconPos.x - flyPos.x, beaconPos.z - flyPos.z);
              flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, targetYaw, 0.05);
              if (dist > 0.75) {
                flyModelRef.current.translateZ(isFlying ? 0.035 : 0.016 * (firingRateHz / 4.2));
              }
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            } else if (currentValence < -0.1) {
              // Repulsion: Garlic, Lemon, Soap, Coffee (Emergency Takeoff & Escape flight)
              if (!isFlying && dist < 3.2) {
                setIsFlying(true);
                flightStateRef.current.targetY = 1.8 + Math.random() * 0.6;
              }
              const escapeYaw = Math.atan2(flyPos.x - beaconPos.x, flyPos.z - beaconPos.z);
              flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, escapeYaw, 0.07);
              flyModelRef.current.translateZ(isFlying ? 0.045 : 0.022 * (firingRateHz / 4.2));
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            } else {
              // Neutral exploratory wandering
              flyModelRef.current.rotation.y += Math.sin(time * 0.5) * 0.008;
              if (!isFlying) flyModelRef.current.translateZ(0.012 * (firingRateHz / 4.2));
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            }
          } else if (activeStimulus === 'light' && targetLightRef.current) {
            // Target light revolves around the arena
            const lightAngle = time * 0.45;
            targetLightRef.current.position.x = Math.cos(lightAngle) * 3.2;
            targetLightRef.current.position.z = Math.sin(lightAngle) * 3.2;

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

        // Render Real-Time Compound Eye First-Person Perspective (Optic Lobe)
        if (showEyeProjector && flyEyeRendererRef.current && flyEyeCameraRef.current && flyModelRef.current) {
          // Mount camera directly at the compound eyes (head position + offset)
          const eyeLocalPos = new THREE.Vector3(0, 0.98, 1.16);
          const eyeWorldPos = eyeLocalPos.clone().applyQuaternion(flyModelRef.current.quaternion).add(flyModelRef.current.position);

          const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(flyModelRef.current.quaternion);
          const gazeTarget = eyeWorldPos.clone().add(forwardDir.clone().multiplyScalar(4));

          flyEyeCameraRef.current.position.copy(eyeWorldPos);
          flyEyeCameraRef.current.lookAt(gazeTarget);

          flyEyeRendererRef.current.render(flySceneRef.current, flyEyeCameraRef.current);

          // Real-time Optic Lobe neural analysis (LPTC HS/VS, FoE, Looming detection)
          if (time - lastTelemetryTimeRef.current > 0.08) {
            lastTelemetryTimeRef.current = time;
            const currentYaw = flyModelRef.current.rotation.y;
            const yawDelta = currentYaw - (lastYawRef.current !== undefined ? lastYawRef.current : currentYaw);
            lastYawRef.current = currentYaw;

            const hsVal = Math.round(-yawDelta * 240); // Horizontal System (LPTC HS)
            const vsVal = Math.round(flyModelRef.current.rotation.x * 90 + (isFlying ? -14 : 0)); // Vertical System (LPTC VS)
            const forwardSpd = isFlying ? 0.038 : (firingRateHz / 4.2) * 0.016;
            const expansion = Math.round(forwardSpd * 1800);

            let loomingAlert = false;
            if (foodBeaconRef.current) {
              const dist = flyModelRef.current.position.distanceTo(foodBeaconRef.current.position);
              if (dist < 1.4 && (isFlying || Math.abs(hsVal) > 20)) loomingAlert = true;
            }

            setVisualTelemetry({
              opticalFlowHS: hsVal,
              opticalFlowVS: vsVal,
              expansionRate: expansion,
              loomingAlert,
              detectedContrast: Math.min(98, 70 + Math.abs(hsVal * 0.5))
            });
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, firingRateHz, activeStimulus, selectedStimulusIdx, isFlying, showEyeProjector]);

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
      valence: HOUSEHOLD_ODOR_PRODUCTS[selectedStimulusIdx]?.naturalValence || 0,
      stm: 0,
      ltm: 0,
      trials: 0,
      weightsApproach: [...memoryEngineRef.current.weightsApproach],
      weightsAvoidance: [...memoryEngineRef.current.weightsAvoidance]
    });
  };

  const handleSelectOdorProduct = (productIdx) => {
    setSelectedStimulusIdx(productIdx);
    setActiveStimulus('memory');
    const prod = HOUSEHOLD_ODOR_PRODUCTS[productIdx];
    if (!prod) return;

    // Update food beacon in 3D arena
    if (foodBeaconRef.current && foodBeaconRef.current.children[0]) {
      foodBeaconRef.current.children[0].material.color.setHex(prod.colorHex);
      foodBeaconRef.current.children[0].material.emissive.setHex(prod.emissive);
    }
    // Update odor vapor plume particles color
    if (odorPlumeParticlesRef.current) {
      odorPlumeParticlesRef.current.material.color.setHex(prod.colorHex);
    }

    const val = memoryEngineRef.current.getNetValence(productIdx);
    setMemoryStats(prev => ({
      ...prev,
      valence: val
    }));
  };

  const toggleFlight = () => {
    if (isFlying) {
      // Initiate descent & smooth landing
      flightStateRef.current.targetY = 0;
      setTimeout(() => {
        setIsFlying(false);
        if (flyModelRef.current) flyModelRef.current.position.y = 0;
      }, 700);
    } else {
      // Initiate vertical takeoff
      setIsFlying(true);
      flightStateRef.current.targetY = 1.6;
    }
  };

  const currentProduct = HOUSEHOLD_ODOR_PRODUCTS[selectedStimulusIdx] || HOUSEHOLD_ODOR_PRODUCTS[0];

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
            onClick={() => setShowEyeProjector(!showEyeProjector)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg transition active:scale-95 ${
              showEyeProjector
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Pantalla proyectora de visión en tiempo real (Lóbulo Óptico de la Mosca)"
          >
            <Eye className="w-4 h-4 text-emerald-300" />
            <span>{showEyeProjector ? '👁️ Visión Mosca ON' : '👁️ Visión Mosca OFF'}</span>
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
          {/* Household Odor Testing Palette in Arena */}
          <div className="absolute top-3 left-3 z-10 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-amber-500/40 max-w-[230px] shadow-xl">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 mb-1.5">
              <Beaker className="w-4 h-4 text-amber-400" />
              <span>Test Olores Caseros</span>
            </div>
            <select
              value={selectedStimulusIdx}
              onChange={(e) => handleSelectOdorProduct(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-amber-400 outline-none cursor-pointer"
            >
              {HOUSEHOLD_ODOR_PRODUCTS.map((prod, idx) => (
                <option key={prod.id} value={idx}>
                  {prod.icon} {prod.name} ({prod.naturalValence > 0 ? `+${prod.naturalValence}` : `${prod.naturalValence}`})
                </option>
              ))}
            </select>
            {currentProduct && (
              <div className="mt-2 text-[10px] text-slate-300 space-y-0.5 font-mono">
                <div className="text-amber-300 font-semibold truncate">{currentProduct.compound}</div>
                <div className="text-slate-400">Glomérulo: <span className="text-cyan-400">{currentProduct.glomerulus}</span></div>
                <div className="text-slate-400">
                  Reacción: <span className={memoryStats.valence > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {memoryStats.valence > 0 ? "🟢 Atracción" : "🔴 Escape Nociceptivo"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* FlyGym Telemetry & Aerial Flight Badge */}
          <div className="absolute top-3 right-3 z-10 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 min-w-[210px] shadow-xl">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Bug className="w-3.5 h-3.5" />
                <span>FlyGym Físico (EPFL)</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                isFlying ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {isFlying ? '🚀 EN VUELO 3D' : '🪰 EN SUELO'}
              </span>
            </div>
            <div className="mt-2 flex flex-col space-y-1 text-[10px] text-slate-300 font-mono">
              <div className="flex justify-between">
                <span>Altitud 3D:</span>
                <span className={isFlying ? "text-amber-300 font-bold" : "text-slate-400"}>
                  {isFlying ? `${(flyModelRef.current?.position.y || 1.6).toFixed(1)} m` : "0.0 m (Suelo)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rumbo (Compass):</span>
                <span className="text-cyan-400 font-bold">{flyHeadingAngle}°</span>
              </div>
              <div className="flex justify-between">
                <span>Locomoción:</span>
                <span className="text-emerald-400 font-bold">
                  {isFlying ? 'Aleteo 200 Hz' : `${firingRateHz.toFixed(1)} Hz (Trípode)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Olor Activo:</span>
                <span className="text-yellow-300 truncate max-w-[100px]">{currentProduct.icon} {currentProduct.name.split(':')[0]}</span>
              </div>
            </div>

            {/* Manual Flight / Land Trigger Button */}
            <button
              onClick={toggleFlight}
              className={`mt-2.5 w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow active:scale-95 ${
                isFlying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{isFlying ? 'Aterrizar en Suelo' : 'Despegar a Volar 3D'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Fly Eye Projector Screen HUD (Floating Theater / PIP Screen) */}
      {showEyeProjector && (
        <div
          className={`transition-all duration-300 z-40 flex flex-col ${
            isProjectorExpanded
              ? 'fixed inset-3 md:inset-8 bg-slate-950/95 backdrop-blur-2xl border-2 border-emerald-500/60 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden'
              : 'fixed bottom-16 sm:bottom-20 right-3 sm:right-4 w-[350px] sm:w-[390px] bg-slate-950/95 backdrop-blur-xl border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden'
          }`}
        >
          {/* Projector Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border-b border-emerald-500/30">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                <Eye className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-400 tracking-wide flex items-center space-x-1.5">
                  <span>PROYECTOR VISIÓN MOSCA</span>
                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">118° FOV</span>
                </div>
                <div className="text-[9px] text-slate-400">Análisis Neuronal en Tiempo Real (Lóbulo Óptico)</div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Expand / Minimize Button */}
              <button
                onClick={() => setIsProjectorExpanded(!isProjectorExpanded)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title={isProjectorExpanded ? "Minimizar pantalla" : "Expandir pantalla a modo teatro"}
              >
                {isProjectorExpanded ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              {/* Close Projector */}
              <button
                onClick={() => setShowEyeProjector(false)}
                className="p-1 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
                title="Cerrar proyector"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Selector Buttons Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px]">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setEyeVisionFilter('ommatidia')}
                className={`px-2 py-0.5 rounded-md font-semibold transition flex items-center space-x-1 ${
                  eyeVisionFilter === 'ommatidia'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Mosaico hexagonal de 750 ommatidias con espectro fotorreceptor (UV/Azul/Verde)"
              >
                <span>🐝 Ommatidias</span>
              </button>
              <button
                onClick={() => setEyeVisionFilter('flow')}
                className={`px-2 py-0.5 rounded-md font-semibold transition flex items-center space-x-1 ${
                  eyeVisionFilter === 'flow'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Campo vectorial de flujo óptico calculado por neuronas LPTC de la placa lobular"
              >
                <span>🔄 Flujo Óptico</span>
              </button>
              <button
                onClick={() => setEyeVisionFilter('raw')}
                className={`px-2 py-0.5 rounded-md font-semibold transition flex items-center space-x-1 ${
                  eyeVisionFilter === 'raw'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Visión gran angular limpia sin retículas"
              >
                <span>👁️ POV Puro</span>
              </button>
            </div>

            <div className="text-[9px] font-mono text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>&gt;250 Hz FUSIÓN</span>
            </div>
          </div>

          {/* Projector Screen Video Canvas & Overlays */}
          <div className={`relative w-full ${isProjectorExpanded ? 'flex-1 min-h-[380px]' : 'h-[210px]'} bg-black overflow-hidden select-none`}>
            {/* 3D WebGL Canvas Container */}
            <div ref={flyEyeContainerRef} className="w-full h-full" />

            {/* Looming Collision Warning Banner */}
            {visualTelemetry.loomingAlert && (
              <div className="absolute top-2 inset-x-2 z-20 px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[10px] font-bold flex items-center justify-between border border-rose-400 animate-pulse shadow-lg">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">⚠️</span>
                  <span>EXPANSIÓN ÓPTICA RÁPIDA (LOOMING): COLISIÓN INMINENTE</span>
                </div>
                <span className="font-mono text-[9px] bg-rose-950/80 px-1.5 py-0.5 rounded">Reflejo GF</span>
              </div>
            )}

            {/* 1. Ommatidia Hexagonal Overlay Filter */}
            {eyeVisionFilter === 'ommatidia' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
                <defs>
                  <pattern id="hex-lattice" width="24" height="41.57" patternUnits="userSpaceOnUse">
                    <path
                      d="M12 0 L24 6.93 L24 20.78 L12 27.71 L0 20.78 L0 6.93 Z M0 27.71 L12 34.64 L12 48.49 L0 55.43 L-12 48.49 L-12 34.64 Z M24 27.71 L36 34.64 L36 48.49 L24 55.43 L12 48.49 L12 34.64 Z"
                      stroke="rgba(16, 185, 129, 0.4)"
                      strokeWidth="0.8"
                      fill="rgba(6, 78, 59, 0.08)"
                    />
                  </pattern>
                  <radialGradient id="eye-vignette" cx="50%" cy="50%" r="50%">
                    <stop offset="65%" stopColor="transparent" />
                    <stop offset="90%" stopColor="rgba(6, 9, 19, 0.6)" />
                    <stop offset="100%" stopColor="rgba(6, 9, 19, 0.95)" />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#hex-lattice)" />
                <rect width="100%" height="100%" fill="url(#eye-vignette)" />
                {/* Central Gaze Crosshairs */}
                <circle cx="50%" cy="50%" r="16" fill="none" stroke="rgba(52, 211, 153, 0.7)" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="50%" y1="42%" x2="50%" y2="58%" stroke="rgba(52, 211, 153, 0.7)" strokeWidth="1" />
                <line x1="42%" y1="50%" x2="58%" y2="50%" stroke="rgba(52, 211, 153, 0.7)" strokeWidth="1" />
              </svg>
            )}

            {/* 2. Optical Flow & LPTC Vector Field Overlay Filter */}
            {eyeVisionFilter === 'flow' && (
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2">
                {/* Central Focus of Expansion (FoE) Target */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border border-cyan-400/60 border-dashed animate-spin" style={{ animationDuration: '8s' }} />
                    <div className="w-2 h-2 rounded-full bg-cyan-400 absolute" />
                    <span className="absolute -bottom-4 text-[8px] font-mono text-cyan-300 font-bold tracking-tight">FoE (Foco Expansión)</span>
                  </div>
                </div>

                {/* Dynamic Vector Arrows Matrix */}
                {[
                  { x: 25, y: 30, dx: -0.6, dy: -0.4 },
                  { x: 50, y: 22, dx: 0.0, dy: -0.8 },
                  { x: 75, y: 30, dx: 0.6, dy: -0.4 },
                  { x: 18, y: 50, dx: -0.9, dy: 0.0 },
                  { x: 82, y: 50, dx: 0.9, dy: 0.0 },
                  { x: 25, y: 70, dx: -0.6, dy: 0.4 },
                  { x: 50, y: 78, dx: 0.0, dy: 0.8 },
                  { x: 75, y: 70, dx: 0.6, dy: 0.4 },
                ].map((pt, idx) => {
                  const hsShift = -(visualTelemetry.opticalFlowHS || 0) * 0.12;
                  const vsShift = -(visualTelemetry.opticalFlowVS || 0) * 0.12;
                  const expShiftX = pt.dx * (visualTelemetry.expansionRate || 30) * 0.35;
                  const expShiftY = pt.dy * (visualTelemetry.expansionRate || 30) * 0.35;
                  const totalVx = hsShift + expShiftX;
                  const totalVy = vsShift + expShiftY;
                  const len = Math.min(32, Math.max(10, Math.sqrt(totalVx * totalVx + totalVy * totalVy)));
                  const angle = Math.atan2(totalVy, totalVx);
                  const angleDeg = (angle * 180) / Math.PI;

                  return (
                    <div
                      key={idx}
                      className="absolute pointer-events-none flex items-center justify-center"
                      style={{
                        left: `${pt.x}%`,
                        top: `${pt.y}%`,
                        transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`
                      }}
                    >
                      <div
                        className={`h-[2px] rounded-full transition-all duration-75 flex items-center justify-end ${
                          Math.abs(visualTelemetry.opticalFlowHS) > 25 ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${len}px` }}
                      >
                        <div
                          className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[6px]"
                          style={{
                            borderLeftColor: Math.abs(visualTelemetry.opticalFlowHS) > 25 ? '#fbbf24' : '#38bdf8'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Real-time Compass & Pitch Heading overlay */}
            <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-cyan-300 border border-cyan-500/20">
              RUMBO: {flyHeadingAngle}° · {isFlying ? 'ELEVACIÓN 3D' : 'RASANTE SUELO'}
            </div>
          </div>

          {/* Projector Telemetry Deck (Optic Lobe Circuit Readouts) */}
          <div className="p-2.5 bg-slate-950 border-t border-emerald-500/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center font-mono">
              {/* LPTC HS Cells */}
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[8px] text-slate-400 font-sans truncate">LPTC Células HS</div>
                <div className={`text-xs font-bold ${Math.abs(visualTelemetry.opticalFlowHS) > 20 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {visualTelemetry.opticalFlowHS > 0 ? `+${visualTelemetry.opticalFlowHS}` : visualTelemetry.opticalFlowHS} °/s
                </div>
                <div className="text-[7px] text-slate-400">Giro / Guiñada</div>
              </div>

              {/* LPTC VS Cells */}
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[8px] text-slate-400 font-sans truncate">LPTC Células VS</div>
                <div className="text-xs font-bold text-emerald-400">
                  {visualTelemetry.opticalFlowVS > 0 ? `+${visualTelemetry.opticalFlowVS}` : visualTelemetry.opticalFlowVS} °/s
                </div>
                <div className="text-[7px] text-slate-400">Flujo Vertical</div>
              </div>

              {/* Focus of Expansion / Looming */}
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[8px] text-slate-400 font-sans truncate">Expansión (FoE)</div>
                <div className={`text-xs font-bold ${visualTelemetry.loomingAlert ? 'text-rose-400 animate-pulse' : 'text-purple-400'}`}>
                  {visualTelemetry.expansionRate}% / s
                </div>
                <div className="text-[7px] text-slate-400">Aproximación</div>
              </div>

              {/* Lamina L1/L2 ON/OFF contrast */}
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[8px] text-slate-400 font-sans truncate">Lámina L1/L2</div>
                <div className="text-xs font-bold text-yellow-400">
                  {visualTelemetry.detectedContrast}%
                </div>
                <div className="text-[7px] text-slate-400">ON / OFF Dinámico</div>
              </div>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[8px] text-slate-400 px-1 font-mono">
              <span>Fotorreceptores: R1-R6 (480nm) · R7 UV (345nm) · R8 (508nm)</span>
              <span className="text-emerald-400 font-bold">750 OMMATIDIAS/OJO</span>
            </div>
          </div>
        </div>
      )}

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

          <button
            onClick={toggleFlight}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition border ${
              isFlying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-indigo-500/30'
            }`}
            title="Alterna entre caminata tripodal terrestre y vuelo 3D con aleteo de alas"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{isFlying ? 'Aterrizar' : 'Volar 3D'}</span>
          </button>

          <button
            onClick={() => setShowEyeProjector(!showEyeProjector)}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition border ${
              showEyeProjector
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title="Activar o desactivar pantalla proyectora de visión en primera persona de la mosca"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showEyeProjector ? 'Ocultar Proyector' : '👁️ Ver Visión'}</span>
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
                1. Selecciona el Producto Casero a Evaluar / Condicionar:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HOUSEHOLD_ODOR_PRODUCTS.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => handleSelectOdorProduct(idx)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col space-y-1 ${
                      selectedStimulusIdx === idx
                        ? 'bg-purple-950/60 border-purple-400 ring-1 ring-purple-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{st.icon}</span>
                      <span className={`text-[9px] font-mono px-1 rounded ${
                        st.naturalValence > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {st.naturalValence > 0 ? `+${st.naturalValence}` : st.naturalValence}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{st.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{st.compound}</div>
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

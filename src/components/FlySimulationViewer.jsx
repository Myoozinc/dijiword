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
  ChevronDown,
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
  Video,
  Utensils,
  Cpu,
  Home,
  MousePointer,
  Crosshair,
  Target,
  Radio,
  Trash2,
  HelpCircle,
  Fingerprint,
  AlertTriangle,
  MessageSquare,
  BrainCircuit,
  Mic,
  Volume2,
  VolumeX,
  Send,
  Dna,
  X
} from 'lucide-react';
import { 
  FlyConnectomeEngine, 
  FlyLearningMemoryEngine, 
  HOUSEHOLD_ODOR_PRODUCTS,
  CANONICAL_NEUROPILS_DB,
  FLYWIRE_NEURON_DATABASE
} from '../services/flyConnectomeEngine';
import { flyM5Bridge } from '../services/flyM5BridgeService';
import { 
  neuroAIConsciousness, 
  SYNAPTIC_PERSONALITY_PROFILES 
} from '../services/neuroAIConsciousnessEngine';
import { KitchenEnvironment } from '../services/kitchenEnvironment';
import { RoomReconstruction } from '../services/roomReconstruction';

// Helper to safely extract 3D coordinates from AI detected objects or bounding boxes
function get3DPos(obj, fallback = { x: 0, y: 0, z: 0 }) {
  if (!obj) return fallback;
  if (obj.position3D && typeof obj.position3D.x === 'number') return obj.position3D;
  if (obj.position && typeof obj.position.x === 'number') return obj.position;
  return fallback;
}

// Fly Scale factor relative to 3.2-meter FlyGym model:
// Drosophila melanogaster real life length: ~2.5 to 3.0 mm.
// Island: 3.6m x 1.8m. Banana: 0.22m. Fruit bowl: 0.45m.
export const FLY_SCALE_VALUES = {
  proportional: 0.045,   // ~14 cm (Ideal visual balance on countertop/fruits)
  realistic_1to1: 0.015, // ~4.8 cm (Realistic life-like insect size)
  macro_flygym: 0.16,    // ~50 cm (Joint biomechanics inspection)
  anatomic: 0.50,        // ~1.5 m (Large anatomical study)
};

export const FLY_SCALE_OPTIONS = [
  { id: 'proportional', label: '📐 Proporcional (~14 cm)', tag: '14 cm', desc: 'Proporción óptima relativa a frutas y encimera' },
  { id: 'realistic_1to1', label: '🔬 1:1 Insecto (~4 cm)', tag: '4 cm', desc: 'Tamaño realista de insecto en la cocina' },
  { id: 'macro_flygym', label: '🪰 Macro FlyGym (~50 cm)', tag: '50 cm', desc: 'Inspección de articulaciones de patas y alas' },
  { id: 'anatomic', label: '🔍 Anatómico (~1.5 m)', tag: '1.5 m', desc: 'Estudio morfológico detallado' },
];

export function FlySimulationViewer({ onBackToRoomScanner, onBackToLobby, scannedRoomData }) {
  const containerRef = useRef(null);
  const flyContainerRef = useRef(null);

  // View state (Default to clean, full-screen Fly 3D environment)
  const [viewMode, setViewMode] = useState('fly'); // 'fly' | 'split' | 'connectome'
  const [isRunning, setIsRunning] = useState(true);
  const [firingRateHz, setFiringRateHz] = useState(4.2);
  // ── Multi-Sensory Modality Toggles (simultaneously active, like real Drosophila) ──
  // Replaces the old single-exclusive activeStimulus string with a Set of active channels.
  // The fly integrates ALL active channels simultaneously as weighted neural vector fields.
  const [activeStimulusSet, setActiveStimulusSet] = useState(
    new Set(['memory', 'light', 'mechanosensory']) // All 3 ON by default
  );
  // Keep a legacy-compat alias so old references don't break immediately
  const activeStimulus = activeStimulusSet.size === 0 ? 'none'
    : activeStimulusSet.has('memory') ? 'memory'
    : activeStimulusSet.has('light') ? 'light'
    : 'mechanosensory';
  const toggleStimulusChannel = (ch) => {
    setActiveStimulusSet(prev => {
      const next = new Set(prev);
      if (next.has(ch)) { next.delete(ch); } else { next.add(ch); }
      return next;
    });
  };
  const [selectedNeuropil, setSelectedNeuropil] = useState(null);
  const [dopamineBoostActive, setDopamineBoostActive] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [flyHeadingAngle, setFlyHeadingAngle] = useState(0);

  // HUD Collapsibility & Clean Dock State (Starts 100% clean and unobstructed)
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [isConnectomeHudCollapsed, setIsConnectomeHudCollapsed] = useState(true);
  const [isOdorPaletteCollapsed, setIsOdorPaletteCollapsed] = useState(true);
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState(true);
  const [activeFlyDockTab, setActiveFlyDockTab] = useState(null); // null | 'telemetry' | 'odors' | 'environment' | 'mea'
  const [showSensoryCascade, setShowSensoryCascade] = useState(false); // Collapsed by default
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  // Fly Scale & Proportions Control
  // 'proportional': 0.045 (~14cm) | 'realistic_1to1': 0.015 (~4.8cm) | 'macro_flygym': 0.16 (~50cm) | 'anatomic': 0.50 (~1.5m)
  const [flyScaleMode, setFlyScaleMode] = useState('proportional');
  const [isFollowCamActive, setIsFollowCamActive] = useState(true);

  // Kitchen Boundaries Control: 'terrarium' (glass terrarium on island) | 'room' (open full kitchen bounded by 4 walls)
  const [kitchenBoundaryMode, setKitchenBoundaryMode] = useState('terrarium');

  // 3D Environment mode: 'kitchen' (Virtual Kitchen) | 'scanned_room' (Habitación Escaneada) | 'arena' (Laboratory Arena)
  const [currentRoomScan, setCurrentRoomScan] = useState(() => {
    return scannedRoomData || RoomReconstruction.getPresetRooms()[0];
  });
  const [activeEnvironment, setActiveEnvironment] = useState(() => {
    return scannedRoomData ? 'scanned_room' : 'kitchen';
  });
  const kitchenDataRef = useRef(null);
  const arenaGroupRef = useRef(null);
  const scannedRoomGroupRef = useRef(null);

  // Massive Neural Connectome (Default: 100% Genuine 169,315 ssTEM Neurons & 124.2M Synapses)
  const [connectomeDensity, setConnectomeDensity] = useState('real_banc_169k'); // 'real_banc_169k' | 'full_166k' | 'm5_ultra' | 'high' | 'medium'
  const [connectomeFilter, setConnectomeFilter] = useState('all'); // 'all' | 'mb' | 'cx' | 'optic' | 'vnc'
  const [connectomeColorMode, setConnectomeColorMode] = useState('neurotransmitter'); // 'neurotransmitter' | 'region'
  const [connectomeStats, setConnectomeStats] = useState({
    totalNeurons: 169315,
    countKC: 52400,
    countOptic: 68500,
    countCX: 3600,
    countAL: 3400,
    countDN: 2150,
    countVNC: 39265,
    somaCount: 169315,
    synapseCount: 124200000,
    isRealMicroscopyData: true,
    dataset: 'BANC v888 / FlyWire (Harvard & Janelia ssTEM)'
  });
  const apSystemRef = useRef(null);

  // Apple Silicon M5 Native Scientific Bridge Link (MuJoCo / FlyGym / SNN)
  const [m5Status, setM5Status] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const [m5Telemetry, setM5Telemetry] = useState(null);
  const [showM5Modal, setShowM5Modal] = useState(false);

  // Flight kinematics & aerial status
  const [isFlying, setIsFlying] = useState(false);
  const flyWingsRef = useRef(null);
  const odorPlumeParticlesRef = useRef(null);
  const flightStateRef = useRef({
    targetY: 1.02,
    flyPhaseTimer: 0,
    flightSpeed: 0.038
  });

  // Live Fly Eye Viewport & Real-Time Compound Vision Analysis
  const flyEyeContainerRef = useRef(null);
  const flyEyeRendererRef = useRef(null);
  const flyEyeCameraRef = useRef(null);
  const lastYawRef = useRef(0);
  const lastTelemetryTimeRef = useRef(0);
  const [showEyeProjector, setShowEyeProjector] = useState(false); // Default closed for clean view
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

  // Direct Interactive Bio-Tools: 'inspect' | 'tap' | 'food' | 'repellent' | 'laser' | 'wind'
  const [activeInteractionMode, setActiveInteractionMode] = useState('inspect');

  // Placed Interactive Stimuli (Simultaneous Multi-Source Scents in 3D Space)
  const [placedStimuli, setPlacedStimuli] = useState([
    {
      id: 'food_init_1',
      type: 'food',
      name: 'Néctar de Fruta',
      position: new THREE.Vector3(0.85, 1.02, -0.45),
      valence: 0.95,
      color: 0xf59e0b
    }
  ]);
  const placedStimuliGroupRef = useRef(new THREE.Group());

  // Interactive Laser Pointer Stimulus (Phototaxis)
  const [laserActive, setLaserActive] = useState(false);
  const laserDotMeshRef = useRef(null);
  const laserTargetPosRef = useRef(new THREE.Vector3(0, 1.02, 0));

  // Interactive Surface Tap (Shockwave ripples & Giant Fiber escape reflex)
  const shockwavesGroupRef = useRef(new THREE.Group());
  const lastTapEventRef = useRef(null);
  const [lastInteractionFeedback, setLastInteractionFeedback] = useState(null);

  // Connectome Deep Scientific Inspector & Neuropil Labels
  const [showNeuropilLabels, setShowNeuropilLabels] = useState(true);
  const [selectedConnectomeEntity, setSelectedConnectomeEntity] = useState(null);
  const [membranePotentialVm, setMembranePotentialVm] = useState(-65.0);
  const [injectedCurrentActive, setInjectedCurrentActive] = useState(false);

  // 6-Channel Electrophysiological Spike Raster (Closed by default to keep viewport clear)
  const [showSpikeRasterHUD, setShowSpikeRasterHUD] = useState(false);
  const spikeCanvasRef = useRef(null);
  const spikeRasterEventsRef = useRef({
    ch1_dm1: false,
    ch2_gr5a: false,
    ch3_lptc: false,
    ch4_gf: false,
    ch5_epg: 0,
    ch6_vnc: 4.2
  });

  // ── FASES 1, 2 Y 3: NeuroAI Consciousness, Dialogue & Synaptic Persona ──
  const [showConsciousnessModal, setShowConsciousnessModal] = useState(false);
  const [activePersonaProfile, setActivePersonaProfile] = useState(() => neuroAIConsciousness.activeProfileId);
  const [latestFlyThought, setLatestFlyThought] = useState('Iniciando decodificador de conciencia neural...');
  const [userChatInput, setUserChatInput] = useState('');
  const [isVoiceSynthesisOn, setIsVoiceSynthesisOn] = useState(true); // Voice ON by default
  const [isListeningToMic, setIsListeningToMic] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const [isFlySpeaking, setIsFlySpeaking] = useState(false);
  const speechRecognizerRef = useRef(null);
  const [engramMutationCounter, setEngramMutationCounter] = useState(() => neuroAIConsciousness.engramMutationCount);
  const [consciousnessTab, setConsciousnessTab] = useState('chat'); // 'chat' | 'synaptic_weights' | 'cortical_snn'
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(() => neuroAIConsciousness.geminiApiKey || '');
  const [isGeminiConnected, setIsGeminiConnected] = useState(() => !!neuroAIConsciousness.geminiApiKey);
  const [showGeminiConfig, setShowGeminiConfig] = useState(false);
  const [activeFlySpeech, setActiveFlySpeech] = useState(null); // { text, type, emotion, timestamp, expiresAt }
  const [flyScreenPos, setFlyScreenPos] = useState({ x: 0, y: 0, visible: false });
  const [showFlySpeechBubble, setShowFlySpeechBubble] = useState(true);
  const [quickReplyText, setQuickReplyText] = useState('');
  const flyScreenPosRef = useRef({ x: 0, y: 0, visible: false });
  const lastScreenPosUpdateRef = useRef(0);
  const lastInquiryCheckTimeRef = useRef(0);

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
  const flyPartsRef = useRef(null);
  const targetLightRef = useRef(null);
  const foodBeaconRef = useRef(null);

  const animFrameRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  // ── Naturalistic Locomotion State Machine (Saccade / Lévy Walk / Drive States) ──
  // This replaces constant-lerp steering with biologically realistic saccadic locomotion:
  // Real Drosophila hold a heading for 200–600 ms (fixation), then make near-instantaneous
  // heading corrections (saccades), then fixate again — matching lab ethograms.
  const behaviorStateRef = useRef({
    // --- Saccade Engine ---
    saccadePhase: 'fixating',       // 'fixating' | 'saccading' | 'paused'
    fixationTimer: 0,               // seconds remaining in current fixation
    fixationDuration: 0.35,         // will be randomised each fixation (0.15–0.65s)
    saccadeTargetYaw: 0,            // yaw angle to jump to
    saccadeProgress: 0,             // 0→1 over saccade duration
    saccadeDuration: 0.045,         // near-instantaneous (~45ms, realistic for Drosophila)

    // --- Lévy Walk (free exploration) ---
    levyStepLength: 0,              // remaining distance in current Lévy step
    levyHeading: 0,                 // current Lévy walk heading (rad)
    levySpeed: 0.012,               // walking speed during Lévy step

    // --- Internal Drive States ---
    // Each drive ranges 0.0 (satisfied) → 1.0 (urgent)
    hungerDrive: 0.55,              // rises with time, falls when near food
    explorationDrive: 0.40,         // random exploration urge
    fatigueDrive: 0.0,              // rises during sustained activity, causes rest bouts
    aversiveDrive: 0.0,             // shock / repellent fear memory

    // --- Grooming / Rest Pauses ---
    groomingPause: false,
    groomingTimer: 0,               // seconds remaining in grooming bout
    nextGroomIn: 8 + Math.random() * 12, // seconds until next grooming bout

    // --- Activity accumulator (for fatigue) ---
    activeTime: 0,                  // seconds of continuous movement

    // --- Walking speed noise ---
    speedNoiseSeed: Math.random() * 100,

    // --- Spontaneous Behavior Variety ---
    // Curiosity burst: fly abruptly changes direction and speeds up to investigate
    curiosityBurstTimer: 0,         // >0 while in curiosity burst
    nextCuriosityIn: 15 + Math.random() * 25, // seconds until next spontaneous curiosity burst
    // Wall-following tendency: when near boundary fly may trace the edge for a bit
    wallFollowTimer: 0,
    wallFollowDir: 1,               // +1 or -1 along wall
    // Pause & observe: fly occasionally stops completely and "watches"
    pauseObserveTimer: 0,
    nextPauseObserveIn: 20 + Math.random() * 30,
    // Spontaneous wing buzz (micro-flutter without taking off)
    wingBuzzTimer: 0,
    nextWingBuzzIn: 12 + Math.random() * 20,
  });

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
    const neuropilsGroup = FlyConnectomeEngine.buildNeuropilCompartments(showNeuropilLabels);
    neuropilsGroupRef.current = neuropilsGroup;
    scene.add(neuropilsGroup);

    // Build Massive Morphological Neurons Connectome (Default: Real BANC 169k ssTEM)
    const massiveNetwork = FlyConnectomeEngine.buildMassiveNeuronNetwork(connectomeDensity, connectomeFilter, connectomeColorMode);
    neuronsGroupRef.current = massiveNetwork.networkGroup;
    scene.add(massiveNetwork.networkGroup);
    setConnectomeStats(massiveNetwork.stats);

    // Action Potential Particle Pulses along authentic axonal paths (1,800 active AP waves)
    const apSystem = FlyConnectomeEngine.createActionPotentialSystem(massiveNetwork.axonalPaths);
    apSystemRef.current = apSystem;
    if (apSystem && apSystem.pointsMesh) {
      pulsesRef.current = apSystem.pointsMesh;
      scene.add(apSystem.pointsMesh);
    }

    // Interactive Raycaster for Connectome Inspection (Click to view FlyWire Dossier)
    const connectomeRaycaster = new THREE.Raycaster();
    const connectomeMouse = new THREE.Vector2();

    const handleConnectomeClick = (e) => {
      if (!renderer.domElement || !cameraRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      connectomeMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      connectomeMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      connectomeRaycaster.setFromCamera(connectomeMouse, cameraRef.current);
      const intersects = connectomeRaycaster.intersectObjects(neuropilsGroup.children, true);
      
      const hit = intersects.find(i => i.object.userData?.isNeuropilVolume);
      if (hit) {
        const u = hit.object.userData;
        const nearestNeuron = FlyConnectomeEngine.getNearestFlyWireNeuron(hit.point);
        setSelectedConnectomeEntity({
          type: 'neuropil',
          id: u.neuropilId,
          name: u.name,
          flywireRootId: u.flywireRootId,
          category: u.category,
          neuronsCount: u.neuronsCount,
          synapseCount: u.synapseCount,
          neurotransmitters: u.neurotransmitters,
          description: u.description,
          majorInputs: u.majorInputs,
          majorOutputs: u.majorOutputs,
          colorHex: u.colorHex,
          nearestNeuron
        });
        return;
      }

      // Check nearest neuron from click position
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const pt = new THREE.Vector3();
      connectomeRaycaster.ray.intersectPlane(plane, pt);
      if (pt) {
        const nearest = FlyConnectomeEngine.getNearestFlyWireNeuron(pt);
        if (nearest) {
          setSelectedConnectomeEntity({
            type: 'neuron',
            id: nearest.id,
            name: nearest.type,
            flywireRootId: nearest.id,
            category: nearest.neuropil,
            neurotransmitters: [nearest.neurotransmitter],
            description: nearest.functionDesc,
            neuronData: nearest,
            colorHex: '#38bdf8'
          });
        }
      }
    };

    renderer.domElement.addEventListener('click', handleConnectomeClick);

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
      renderer.domElement.removeEventListener('click', handleConnectomeClick);
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, []);

  // 1.5 Dynamic Connectome Rebuilding on Density / Filter / ColorMode Change
  useEffect(() => {
    if (!sceneRef.current) return;
    if (neuronsGroupRef.current) {
      sceneRef.current.remove(neuronsGroupRef.current);
    }
    if (pulsesRef.current) {
      sceneRef.current.remove(pulsesRef.current);
    }

    const massiveNetwork = FlyConnectomeEngine.buildMassiveNeuronNetwork(connectomeDensity, connectomeFilter, connectomeColorMode);
    neuronsGroupRef.current = massiveNetwork.networkGroup;
    sceneRef.current.add(massiveNetwork.networkGroup);
    setConnectomeStats(massiveNetwork.stats);

    const apSystem = FlyConnectomeEngine.createActionPotentialSystem(massiveNetwork.axonalPaths);
    apSystemRef.current = apSystem;
    if (apSystem && apSystem.pointsMesh) {
      pulsesRef.current = apSystem.pointsMesh;
      sceneRef.current.add(apSystem.pointsMesh);
    }
  }, [connectomeDensity, connectomeFilter, connectomeColorMode]);

  // 1.8 Apple Silicon M5 Native WebSocket Bridge Connection
  useEffect(() => {
    flyM5Bridge.connect();
    const unsubStatus = flyM5Bridge.onStatusChange(status => {
      setM5Status(status);
    });
    const unsubTelem = flyM5Bridge.onTelemetry(telemetry => {
      setM5Telemetry(telemetry);
    });

    return () => {
      unsubStatus();
      unsubTelem();
      flyM5Bridge.disconnect();
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

    // 1. Build 3D Virtual Kitchen Environment (Countertop, Fruit Bowl, Vinegar Bottle, Sink, Trash, Pendant Lamp)
    const kitchenData = KitchenEnvironment.buildKitchen();
    kitchenDataRef.current = kitchenData;
    scene.add(kitchenData.kitchenRoot);

    // 2. Build Laboratory Arena Environment
    const arenaFloorGeo = new THREE.CylinderGeometry(5.0, 5.0, 0.1, 48);
    const arenaFloorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.1
    });
    const arenaFloor = new THREE.Mesh(arenaFloorGeo, arenaFloorMat);
    arenaFloor.position.y = -0.05;
    arenaFloor.receiveShadow = true;

    const arenaGrid = new THREE.GridHelper(10, 20, 0x06b6d4, 0x1e293b);
    arenaGrid.position.y = 0.005;

    const ringGeo = new THREE.TorusGeometry(5.0, 0.06, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;

    // Arena Glass Cylinder Chamber (Paredes de cristal circular para confinamiento biolab)
    const glassChamberGeo = new THREE.CylinderGeometry(4.4, 4.4, 2.6, 48, 1, true);
    const glassChamberMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.92,
      opacity: 0.18,
      transparent: true,
      roughness: 0.05,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const glassChamber = new THREE.Mesh(glassChamberGeo, glassChamberMat);
    glassChamber.position.y = 1.25;

    // Glowing top chrome ring
    const topRingGeo = new THREE.TorusGeometry(4.4, 0.04, 16, 64);
    const topRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6
    });
    const topRing = new THREE.Mesh(topRingGeo, topRingMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 2.55;

    const arenaGroup = new THREE.Group();
    arenaGroup.add(targetLight);
    arenaGroup.add(foodGroup);
    arenaGroup.add(plumeParticles);
    arenaGroup.add(arenaFloor);
    arenaGroup.add(arenaGrid);
    arenaGroup.add(ringMesh);
    arenaGroup.add(glassChamber);
    arenaGroup.add(topRing);
    arenaGroupRef.current = arenaGroup;
    scene.add(arenaGroup);

    // 3. Build Scanned Room Environment (From user scan or high-detail room preset)
    const scannedRoomGroup = new THREE.Group();
    scannedRoomGroup.name = 'ScannedRoomEnvironment';
    const roomToUse = currentRoomScan || RoomReconstruction.getPresetRooms()[0];
    if (roomToUse && roomToUse.bounds) {
      try {
        const roomMesh = RoomReconstruction.buildRoomMesh(roomToUse.bounds, roomToUse.keyframes || [], false);
        scannedRoomGroup.add(roomMesh);
        if (roomToUse.points && roomToUse.points.length > 0) {
          const pointCloud = RoomReconstruction.createPointCloud(roomToUse.points, 'rgb');
          scannedRoomGroup.add(pointCloud);
        }
        if (roomToUse.aiDetectedObjects && roomToUse.aiDetectedObjects.length > 0) {
          roomToUse.aiDetectedObjects.forEach(obj => {
            const m = RoomReconstruction.createAIObjectMesh(obj);
            if (m) scannedRoomGroup.add(m);
          });
        }
        const roomLight = new THREE.PointLight(0xfff7ed, 2.5, 14);
        roomLight.position.set(roomToUse.bounds.center.x, roomToUse.bounds.max.y - 0.35, roomToUse.bounds.center.z);
        scannedRoomGroup.add(roomLight);
      } catch (err) {
        console.warn('Error building scanned room in fly scene:', err);
      }
    }
    scannedRoomGroupRef.current = scannedRoomGroup;
    scene.add(scannedRoomGroup);

    // Initial Environment visibility
    kitchenData.kitchenRoot.visible = activeEnvironment === 'kitchen';
    arenaGroup.visible = activeEnvironment === 'arena';
    scannedRoomGroup.visible = activeEnvironment === 'scanned_room';

    // Build Biomechanical Fly Model (FlyGym with Sensory Antennae & Proboscis)
    const { flyRoot, leftWing, rightWing, legNodes, antennae, proboscis, abdomen, headGroup } = FlyConnectomeEngine.buildFlyGymModel();
    flyModelRef.current = flyRoot;
    flyLegsRef.current = legNodes;
    flyWingsRef.current = { leftWing, rightWing };
    flyPartsRef.current = { antennae, proboscis, abdomen, headGroup, legNodes };
    
    // Apply initial realistic insect scale (default: proportional 0.045, ~14 cm)
    const initialScale = FLY_SCALE_VALUES[flyScaleMode] || 0.045;
    flyRoot.scale.setScalar(initialScale);

    if (activeEnvironment === 'kitchen') {
      flyRoot.position.set(0, 1.02, 0); // On quartz countertop
      camera.position.set(0, 1.6, 1.8);
      controls.target.set(0, 1.05, 0);
    } else if (activeEnvironment === 'scanned_room' && roomToUse?.bounds) {
      const firstObj = roomToUse.aiDetectedObjects?.[0];
      const objPos = get3DPos(firstObj, { x: roomToUse.bounds.center.x, y: roomToUse.bounds.min.y, z: roomToUse.bounds.center.z });
      const sX = objPos.x;
      const sZ = objPos.z;
      const sY = firstObj ? (objPos.y + 0.35) : (roomToUse.bounds.min.y + 0.05);
      flyRoot.position.set(sX, sY, sZ);
      camera.position.set(sX, sY + 0.8, sZ + 1.2);
      controls.target.set(sX, sY + 0.05, sZ);
    } else {
      flyRoot.position.set(0, 0, 0); // Arena floor
      camera.position.set(0, 1.2, 1.8);
      controls.target.set(0, 0.1, 0);
    }
    scene.add(flyRoot);

    // 3. Add Placed Stimuli Beacons Group and Shockwaves Group
    scene.add(placedStimuliGroupRef.current);
    scene.add(shockwavesGroupRef.current);

    // 4. Interactive Laser Pointer Dot
    const laserGeo = new THREE.RingGeometry(0.04, 0.09, 24);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    const laserDot = new THREE.Mesh(laserGeo, laserMat);
    laserDot.rotation.x = Math.PI / 2;
    laserDot.position.set(0, 1.03, 0);
    laserDot.visible = false;
    scene.add(laserDot);
    laserDotMeshRef.current = laserDot;

    // 5. Interactive Raycaster for Direct Bio-Tools (Tap, Food, Repellent, Laser)
    const flyRaycaster = new THREE.Raycaster();
    const flyMouse = new THREE.Vector2();

    const handleFlyPointerDown = (e) => {
      if (!flyRendererRef.current || !flyCameraRef.current) return;
      const rect = flyRendererRef.current.domElement.getBoundingClientRect();
      flyMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      flyMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      flyRaycaster.setFromCamera(flyMouse, flyCameraRef.current);

      const targets = [];
      if (kitchenDataRef.current?.countertop) targets.push(kitchenDataRef.current.countertop);
      if (kitchenDataRef.current?.island) targets.push(kitchenDataRef.current.island);
      if (kitchenDataRef.current?.kitchenRoot) targets.push(kitchenDataRef.current.kitchenRoot);
      if (arenaGroupRef.current) targets.push(arenaGroupRef.current);
      if (scannedRoomGroupRef.current) targets.push(scannedRoomGroupRef.current);

      const intersects = flyRaycaster.intersectObjects(targets, true);
      let hitPoint = null;
      if (intersects.length > 0) {
        hitPoint = intersects[0].point;
      } else {
        const planeY = activeEnvironment === 'kitchen' ? 1.02 : 0;
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
        const pt = new THREE.Vector3();
        if (flyRaycaster.ray.intersectPlane(groundPlane, pt)) {
          hitPoint = pt;
        }
      }

      if (!hitPoint) return;

      const tool = activeInteractionModeRef.current;
      if (tool === 'tap') {
        const ripple = FlyConnectomeEngine.createShockwaveRippleMesh(hitPoint);
        shockwavesGroupRef.current.add(ripple);
        lastTapEventRef.current = { position: hitPoint.clone(), time: Date.now() };
        setLastInteractionFeedback("💥 Golpe en superficie: Reflejo Giant Fiber de escape activado");
        spikeRasterEventsRef.current.ch4_gf = true;
        neuroAIConsciousness.recordEpisodicEvent('tap', 'Diste un golpe brusco cerca en la superficie');
        const startledMsg = neuroAIConsciousness.pickUnique([
          "¡Ayyy! ¡Qué susto! Esa vibración casi me despolariza todos los axones.",
          "¡Oye, con cuidado! Mis mecanorreceptores tarsales sintieron un golpe tremendo.",
          "¡Peligro! Mis fibras gigantes se dispararon solas por el impacto.",
          "¡Por favor más suave! Una onda sísmica así me desorienta por completo.",
        ]);
        setActiveFlySpeech({
          text: startledMsg,
          type: 'pain',
          emotion: 'scared',
          timestamp: Date.now(),
          expiresAt: Date.now() + 10000
        });
        if (neuroAIConsciousness.isVoiceSynthesisEnabled) {
          neuroAIConsciousness.speakText(startledMsg);
        }
      } else if (tool === 'food') {
        const newItem = {
          id: `food_${Date.now()}`,
          type: 'food',
          name: 'Néctar de Fruta',
          position: hitPoint.clone(),
          valence: 0.95,
          color: 0xf59e0b
        };
        setPlacedStimuli(prev => [...prev, newItem]);
        setLastInteractionFeedback("🍯 Cebo dulce colocado (+ Valencia)");
        neuroAIConsciousness.recordEpisodicEvent('food', 'Colocaste una gota de néctar dulce');
        const foodMsg = neuroAIConsciousness.pickUnique([
          "¡Huele a dulce! Mis antenas ya están captando las moléculas de glucosa.",
          "¡Néctar! Justo lo que necesitaba para recargar calorías en mis músculos alares.",
          "¡Gracias por la comida! Voy a orientarme hacia esa gota deliciosa.",
          "¡Qué bien huele eso! Mis receptores gustativos ya están listos.",
        ]);
        setActiveFlySpeech({
          text: foodMsg,
          type: 'food',
          emotion: 'happy',
          timestamp: Date.now(),
          expiresAt: Date.now() + 10000
        });
        if (neuroAIConsciousness.isVoiceSynthesisEnabled) {
          neuroAIConsciousness.speakText(foodMsg);
        }
      } else if (tool === 'repellent') {
        const newItem = {
          id: `rep_${Date.now()}`,
          type: 'repellent',
          name: 'Ajo Nociceptivo',
          position: hitPoint.clone(),
          valence: -0.88,
          color: 0xf43f5e
        };
        setPlacedStimuli(prev => [...prev, newItem]);
        setLastInteractionFeedback("🧄 Repelente colocado (- Valencia)");
        neuroAIConsciousness.recordEpisodicEvent('repellent', 'Colocaste repelente nociceptivo');
        const repMsg = neuroAIConsciousness.pickUnique([
          "¡Ufff, qué olor tan fuerte! Mis glomérulos aversivos me dicen que me aleje ya.",
          "¡Eso me irrita las quetas! Necesito limpiar mis antenas y alejarme de ahí.",
          "¡Qué repelente tan molesto! Mis circuitos de evitación están al máximo.",
        ]);
        setActiveFlySpeech({
          text: repMsg,
          type: 'repellent',
          emotion: 'scared',
          timestamp: Date.now(),
          expiresAt: Date.now() + 10000
        });
        if (neuroAIConsciousness.isVoiceSynthesisEnabled) {
          neuroAIConsciousness.speakText(repMsg);
        }
      } else if (tool === 'laser') {
        setLaserActive(true);
        if (laserDotMeshRef.current) {
          laserDotMeshRef.current.visible = true;
          laserDotMeshRef.current.position.copy(hitPoint);
          laserDotMeshRef.current.position.y += 0.01;
        }
        laserTargetPosRef.current.copy(hitPoint);
        neuroAIConsciousness.recordEpisodicEvent('laser', 'Apuntaste un puntero láser brillante');
      }
    };

    const handleFlyPointerMove = (e) => {
      if (!flyRendererRef.current || !flyCameraRef.current) return;
      const rect = flyRendererRef.current.domElement.getBoundingClientRect();
      flyMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      flyMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      flyRaycaster.setFromCamera(flyMouse, flyCameraRef.current);

      if (activeInteractionModeRef.current === 'laser') {
        const planeY = activeEnvironment === 'kitchen' ? 1.02 : 0;
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
        const pt = new THREE.Vector3();
        if (flyRaycaster.ray.intersectPlane(groundPlane, pt)) {
          laserTargetPosRef.current.copy(pt);
          if (laserDotMeshRef.current) {
            laserDotMeshRef.current.position.copy(pt);
            laserDotMeshRef.current.position.y += 0.01;
            laserDotMeshRef.current.visible = true;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handleFlyPointerDown);
    renderer.domElement.addEventListener('pointermove', handleFlyPointerMove);

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
      renderer.domElement.removeEventListener('pointerdown', handleFlyPointerDown);
      renderer.domElement.removeEventListener('pointermove', handleFlyPointerMove);
      if (flyControlsRef.current) flyControlsRef.current.dispose();
      if (flyRendererRef.current && flyRendererRef.current.domElement) {
        flyRendererRef.current.domElement.remove();
      }
    };
  }, []);

  // 2.1 Dynamic Fly Scale Updates
  useEffect(() => {
    if (flyModelRef.current) {
      const scale = FLY_SCALE_VALUES[flyScaleMode] || 0.045;
      flyModelRef.current.scale.setScalar(scale);
    }
  }, [flyScaleMode]);

  // 2.11 Interaction Mode Sync & Placed Stimuli 3D Beacons Sync
  const activeInteractionModeRef = useRef(activeInteractionMode);
  useEffect(() => {
    activeInteractionModeRef.current = activeInteractionMode;
    if (activeInteractionMode !== 'laser' && laserDotMeshRef.current) {
      laserDotMeshRef.current.visible = false;
      setLaserActive(false);
    }
  }, [activeInteractionMode]);

  const placedStimuliRef = useRef(placedStimuli);
  useEffect(() => {
    placedStimuliRef.current = placedStimuli;
    if (placedStimuliGroupRef.current) {
      while (placedStimuliGroupRef.current.children.length > 0) {
        placedStimuliGroupRef.current.remove(placedStimuliGroupRef.current.children[0]);
      }
      placedStimuli.forEach(item => {
        const beaconMesh = FlyConnectomeEngine.createStimulusBeaconMesh(item);
        placedStimuliGroupRef.current.add(beaconMesh);
      });
    }
  }, [placedStimuli]);

  const handleClearStimuli = () => {
    setPlacedStimuli([]);
    if (placedStimuliGroupRef.current) {
      while (placedStimuliGroupRef.current.children.length > 0) {
        placedStimuliGroupRef.current.remove(placedStimuliGroupRef.current.children[0]);
      }
    }
    setLastInteractionFeedback("🧹 Estímulos colocados limpiados de la escena");
  };

  // 2.12 Live Electrophysiological Spike Raster Canvas Renderer (MEA 6-CH)
  useEffect(() => {
    if (!showSpikeRasterHUD && activeFlyDockTab !== 'mea') return;
    const canvas = spikeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rasterId;

    const channelLabels = [
      { name: 'CH1: DM1 (Olfacción Comida)', color: '#fbbf24' },
      { name: 'CH2: Gr5a (Gusto Probóscide)', color: '#34d399' },
      { name: 'CH3: LPTC (Visión/Flujo)', color: '#38bdf8' },
      { name: 'CH4: Giant Fiber (Fuga/Tap)', color: '#f43f5e' },
      { name: 'CH5: E-PG (Brújula Heading)', color: '#a855f7' },
      { name: 'CH6: CPG (Motor Patas)', color: '#6366f1' }
    ];

    const traces = Array.from({ length: 6 }, () => Array(60).fill(0));
    let t = 0;

    const renderRaster = () => {
      rasterId = requestAnimationFrame(renderRaster);
      t += 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, w, h);

      const rowH = h / 6;
      const ev = spikeRasterEventsRef.current;

      for (let ch = 0; ch < 6; ch++) {
        let isSpiking = false;
        if (ch === 0) isSpiking = ev.ch1_dm1 && (Math.random() < 0.65);
        else if (ch === 1) isSpiking = ev.ch2_gr5a && (Math.random() < 0.85);
        else if (ch === 2) isSpiking = ev.ch3_lptc && (Math.random() < 0.45);
        else if (ch === 3) isSpiking = ev.ch4_gf;
        else if (ch === 4) isSpiking = Math.sin((ev.ch5_epg * Math.PI) / 180 + t * 0.1) > 0.75;
        else if (ch === 5) isSpiking = Math.sin(t * (ev.ch6_vnc * 0.18)) > 0.7;

        traces[ch].shift();
        traces[ch].push(isSpiking ? 1 : 0);

        // Track separator
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, ch * rowH);
        ctx.lineTo(w, ch * rowH);
        ctx.stroke();

        // Channel label
        ctx.fillStyle = channelLabels[ch].color;
        ctx.font = '8px monospace';
        ctx.fillText(channelLabels[ch].name, 4, ch * rowH + 11);

        // Draw spikes
        ctx.strokeStyle = channelLabels[ch].color;
        ctx.lineWidth = 1.8;
        for (let i = 0; i < traces[ch].length; i++) {
          if (traces[ch][i] === 1) {
            const x = (i / traces[ch].length) * (w - 110) + 110;
            const yTop = ch * rowH + 2;
            const yBot = (ch + 1) * rowH - 2;
            ctx.beginPath();
            ctx.moveTo(x, yBot);
            ctx.lineTo(x, yTop);
            ctx.stroke();
          }
        }
      }
    };

    renderRaster();

    return () => {
      cancelAnimationFrame(rasterId);
    };
  }, [showSpikeRasterHUD, activeFlyDockTab]);

  // 2.15 Dynamic Kitchen Boundary Mode (Terrarium vs Open Kitchen Room)
  useEffect(() => {
    if (kitchenDataRef.current && kitchenDataRef.current.glassTerrariumGroup) {
      kitchenDataRef.current.glassTerrariumGroup.visible = (activeEnvironment === 'kitchen' && kitchenBoundaryMode === 'terrarium');
    }
  }, [activeEnvironment, kitchenBoundaryMode]);

  // 2.2 Dynamic Environment Switching (Kitchen vs Scanned Room vs Arena)
  useEffect(() => {
    if (kitchenDataRef.current && arenaGroupRef.current && scannedRoomGroupRef.current) {
      kitchenDataRef.current.kitchenRoot.visible = activeEnvironment === 'kitchen';
      if (kitchenDataRef.current.glassTerrariumGroup) {
        kitchenDataRef.current.glassTerrariumGroup.visible = (activeEnvironment === 'kitchen' && kitchenBoundaryMode === 'terrarium');
      }
      arenaGroupRef.current.visible = activeEnvironment === 'arena';
      scannedRoomGroupRef.current.visible = activeEnvironment === 'scanned_room';
    }
    if (flyModelRef.current) {
      if (activeEnvironment === 'kitchen') {
        flyModelRef.current.position.set(0, 1.02, 0);
        flightStateRef.current.targetY = 1.02;
        if (flyCameraRef.current && flyControlsRef.current) {
          flyCameraRef.current.position.set(0, 1.6, 1.8);
          flyControlsRef.current.target.set(0, 1.05, 0);
        }
      } else if (activeEnvironment === 'scanned_room') {
        const room = currentRoomScan || RoomReconstruction.getPresetRooms()[0];
        const firstObj = room?.aiDetectedObjects?.[0];
        const objPos = get3DPos(firstObj, { x: (room?.bounds?.center?.x || 0), y: (room?.bounds?.min?.y || 0), z: (room?.bounds?.center?.z || 0) });
        const sX = objPos.x;
        const sZ = objPos.z;
        const sY = firstObj ? (objPos.y + 0.35) : ((room?.bounds?.min?.y || 0) + 0.05);
        flyModelRef.current.position.set(sX, sY, sZ);
        flightStateRef.current.targetY = sY;
        if (flyCameraRef.current && flyControlsRef.current) {
          flyCameraRef.current.position.set(sX, sY + 0.8, sZ + 1.2);
          flyControlsRef.current.target.set(sX, sY + 0.05, sZ);
        }
      } else {
        flyModelRef.current.position.set(0, 0, 0);
        flightStateRef.current.targetY = 0;
        if (flyCameraRef.current && flyControlsRef.current) {
          flyCameraRef.current.position.set(0, 1.2, 1.8);
          flyControlsRef.current.target.set(0, 0.1, 0);
        }
      }
    }
  }, [activeEnvironment, currentRoomScan, kitchenBoundaryMode]);

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

        // Animate massive action potential particle cascades along biological axon tracts (1,800 active AP waves)
        if (apSystemRef.current && isRunning) {
          FlyConnectomeEngine.updateMassiveActionPotentials(
            apSystemRef.current,
            delta,
            firingRateHz,
            dopamineBoostActive,
            flyHeadingAngle,
            isFlying
          );
          if (pulsesRef.current) {
            pulsesRef.current.rotation.y = time * 0.12;
          }
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // Animate Scent Vapor Plume Particles (Kitchen Habitat or Laboratory Arena)
      if (activeEnvironment === 'kitchen' && kitchenDataRef.current) {
        const fruitPos = kitchenDataRef.current.fruitBowlGroup.position;
        const vinegarPos = kitchenDataRef.current.vinegarGroup.position;
        const trashPos = kitchenDataRef.current.trashGroup.position;
        KitchenEnvironment.updatePlumes(
          kitchenDataRef.current.kitchenPlumes,
          fruitPos,
          vinegarPos,
          trashPos,
          delta,
          time
        );
      } else if (odorPlumeParticlesRef.current) {
        const pArr = odorPlumeParticlesRef.current.geometry.attributes.position.array;
        for (let p = 0; p < pArr.length / 3; p++) {
          pArr[p * 3 + 1] += delta * 0.45;
          pArr[p * 3] += Math.sin(time * 2.5 + p) * 0.003;
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
          // If M5 Bridge is connected with live MuJoCo physics, apply real joint angles!
          if (flyM5Bridge.isConnected && flyM5Bridge.latestTelemetry?.joint_angles) {
            FlyConnectomeEngine.applyM5JointAngles(
              flyLegsRef.current,
              flyWingsRef.current,
              flyM5Bridge.latestTelemetry
            );
          } else {
            // Flight kinematics vs Walking kinematics (Procedural client-side fallback)
            if (isFlying) {
              FlyConnectomeEngine.updateFlightKinematics(flyWingsRef.current, flyLegsRef.current, time, true);
            } else {
              FlyConnectomeEngine.updateFlightKinematics(flyWingsRef.current, flyLegsRef.current, time, false);
              FlyConnectomeEngine.updateTripodGait(flyLegsRef.current, time, firingRateHz / 4.2);
            }
          }

          // Memory decay over time
          memoryEngineRef.current.decayMemory(delta);

          const roomBounds = (activeEnvironment === 'scanned_room' && currentRoomScan?.bounds) ? currentRoomScan.bounds : null;
          const roomFirstObj = (activeEnvironment === 'scanned_room' && currentRoomScan?.aiDetectedObjects?.[0]) ? currentRoomScan.aiDetectedObjects[0] : null;
          const roomFirstObjPos = get3DPos(roomFirstObj, { x: 0, y: (roomBounds?.min?.y || 0), z: 0 });
          const groundLevelY = activeEnvironment === 'kitchen' 
            ? 1.02 
            : activeEnvironment === 'scanned_room' 
            ? (roomFirstObj ? roomFirstObjPos.y + 0.35 : (roomBounds ? roomBounds.min.y + 0.05 : 0.0))
            : 0.0;

          // Autonomous Free Flight Cycles in "Libre" Status
          if (activeStimulus === 'none') {
            flightStateRef.current.flyPhaseTimer += delta;
            if (!isFlying && flightStateRef.current.flyPhaseTimer > 9.0) {
              setIsFlying(true);
              flightStateRef.current.flyPhaseTimer = 0;
              flightStateRef.current.targetY = activeEnvironment === 'kitchen' 
                ? 1.7 + Math.random() * 0.5 
                : activeEnvironment === 'scanned_room'
                ? ((roomBounds?.min?.y || 0) + (roomBounds?.max?.y || 2.4)) * 0.6
                : 1.3 + Math.random() * 0.9;
            } else if (isFlying && flightStateRef.current.flyPhaseTimer > 12.0) {
              flightStateRef.current.targetY = groundLevelY;
              if (Math.abs(flyModelRef.current.position.y - groundLevelY) <= 0.08) {
                setIsFlying(false);
                flyModelRef.current.position.y = groundLevelY;
                flightStateRef.current.flyPhaseTimer = 0;
              }
            }
          }

          // 3D Flight Altitude & Aerodynamics Attitude
          if (isFlying) {
            flyModelRef.current.position.y = THREE.MathUtils.lerp(
              flyModelRef.current.position.y,
              flightStateRef.current.targetY || (activeEnvironment === 'kitchen' ? 1.8 : 1.5),
              0.045
            );
            flyModelRef.current.rotation.x = THREE.MathUtils.lerp(flyModelRef.current.rotation.x, -0.2, 0.06);
            const flightSpeed = 0.038 * (firingRateHz / 4.2);
            flyModelRef.current.translateZ(flightSpeed);

            // Perimeter boundary guidance (Pre-turn vector)
            if (activeEnvironment === 'kitchen') {
              const pX = flyModelRef.current.position.x;
              const pZ = flyModelRef.current.position.z;
              const pY = flyModelRef.current.position.y;
              if (kitchenBoundaryMode === 'terrarium') {
                if (Math.abs(pX) > 1.65 || Math.abs(pZ) > 0.82) {
                  const inwardAngle = Math.atan2(-pX, -pZ);
                  flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, inwardAngle, 0.12);
                  flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0.35, 0.08);
                } else {
                  flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0, 0.05);
                }
                if (pY > 2.30) {
                  flightStateRef.current.targetY = 1.95;
                }
              } else {
                if (Math.abs(pX) > 4.2 || Math.abs(pZ) > 3.0) {
                  const inwardAngle = Math.atan2(-pX, -pZ);
                  flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, inwardAngle, 0.12);
                }
              }
            } else if (activeEnvironment === 'scanned_room' && roomBounds) {
              const pX = flyModelRef.current.position.x;
              const pZ = flyModelRef.current.position.z;
              const pY = flyModelRef.current.position.y;
              if (pX < roomBounds.min.x + 0.3 || pX > roomBounds.max.x - 0.3 || pZ < roomBounds.min.z + 0.3 || pZ > roomBounds.max.z - 0.3) {
                const inwardAngle = Math.atan2(roomBounds.center.x - pX, roomBounds.center.z - pZ);
                flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, inwardAngle, 0.12);
                flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0.35, 0.08);
              } else {
                flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0, 0.05);
              }
              if (pY > roomBounds.max.y - 0.25) {
                flightStateRef.current.targetY = (roomBounds.min.y + roomBounds.max.y) * 0.55;
              }
            } else {
              // Contained inside Arena Glass Cylinder Chamber
              const distCenter = Math.hypot(flyModelRef.current.position.x, flyModelRef.current.position.z);
              if (distCenter > 3.9) {
                const inwardAngle = Math.atan2(-flyModelRef.current.position.x, -flyModelRef.current.position.z);
                flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, inwardAngle, 0.12);
                flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0.35, 0.08);
              } else {
                flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0, 0.05);
              }
              if (flyModelRef.current.position.y > 2.35) {
                flightStateRef.current.targetY = 1.6;
              }
            }
          } else {
            // Ground level recovery (quartz counter at 1.02m or arena floor at 0.0m)
            flyModelRef.current.position.y = THREE.MathUtils.lerp(flyModelRef.current.position.y, groundLevelY, 0.12);
            flyModelRef.current.rotation.x = THREE.MathUtils.lerp(flyModelRef.current.rotation.x, 0, 0.1);
            flyModelRef.current.rotation.z = THREE.MathUtils.lerp(flyModelRef.current.rotation.z, 0, 0.1);

            // Countertop edge safety when walking on island in kitchen mode
            if (activeEnvironment === 'kitchen' && kitchenBoundaryMode === 'terrarium') {
              const pX = flyModelRef.current.position.x;
              const pZ = flyModelRef.current.position.z;
              if (Math.abs(pX) > 1.65 || Math.abs(pZ) > 0.85) {
                const centerAngle = Math.atan2(-pX, -pZ);
                flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, centerAngle, 0.12);
              }
            }
          }

          // Target Mapping (Kitchen real 3D items vs Scanned Room detected furniture vs Arena beacon)
          let targetPos = foodBeaconRef.current ? foodBeaconRef.current.position : new THREE.Vector3(2.4, 0.35, -2.0);
          if (activeEnvironment === 'kitchen' && kitchenDataRef.current) {
            if (selectedStimulusIdx === 0 || selectedStimulusIdx === 2) {
              targetPos = kitchenDataRef.current.fruitBowlGroup.position;
            } else if (selectedStimulusIdx === 1) {
              targetPos = kitchenDataRef.current.vinegarGroup.position;
            } else if (selectedStimulusIdx === 3 || selectedStimulusIdx === 4) {
              targetPos = kitchenDataRef.current.boardGroup.position;
            } else {
              // Trash can odor
              if (kitchenBoundaryMode === 'terrarium') {
                targetPos = new THREE.Vector3(1.65, 1.05, -0.75); // Island corner closest to trash
              } else {
                targetPos = kitchenDataRef.current.trashGroup.position;
              }
            }
          } else if (activeEnvironment === 'scanned_room' && currentRoomScan?.aiDetectedObjects?.length > 0) {
            const objs = currentRoomScan.aiDetectedObjects;
            const objIdx = selectedStimulusIdx % objs.length;
            const obj = objs[objIdx];
            const p = get3DPos(obj, { x: 0, y: 0.4, z: 0 });
            targetPos = new THREE.Vector3(p.x, p.y, p.z);
          }
          if (!targetPos) {
            targetPos = new THREE.Vector3(0, 0.5, 0);
          }

          // ----------------------------------------------------
          // MULTISENSORY VECTOR INTEGRATION (Simultaneous Stimuli)
          // ----------------------------------------------------
          const flyPos = flyModelRef.current.position;
          const steerDir = new THREE.Vector3(0, 0, 0);
          let netOlfactoryDrive = 0;
          let closestFoodDist = Infinity;
          let closestRepellentDist = Infinity;
          let sensingFood = false;
          let sensingRepellent = false;

          // ─────────────────────────────────────────────────────────────────────
          // MULTI-CHANNEL PARALLEL SENSORY INTEGRATION
          // All active modalities contribute simultaneously as weighted vectors.
          // This mirrors the actual Drosophila brain: the Antennal Lobe (olfaction),
          // Medulla/Lobula (vision), Johnston's Organ (mechanosensory) and the Central
          // Complex (navigation) ALL contribute to the descending motor commands (DN)
          // at the same time — there is no "switch" in a real brain.
          // ─────────────────────────────────────────────────────────────────────

          // ── Channel 1: Olfactory Memory (Mushroom Body → MBON → DAL) ─────────
          // Always gathers placed stimuli regardless of toggle; the preset household
          // odor product is gated by the 'memory' toggle.
          const allChemicalSources = [];
          if (activeStimulusSet.has('memory')) {
            // Primary preset odor source (product selected by user)
            const mbValence = memoryEngineRef.current.getNetValence(selectedStimulusIdx);
            allChemicalSources.push({
              position: targetPos,
              valence: mbValence,
              name: currentProduct.name,
              isPreset: true,
              channel: 'olfactory_mb'
            });
          }
          // User-placed beacons are ALWAYS active (they were intentionally placed)
          if (placedStimuliRef.current) {
            placedStimuliRef.current.forEach(st => {
              allChemicalSources.push({
                position: st.position,
                valence: st.valence,
                name: st.name,
                isPreset: false,
                channel: 'olfactory_placed'
              });
            });
          }

          // Olfactory gradient plume vector field (1/r² concentration falloff)
          allChemicalSources.forEach(src => {
            const d = flyPos.distanceTo(src.position);
            if (src.valence > 0) {
              closestFoodDist = Math.min(closestFoodDist, d);
              if (d < 3.2) sensingFood = true;
            } else {
              closestRepellentDist = Math.min(closestRepellentDist, d);
              if (d < 3.0) sensingRepellent = true;
            }
            if (d < 6.5) {
              const concentration = Math.min(4.0, 1.2 / Math.max(0.12, d * d));
              const dirToSrc = new THREE.Vector3().subVectors(src.position, flyPos).normalize();
              dirToSrc.y = 0;
              const olfWeight = src.valence > 0 ? 1.2 : 2.2; // repellent weighs more
              steerDir.addScaledVector(dirToSrc, src.valence * concentration * olfWeight);
              netOlfactoryDrive += src.valence * concentration;
            }
          });

          // ── Channel 2: Phototaxis (Medulla LPLC2 → LC4 → DNp09) ─────────────
          // Light draws the fly toward the brightest source in the scene.
          // Weight scales with inverse-square distance like real photon density.
          if (activeStimulusSet.has('light')) {
            let lampTarget = targetLightRef.current?.position || new THREE.Vector3(0, 2.5, 0);
            if (activeEnvironment === 'kitchen' && kitchenDataRef.current?.lampGroup) {
              lampTarget = kitchenDataRef.current.lampGroup.position;
            }
            const dLamp = flyPos.distanceTo(lampTarget);
            if (dLamp > 0.3) {
              // Phototaxis strength attenuates with distance (inverse square)
              const lightConc = Math.min(1.8, 0.9 / Math.max(0.5, dLamp));
              const lightDir = new THREE.Vector3().subVectors(lampTarget, flyPos).normalize();
              lightDir.y = 0;
              // Modulated by hunger: hungry fly prioritises food smell over light
              const phototaxisWeight = lightConc * (1.0 - (behaviorStateRef.current?.hungerDrive || 0) * 0.5);
              steerDir.addScaledVector(lightDir, phototaxisWeight);
            }
          }

          // ── Channel 3: Mechanosensory / Johnston's Organ (Wind Direction) ─────
          // Simulates an airflow plume from a random but slowly-drifting wind direction.
          // Johnston's Organ on the antennae detects this and biases the heading.
          if (activeStimulusSet.has('mechanosensory')) {
            // Wind direction drifts slowly over time (simulates ambient air currents)
            const windAngle = time * 0.08 + (behaviorStateRef.current?.speedNoiseSeed || 0);
            const windDirX = Math.sin(windAngle);
            const windDirZ = Math.cos(windAngle);
            // The fly is attracted to upwind direction when hungry (chemotaxis upwind)
            // and repelled (moves downwind) when satiated or fearful
            const windBias = activeStimulusSet.has('memory')
              ? (behaviorStateRef.current?.hungerDrive || 0.5) * 0.5   // upwind when hungry
              : 0.25;
            steerDir.x += windDirX * windBias;
            steerDir.z += windDirZ * windBias;
          }

          // ── Channel 4: Interactive Laser Pointer (Phototaxis override) ────────
          if (laserActive && laserTargetPosRef.current) {
            const dLaser = flyPos.distanceTo(laserTargetPosRef.current);
            if (dLaser > 0.12 && dLaser < 6.5) {
              const laserDir = new THREE.Vector3().subVectors(laserTargetPosRef.current, flyPos).normalize();
              laserDir.y = 0;
              steerDir.addScaledVector(laserDir, 2.2); // laser is strongest phototaxis stimulus
            }
          }

          // ── Channel 5: Startle / Giant Fiber Circuit (Tactile Escape) ────────
          const nowMs = Date.now();
          let giantFiberFired = false;
          if (lastTapEventRef.current && (nowMs - lastTapEventRef.current.time < 1200)) {
            const dTap = flyPos.distanceTo(lastTapEventRef.current.position);
            if (dTap < 2.5) {
              giantFiberFired = true;
              const escapeDir = new THREE.Vector3().subVectors(flyPos, lastTapEventRef.current.position).normalize();
              escapeDir.y = 0.6;
              steerDir.addScaledVector(escapeDir, 4.5); // highest priority — escape trumps all
              if (!isFlying) {
                setIsFlying(true);
                flightStateRef.current.targetY = 2.05 + Math.random() * 0.3;
              }
            }
          }

          // ── Channel 6: Autonomous Background Sensory Noise ────────────────────
          // Real flies always experience faint, noisy sensory input from ambient
          // CO2, humidity gradients, thermal gradients, and visual flicker.
          // This prevents completely blank steerDir even in "Libre" mode,
          // ensuring the Lévy Walk is perturbed by faint biological signals.
          {
            const bsRef = behaviorStateRef.current;
            const ambientNoise = 0.06;
            // Slow-varying ambient olfactory gradient (represents CO2/humidity)
            const ambX = Math.sin(time * 0.15 + (bsRef?.speedNoiseSeed || 0) * 1.3) * ambientNoise;
            const ambZ = Math.cos(time * 0.11 + (bsRef?.speedNoiseSeed || 0) * 0.7) * ambientNoise;
            steerDir.x += ambX;
            steerDir.z += ambZ;
          }

          // 5. Update shockwaves animation (expanding & fading rings)
          if (shockwavesGroupRef.current) {
            for (let i = shockwavesGroupRef.current.children.length - 1; i >= 0; i--) {
              const ring = shockwavesGroupRef.current.children[i];
              const age = nowMs - ring.userData.created;
              if (age > ring.userData.maxDuration) {
                shockwavesGroupRef.current.remove(ring);
              } else {
                const progress = age / ring.userData.maxDuration;
                const scale = 1.0 + progress * 8.0;
                ring.scale.set(scale, scale, 1);
                ring.material.opacity = (1.0 - progress) * 0.9;
              }
            }
          }

          // 6. Update placed stimuli pulsing rings in 3D
          if (placedStimuliGroupRef.current) {
            placedStimuliGroupRef.current.children.forEach((beacon, idx) => {
              if (beacon.userData?.ringMesh) {
                const s = 1.0 + Math.sin(time * 4.0 + idx) * 0.2;
                beacon.userData.ringMesh.scale.set(s, s, 1);
              }
              if (beacon.userData?.coreMesh) {
                beacon.userData.coreMesh.rotation.y = time * 1.5;
              }
            });
          }

          // 7. Biological Sensation Update on Fly Anatomy
          const compositeValence = netOlfactoryDrive !== 0 ? Math.tanh(netOlfactoryDrive) : 0;
          const sensoryDist = Math.min(closestFoodDist, closestRepellentDist, flyPos.distanceTo(targetPos));

          FlyConnectomeEngine.updateBiologicalSensoryResponses(
            flyPartsRef.current,
            time,
            compositeValence,
            sensoryDist,
            isFlying
          );

          // 8. Update Electrophysiological Spike Events
          spikeRasterEventsRef.current = {
            ch1_dm1: sensingFood,
            ch2_gr5a: !isFlying && closestFoodDist < 0.65,
            ch3_lptc: Math.abs(visualTelemetry.opticalFlowHS) > 10,
            ch4_gf: giantFiberFired || visualTelemetry.loomingAlert,
            ch5_epg: flyHeadingAngle,
            ch6_vnc: isFlying ? 50.0 : firingRateHz
          };

          // ── FASES 1 Y 2: Step Cortical SNN & Stream-of-Consciousness Synthesizer ──
          neuroAIConsciousness.stepCorticalSNN(
            delta,
            firingRateHz,
            behaviorStateRef.current,
            spikeRasterEventsRef.current
          );
          const currentInnerThought = neuroAIConsciousness.updateConsciousnessCycle(time, {
            sensoryInputs: {
              closestFoodDist,
              closestRepellentDist,
              sensingFood,
              sensingRepellent,
              netOlfactoryDrive
            },
            spikes: spikeRasterEventsRef.current,
            drives: behaviorStateRef.current,
            locomotionMode: isFlying ? 'flight' : 'walking',
            activeChannels: activeStimulusSet,
            currentProduct
          });
          if (currentInnerThought) {
            setLatestFlyThought(currentInnerThought);
          }

          // Spontaneous conscious inquiry to the human (every ~40s when idle)
          if (time - lastInquiryCheckTimeRef.current > 40.0) {
            lastInquiryCheckTimeRef.current = time;
            if (!neuroAIConsciousness.isSpeaking) {
              const liveCtx = {
                hungerDrive: behaviorStateRef.current?.hungerDrive ?? 0.5,
                aversiveDrive: behaviorStateRef.current?.aversiveDrive ?? 0.1,
                fatigueDrive: behaviorStateRef.current?.fatigueDrive ?? 0.2,
                explorationDrive: behaviorStateRef.current?.explorationDrive ?? 0.5,
                groomingPause: behaviorStateRef.current?.groomingPause ?? false,
                isFlying: isFlying,
                activeEnvironment: activeEnvironment,
                kitchenBoundaryMode: kitchenBoundaryMode,
                currentProduct: currentProduct,
              };
              neuroAIConsciousness.generateProactiveInquiry(liveCtx).then(inq => {
                if (inq && inq.text) {
                  setActiveFlySpeech({
                    text: inq.text,
                    type: 'inquiry',
                    emotion: inq.emotion,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 18000
                  });
                }
              }).catch(() => {});
            }
          }

          // 9. ── NATURALISTIC SACCADIC LOCOMOTION ENGINE ──────────────────────────────
          // Based on Drosophila free-walking ethograms (Strauss & Heisenberg 1993,
          // Robie et al 2017, Berman et al 2014): fly holds a heading for a random
          // fixation period (200–650 ms), then fires a near-instantaneous saccade
          // (~40-50 ms) to a new heading angle. This produces the stop-and-turn
          // trajectory seen in real fly tracking data, NOT smooth continuous rotation.
          {
            const bs = behaviorStateRef.current;
            const firingScale = firingRateHz / 4.2;
            const hasStimulus = steerDir.lengthSq() > 0.001;

            // ── A. Update Internal Drive States ──────────────────────────────────────
            // Hunger rises over time, falls when the fly is close to food
            bs.hungerDrive = Math.min(1.0, bs.hungerDrive + delta * 0.018);
            if (!isFlying && closestFoodDist < 0.55) {
              bs.hungerDrive = Math.max(0.0, bs.hungerDrive - delta * 0.45);
            }
            // Exploration drive oscillates with a slow internal rhythm (~30s period)
            bs.explorationDrive = 0.35 + Math.sin(time * 0.21 + bs.speedNoiseSeed) * 0.30;
            // Fatigue rises during sustained walking, resets during rest
            if (!bs.groomingPause && !isFlying) {
              bs.activeTime += delta;
              bs.fatigueDrive = Math.min(0.85, bs.activeTime * 0.012);
            } else if (bs.groomingPause) {
              bs.activeTime = Math.max(0, bs.activeTime - delta * 2.5);
              bs.fatigueDrive = Math.max(0, bs.fatigueDrive - delta * 0.08);
            }
            // Aversive drive decays exponentially (fear memory fades)
            if (sensingRepellent || giantFiberFired) {
              bs.aversiveDrive = Math.min(1.0, bs.aversiveDrive + 0.35);
            } else {
              bs.aversiveDrive = Math.max(0.0, bs.aversiveDrive - delta * 0.12);
            }

            // ── A2. Spontaneous Behavior Variety Timers ───────────────────────────────
            if (!hasStimulus && !isFlying && !bs.groomingPause) {
              // Curiosity burst: abrupt speed/direction change (investigative)
              bs.nextCuriosityIn -= delta;
              if (bs.nextCuriosityIn <= 0 && bs.curiosityBurstTimer <= 0) {
                bs.curiosityBurstTimer = 0.6 + Math.random() * 0.8;
                bs.nextCuriosityIn = 12 + Math.random() * 20;
                // Sharp random turn
                bs.saccadeTargetYaw = flyModelRef.current.rotation.y + (Math.random() - 0.5) * Math.PI * 1.4;
                bs.saccadeProgress = 0;
                bs.saccadeDuration = 0.03 + Math.random() * 0.02;
                bs.saccadePhase = 'saccading';
                bs.levySpeed = 0.018 + Math.random() * 0.010; // faster burst
                bs.levyStepLength = 0.15 + Math.random() * 0.25;
              }
              if (bs.curiosityBurstTimer > 0) bs.curiosityBurstTimer -= delta;

              // Pause & observe: full stop, slow antenna oscillation
              bs.nextPauseObserveIn -= delta;
              if (bs.nextPauseObserveIn <= 0 && bs.pauseObserveTimer <= 0) {
                bs.pauseObserveTimer = 1.2 + Math.random() * 2.0;
                bs.nextPauseObserveIn = 18 + Math.random() * 28;
              }

              // Wing buzz: body vibrates as if warming up wings
              bs.nextWingBuzzIn -= delta;
              if (bs.nextWingBuzzIn <= 0 && bs.wingBuzzTimer <= 0) {
                bs.wingBuzzTimer = 0.3 + Math.random() * 0.5;
                bs.nextWingBuzzIn = 10 + Math.random() * 18;
              }
            } else {
              // Clear spontaneous states if stimulus takes over
              bs.pauseObserveTimer = 0;
              bs.wingBuzzTimer = 0;
            }

            // ── B. Grooming / Rest Pause Bouts ───────────────────────────────────────
            // Fly pauses to clean antennae/wings every ~10-25s (lab-measured interval)
            if (!bs.groomingPause) {
              bs.nextGroomIn -= delta;
              // Fatigue also makes grooming more likely
              if (bs.nextGroomIn <= 0 && !hasStimulus && !isFlying && bs.fatigueDrive > 0.3) {
                bs.groomingPause = true;
                bs.groomingTimer = 0.8 + Math.random() * 1.4; // 0.8–2.2 s pause
                bs.nextGroomIn = 10 + Math.random() * 18;
              }
            }
            if (bs.groomingPause) {
              bs.groomingTimer -= delta;
              if (bs.groomingTimer <= 0 || hasStimulus) {
                bs.groomingPause = false;
              }
              // During grooming: no translation, tiny body micro-oscillation only
              flyModelRef.current.rotation.z = Math.sin(time * 12) * 0.018;
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            } else if (bs.pauseObserveTimer > 0 && !hasStimulus && !isFlying) {
              // Pause & observe: full stop, slow head-scan oscillation
              bs.pauseObserveTimer -= delta;
              flyModelRef.current.rotation.y += Math.sin(time * 1.8) * 0.006; // slow scan
              flyModelRef.current.rotation.z = Math.sin(time * 2.2) * 0.012;
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            } else if (bs.wingBuzzTimer > 0 && !hasStimulus && !isFlying) {
              // Wing buzz: body vibrates rapidly, stays in place
              bs.wingBuzzTimer -= delta;
              flyModelRef.current.rotation.z = Math.sin(time * 45) * 0.04; // rapid wing flutter
              flyModelRef.current.position.y += Math.sin(time * 40) * 0.0008;
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            } else if (isFlying) {
              // ── C. FLIGHT MODE — smooth directional control (aerodynamics require it) ──
              if (hasStimulus) {
                const targetYaw = Math.atan2(steerDir.x, steerDir.z);
                // In flight: use gentler saccade-like turns (~80ms bank-and-roll)
                flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, targetYaw, 0.055);
              }
              let flightSpeed = 0.038 * firingScale;
              if (giantFiberFired) flightSpeed *= 1.6;
              flyModelRef.current.translateZ(flightSpeed);
              setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
            } else {
              // ── D. WALKING MODE — Saccadic Fixation + Lévy Walk ────────────────────
              if (hasStimulus) {
                // STIMULUS-DRIVEN: saccade toward gradient direction
                const desiredYaw = Math.atan2(steerDir.x, steerDir.z);

                if (bs.saccadePhase === 'fixating') {
                  bs.fixationTimer -= delta;
                  if (bs.fixationTimer <= 0) {
                    // Compute angular error; only saccade if error > ~15° (threshold)
                    let yawErr = desiredYaw - flyModelRef.current.rotation.y;
                    // Normalise to [-π, π]
                    while (yawErr > Math.PI) yawErr -= 2 * Math.PI;
                    while (yawErr < -Math.PI) yawErr += 2 * Math.PI;

                    if (Math.abs(yawErr) > 0.26) { // >~15°: fire saccade
                      // Add small random scatter to avoid perfectly mechanical turns
                      const scatter = (Math.random() - 0.5) * 0.18;
                      bs.saccadeTargetYaw = desiredYaw + scatter;
                      bs.saccadeProgress = 0;
                      bs.saccadePhase = 'saccading';
                      bs.saccadeDuration = 0.035 + Math.random() * 0.02; // 35–55 ms
                    } else {
                      // Small error: just reset fixation timer without saccading
                      bs.fixationDuration = 0.15 + Math.random() * 0.5;
                      bs.fixationTimer = bs.fixationDuration;
                    }
                  }
                }

                if (bs.saccadePhase === 'saccading') {
                  bs.saccadeProgress += delta / bs.saccadeDuration;
                  if (bs.saccadeProgress >= 1.0) {
                    bs.saccadeProgress = 1.0;
                    flyModelRef.current.rotation.y = bs.saccadeTargetYaw;
                    bs.saccadePhase = 'fixating';
                    bs.fixationDuration = 0.20 + Math.random() * 0.45 * (1.0 - bs.hungerDrive);
                    bs.fixationTimer = bs.fixationDuration;
                  } else {
                    // Smooth-step easing for the saccade itself (sigmoidal, fast)
                    const t = bs.saccadeProgress;
                    const smooth = t * t * (3 - 2 * t);
                    const prevYaw = bs.saccadeTargetYaw - (bs.saccadeTargetYaw - flyModelRef.current.rotation.y) * (1 - smooth);
                    flyModelRef.current.rotation.y = THREE.MathUtils.lerp(flyModelRef.current.rotation.y, bs.saccadeTargetYaw, smooth * 0.9);
                  }
                }

                // Speed: base walking + hunger urgency + stochastic noise
                // Noise term: fractional sinusoidal walk on the seed (smooth but unpredictable)
                const speedNoise = 0.7 + 0.3 * Math.sin(time * 3.7 + bs.speedNoiseSeed) * Math.sin(time * 2.1 + bs.speedNoiseSeed * 0.7);
                let walkSpeed = 0.0145 * firingScale * speedNoise * (1.0 + bs.hungerDrive * 0.4);
                if (giantFiberFired || sensingRepellent) walkSpeed *= 1.55; // escape sprint
                // Slow to a crawl when very close to food (feeding approach)
                if (closestFoodDist < 0.45) walkSpeed *= 0.12;
                // Fatigue reduces speed
                walkSpeed *= (1.0 - bs.fatigueDrive * 0.35);
                flyModelRef.current.translateZ(walkSpeed);
                setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));

              } else {
                // FREE EXPLORATION: Lévy Walk (power-law step lengths, naturalistic turns)
                // The Lévy exponent μ≈2 is empirically measured in many insects.
                if (bs.levyStepLength <= 0) {
                  // Sample a new Lévy step: length ~ Pareto(x_min, μ=2)
                  const u = Math.max(0.001, Math.random());
                  const levyExponent = 2.0;
                  bs.levyStepLength = 0.08 * Math.pow(u, -1.0 / (levyExponent - 1)); // x_min=0.08
                  bs.levyStepLength = Math.min(bs.levyStepLength, 0.85); // clamp to arena size

                  // Sample a new heading: biased toward unexplored directions
                  // (simple approximation: prefer turns of 60–150° to avoid straight runs)
                  const turnBias = Math.PI * 0.5 + Math.random() * Math.PI * 0.7;
                  const turnSign = Math.random() < 0.5 ? 1 : -1;
                  bs.levyHeading = flyModelRef.current.rotation.y + turnSign * turnBias;

                  // Hunger biases toward shorter steps (more turning, staying near food area)
                  // Exploration drive biases toward longer steps
                  const driveScale = 0.5 + bs.explorationDrive * 0.8 - bs.hungerDrive * 0.3;
                  bs.levyStepLength *= Math.max(0.15, driveScale);
                  bs.levySpeed = (0.009 + Math.random() * 0.006) * firingScale;

                  // Saccade to new heading
                  bs.saccadeTargetYaw = bs.levyHeading;
                  bs.saccadeProgress = 0;
                  bs.saccadeDuration = 0.04 + Math.random() * 0.025;
                  bs.saccadePhase = 'saccading';
                }

                if (bs.saccadePhase === 'saccading') {
                  bs.saccadeProgress += delta / bs.saccadeDuration;
                  if (bs.saccadeProgress >= 1.0) {
                    bs.saccadeProgress = 1.0;
                    flyModelRef.current.rotation.y = bs.saccadeTargetYaw;
                    bs.saccadePhase = 'fixating';
                    bs.fixationTimer = bs.fixationDuration;
                  } else {
                    flyModelRef.current.rotation.y = THREE.MathUtils.lerp(
                      flyModelRef.current.rotation.y, bs.saccadeTargetYaw,
                      bs.saccadeProgress * 0.92
                    );
                  }
                }

                // Advance Lévy step
                const stepDist = bs.levySpeed * delta;
                bs.levyStepLength -= stepDist;
                flyModelRef.current.translateZ(bs.levySpeed);

                // Occasional spontaneous micro-turn during fixation (vibration noise)
                flyModelRef.current.rotation.y += (Math.random() - 0.5) * 0.004;

                setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
              }
            }
          }

          // -----------------------------------------------------------------
          // INVIOLABLE HARD PHYSICAL BOUNDARIES & IMMEDIATE BOUNCE REFLECTION
          // -----------------------------------------------------------------
          const curPos = flyModelRef.current.position;
          let bounced = false;

          let bMinX = -1.78, bMaxX = 1.78;
          let bMinZ = -0.92, bMaxZ = 0.92;
          let bMinY = 1.02, bMaxY = 2.36;
          let bCenterX = 0, bCenterZ = 0;
          let isCylindrical = false;
          let cylRadius = 4.2;

          if (activeEnvironment === 'kitchen') {
            if (kitchenBoundaryMode === 'terrarium') {
              bMinX = -1.78; bMaxX = 1.78;
              bMinZ = -0.92; bMaxZ = 0.92;
              bMinY = 1.02; bMaxY = 2.36;
            } else {
              bMinX = -4.5; bMaxX = 4.5;
              bMinZ = -3.2; bMaxZ = 3.5;
              bMinY = 0.05; bMaxY = 3.4;
            }
          } else if (activeEnvironment === 'scanned_room' && roomBounds) {
            bMinX = roomBounds.min.x + 0.15; bMaxX = roomBounds.max.x - 0.15;
            bMinZ = roomBounds.min.z + 0.15; bMaxZ = roomBounds.max.z - 0.15;
            bMinY = roomBounds.min.y + 0.05; bMaxY = roomBounds.max.y - 0.2;
            bCenterX = roomBounds.center.x; bCenterZ = roomBounds.center.z;
          } else {
            isCylindrical = true;
            cylRadius = 4.2;
            bMinY = 0.0; bMaxY = 2.45;
          }

          // Hard Clamping - physically guarantees the fly NEVER crosses boundary
          if (isCylindrical) {
            const dist = Math.hypot(curPos.x, curPos.z);
            if (dist > cylRadius) {
              curPos.x = (curPos.x / dist) * cylRadius;
              curPos.z = (curPos.z / dist) * cylRadius;
              bounced = true;
            }
          } else {
            if (curPos.x > bMaxX) { curPos.x = bMaxX; bounced = true; }
            else if (curPos.x < bMinX) { curPos.x = bMinX; bounced = true; }

            if (curPos.z > bMaxZ) { curPos.z = bMaxZ; bounced = true; }
            else if (curPos.z < bMinZ) { curPos.z = bMinZ; bounced = true; }
          }

          if (curPos.y > bMaxY) {
            curPos.y = bMaxY;
            flightStateRef.current.targetY = bMaxY - 0.25;
            bounced = true;
          } else if (curPos.y < bMinY) {
            curPos.y = bMinY;
            if (!isFlying) flightStateRef.current.targetY = bMinY;
          }

          // If hit obstacle/glass/wall, immediately deflect heading angle inward
          if (bounced) {
            const inward = Math.atan2(bCenterX - curPos.x, bCenterZ - curPos.z);
            flyModelRef.current.rotation.y = inward + (Math.random() - 0.5) * 0.4;
            setFlyHeadingAngle(Math.round((flyModelRef.current.rotation.y * 180 / Math.PI + 360) % 360));
          }

          // Smooth Camera Tracking (Follow Cam)
          if (isFollowCamActive && flyControlsRef.current) {
            flyControlsRef.current.target.lerp(curPos, 0.08);
          }
        }

        flyRendererRef.current.render(flySceneRef.current, flyCameraRef.current);

        // Project fly 3D position to 2D screen coordinate for dynamic 3D-anchored speech balloon
        if (flyModelRef.current && flyCameraRef.current && flyContainerRef.current) {
          const flyWorldPos = new THREE.Vector3();
          flyModelRef.current.getWorldPosition(flyWorldPos);
          flyWorldPos.y += 0.09;
          const projected = flyWorldPos.clone().project(flyCameraRef.current);
          if (projected.z < 1.0) {
            const rect = flyContainerRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const sx = (projected.x * 0.5 + 0.5) * rect.width;
              const sy = (-(projected.y * 0.5) + 0.5) * rect.height;
              flyScreenPosRef.current = { x: sx, y: sy, visible: true };
            }
          } else {
            flyScreenPosRef.current = { x: 0, y: 0, visible: false };
          }
          if (time - lastScreenPosUpdateRef.current > 0.04) {
            lastScreenPosUpdateRef.current = time;
            setFlyScreenPos({ ...flyScreenPosRef.current });
          }
        }

        // Render Real-Time Compound Eye First-Person Perspective (Optic Lobe)
        if (showEyeProjector && flyEyeRendererRef.current && flyEyeCameraRef.current && flyModelRef.current) {
          // Mount camera directly at the compound eyes (head position + offset scaled to fly size)
          const currentScale = flyModelRef.current.scale.x || 0.045;
          const eyeLocalPos = new THREE.Vector3(0, 0.98 * currentScale, 1.16 * currentScale);
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
  }, [isRunning, firingRateHz, activeStimulusSet, selectedStimulusIdx, isFlying, showEyeProjector]);

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

    setActiveStimulusSet(prev => { const n = new Set(prev); n.add('memory'); return n; });

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
    setActiveStimulusSet(prev => { const n = new Set(prev); n.add('memory'); return n; });
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

  // ── FASES 1, 2 Y 3: NeuroAI Consciousness & Voice Handlers ──
  useEffect(() => {
    const unsub = neuroAIConsciousness.onSpeakingStateChange((speaking) => {
      setIsFlySpeaking(speaking);
    });
    return () => unsub();
  }, []);

  const handleSendHumanMessage = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    const textToSend = (overrideText || userChatInput).trim();
    if (!textToSend) return;
    setUserChatInput('');
    setMicTranscript('');
    const context = {
      hungerDrive: behaviorStateRef.current?.hungerDrive ?? 0.5,
      aversiveDrive: behaviorStateRef.current?.aversiveDrive ?? 0.1,
      fatigueDrive: behaviorStateRef.current?.fatigueDrive ?? 0.2,
      explorationDrive: behaviorStateRef.current?.explorationDrive ?? 0.5,
      groomingPause: behaviorStateRef.current?.groomingPause ?? false,
      isFlying: isFlying,
      activeEnvironment: activeEnvironment,
      kitchenBoundaryMode: kitchenBoundaryMode,
      currentProduct: currentProduct,
    };
    const res = await neuroAIConsciousness.processHumanMessage(textToSend, context);
    setEngramMutationCounter(res.mutations);
    setLatestFlyThought(res.reply);
    setActiveFlySpeech({
      text: res.reply,
      type: 'reply',
      emotion: res.valence > 0.7 ? 'happy' : res.valence < 0.4 ? 'scared' : 'curious',
      timestamp: Date.now(),
      expiresAt: Date.now() + 16000
    });
  };

  const triggerProactiveQuestion = async () => {
    const context = {
      hungerDrive: behaviorStateRef.current?.hungerDrive ?? 0.5,
      aversiveDrive: behaviorStateRef.current?.aversiveDrive ?? 0.1,
      fatigueDrive: behaviorStateRef.current?.fatigueDrive ?? 0.2,
      explorationDrive: behaviorStateRef.current?.explorationDrive ?? 0.5,
      groomingPause: behaviorStateRef.current?.groomingPause ?? false,
      isFlying: isFlying,
      activeEnvironment: activeEnvironment,
      kitchenBoundaryMode: kitchenBoundaryMode,
      currentProduct: currentProduct,
    };
    const inq = await neuroAIConsciousness.generateProactiveInquiry(context);
    if (inq && inq.text) {
      setActiveFlySpeech({
        text: inq.text,
        type: 'inquiry',
        emotion: inq.emotion,
        timestamp: Date.now(),
        expiresAt: Date.now() + 18000
      });
    }
  };

  // Auto-expire active fly speech bubble after timeout
  useEffect(() => {
    if (!activeFlySpeech) return;
    const timer = setInterval(() => {
      if (Date.now() > activeFlySpeech.expiresAt) {
        setActiveFlySpeech(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeFlySpeech]);

  const toggleMicListening = () => {
    if (isListeningToMic) {
      if (speechRecognizerRef.current) {
        try { speechRecognizerRef.current.stop(); } catch { /* silent */ }
      }
      setIsListeningToMic(false);
      return;
    }

    const recognizer = neuroAIConsciousness.createSpeechRecognizer({
      onTranscript: (interim) => {
        setMicTranscript(interim);
        setUserChatInput(interim);
      },
      onFinalMessage: (finalText) => {
        setIsListeningToMic(false);
        setMicTranscript('');
        if (finalText && finalText.trim()) {
          handleSendHumanMessage(null, finalText);
        }
      },
      onListeningState: (listening) => {
        setIsListeningToMic(listening);
        if (!listening) setMicTranscript('');
      },
      onError: (err) => {
        console.warn('[Microphone] Error o permiso denegado:', err);
        setIsListeningToMic(false);
      }
    });

    if (recognizer) {
      speechRecognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch (e) {
        console.warn('[Microphone] No se pudo iniciar el reconocedor:', e);
        setIsListeningToMic(false);
      }
    } else {
      alert('Tu navegador no soporta reconocimiento de voz nativo (Web Speech API). Por favor abre la app en Google Chrome para hablar por micrófono.');
    }
  };

  const handleSelectPersonality = (profileId) => {
    neuroAIConsciousness.setPersonalityProfile(profileId);
    setActivePersonaProfile(profileId);
    setEngramMutationCounter(neuroAIConsciousness.engramMutationCount);
  };

  const handleToggleVoiceSynthesis = () => {
    const next = !isVoiceSynthesisOn;
    setIsVoiceSynthesisOn(next);
    neuroAIConsciousness.isVoiceSynthesisEnabled = next;
    if (next) {
      neuroAIConsciousness.speakText("Voz neural activada. Decodificando señales del conectoma.");
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsFlySpeaking(false);
    }
  };

  const toggleFlight = () => {
    const groundLevelY = activeEnvironment === 'kitchen' ? 1.02 : 0.0;
    if (isFlying) {
      // Initiate descent & smooth landing
      flightStateRef.current.targetY = groundLevelY;
      setTimeout(() => {
        setIsFlying(false);
        if (flyModelRef.current) flyModelRef.current.position.y = groundLevelY;
      }, 700);
    } else {
      // Initiate vertical takeoff
      setIsFlying(true);
      flightStateRef.current.targetY = activeEnvironment === 'kitchen' ? 2.1 : 1.6;
    }
  };

  const currentProduct = HOUSEHOLD_ODOR_PRODUCTS[selectedStimulusIdx] || HOUSEHOLD_ODOR_PRODUCTS[0];

  return (
    <div className="relative w-screen h-screen bg-[#060913] text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Top Header & Navigation Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 py-2.5 bg-black/60 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center space-x-3">
          {onBackToLobby && (
            <button
              onClick={onBackToLobby}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition shadow-sm"
              title="Volver al Menú Principal (Lobby)"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Lobby</span>
            </button>
          )}
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
          {/* Global Immersive Mode / Hide HUD Toggle Button */}
          <button
            onClick={() => setIsImmersiveMode(!isImmersiveMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg transition active:scale-95 ${
              isImmersiveMode
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold ring-2 ring-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Ocultar o mostrar todos los cuadros flotantes para despejar la vista de la animación 3D"
          >
            {isImmersiveMode ? (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-950" />
                <span>Mostrar Cuadros</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Ocultar Cuadros</span>
              </>
            )}
          </button>

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
            <span>{showEyeProjector ? '👁️ Visión ON' : '👁️ Visión OFF'}</span>
          </button>

          <button
            onClick={() => setShowArchitectureModal(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-xs font-bold text-pink-300 border border-purple-500/40 flex items-center space-x-1 shadow-lg transition active:scale-95"
            title="Especificación y arquitectura técnica para 166.700 neuronas y 124,2M sinapsis en Apple Silicon M5"
          >
            <Brain className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>🧬 166k / 124M Info</span>
          </button>

          {/* Apple Silicon M5 Hardware Acceleration & Research Bridge Button */}
          <button
            onClick={() => setShowM5Modal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg transition active:scale-95 border ${
              m5Status === 'connected'
                ? 'bg-emerald-950/85 hover:bg-emerald-900 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10'
                : 'bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
            }`}
            title="Aceleración GPU Apple Silicon M5 en el navegador (120 FPS) y enlace MuJoCo"
          >
            <Cpu className={`w-3.5 h-3.5 ${m5Status === 'connected' ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <span>
              {m5Status === 'connected' ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>M5 MuJoCo Vinculado (120Hz)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span>⚡ Aceleración GPU M5 (120 FPS)</span>
                </span>
              )}
            </span>
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
          {/* Massive Connectome HUD & Density Selector (Apple M5 Ultra Mode) */}
          {!isImmersiveMode && (
            <div className="absolute top-3 left-3 z-10 p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 max-w-sm shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>Conectoma Celular Real</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">M5 Ultra GPU</span>
                    </div>
                    <div className="text-[9px] text-cyan-300 font-mono">166.700 Neuronas · Reconstrucción Janelia</div>
                  </div>
                </div>

                {/* Minimize / Expand Toggle Button */}
                <button
                  onClick={() => setIsConnectomeHudCollapsed(!isConnectomeHudCollapsed)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition ml-2"
                  title={isConnectomeHudCollapsed ? "Expandir tarjeta de neuronas" : "Minimizar tarjeta"}
                >
                  {isConnectomeHudCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {!isConnectomeHudCollapsed && (
                <>
                  {/* Density Selector for Apple M5 Chip */}
                  <div className="mb-2">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
                      <span>Densidad de Neuronas 3D:</span>
                      <span className="text-cyan-400 font-mono font-bold">{connectomeStats.totalNeurons.toLocaleString()} Neuronas</span>
                    </div>

                    {/* 100% Genuine Biological 169,315 ssTEM Neurons Mode (BANC v888 / FlyWire) */}
                    <div className="mb-1.5">
                      <button
                        onClick={() => setConnectomeDensity('real_banc_169k')}
                        className={`w-full py-1.5 px-2 rounded-xl font-extrabold text-[10px] transition flex items-center justify-center space-x-1.5 ${
                          connectomeDensity === 'real_banc_169k'
                            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg ring-2 ring-emerald-400 animate-pulse'
                            : 'bg-slate-950 text-emerald-300 hover:text-white border border-emerald-500/40 hover:border-emerald-400'
                        }`}
                        title="169.315 Neuronas biológicas reales escaneadas por microscopía electrónica ssTEM (BANC v888 / Harvard / Janelia / FlyWire)"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>🔬 169.315 Neuronas Reales ssTEM (BANC)</span>
                      </button>
                    </div>

                    {/* Color Mode Switcher when Real BANC is active */}
                    {connectomeDensity === 'real_banc_169k' && (
                      <div className="mb-2 p-1.5 bg-slate-950/80 rounded-xl border border-emerald-500/30 text-[9px]">
                        <div className="text-slate-400 font-semibold mb-1 flex justify-between">
                          <span>Colorear Datos Reales:</span>
                          <span className="text-emerald-400 font-mono">
                            {connectomeColorMode === 'neurotransmitter' ? 'Neurotransmisores' : 'Regiones'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            onClick={() => setConnectomeColorMode('neurotransmitter')}
                            className={`py-1 px-1 rounded font-bold transition truncate ${
                              connectomeColorMode === 'neurotransmitter'
                                ? 'bg-teal-600 text-white shadow ring-1 ring-teal-300'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            🧪 Neurotransmisores
                          </button>
                          <button
                            onClick={() => setConnectomeColorMode('region')}
                            className={`py-1 px-1 rounded font-bold transition truncate ${
                              connectomeColorMode === 'region'
                                ? 'bg-indigo-600 text-white shadow ring-1 ring-indigo-300'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            🏛️ Regiones Anatómicas
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Full 166,700 Neurons & 124.2M Synapses Procedural Mode */}
                    <div className="mb-1.5">
                      <button
                        onClick={() => setConnectomeDensity('full_166k')}
                        className={`w-full py-1 px-2 rounded-xl font-bold text-[9px] transition flex items-center justify-center space-x-1.5 ${
                          connectomeDensity === 'full_166k'
                            ? 'bg-purple-600 text-white ring-1 ring-purple-300'
                            : 'bg-slate-950 text-purple-300 hover:text-white border border-purple-500/30'
                        }`}
                        title="166.700 Neuronas procedurales canónicas & 124.2 Millones de Sinapsis"
                      >
                        <span>🚀 166.700 Neuronas & 124.2M Sinapsis (Procedural)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[9px]">
                      <button
                        onClick={() => setConnectomeDensity('m5_ultra')}
                        className={`py-1 px-1 rounded-lg font-bold transition flex items-center justify-center space-x-0.5 ${
                          connectomeDensity === 'm5_ultra'
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow ring-1 ring-cyan-400'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                        title="5.200+ Neuronas morfológicas esqueléticas activas"
                      >
                        <span>🧠 5.2k Esqueletos</span>
                      </button>
                      <button
                        onClick={() => setConnectomeDensity('high')}
                        className={`py-1 px-1 rounded-lg font-bold transition flex items-center justify-center space-x-0.5 ${
                          connectomeDensity === 'high'
                            ? 'bg-cyan-600 text-white shadow'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                        title="3.200 Neuronas activas"
                      >
                        <span>3.2k Alta</span>
                      </button>
                      <button
                        onClick={() => setConnectomeDensity('medium')}
                        className={`py-1 px-1 rounded-lg font-bold transition flex items-center justify-center space-x-0.5 ${
                          connectomeDensity === 'medium'
                            ? 'bg-cyan-600 text-white shadow'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                        title="1.600 Neuronas activas"
                      >
                        <span>1.6k Estándar</span>
                      </button>
                    </div>
                  </div>

                  {/* Biological Circuit Filter */}
                  <div className="mb-2">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">Filtrar Red Neuronal:</div>
                    <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                      {[
                        { id: 'all', label: 'Todas las Redes', col: 'text-white' },
                        { id: 'mb', label: '🧠 MB (Memoria/KCs)', col: 'text-pink-400' },
                        { id: 'cx', label: '🧭 CX (Brújula E-PG)', col: 'text-emerald-400' },
                        { id: 'optic', label: '👁️ Óptico (Retina/LPTC)', col: 'text-cyan-400' },
                        { id: 'vnc', label: '⚡ VNC (Motor Patas)', col: 'text-blue-400' },
                      ].map(cir => (
                        <button
                          key={cir.id}
                          onClick={() => setConnectomeFilter(cir.id)}
                          className={`px-2 py-0.5 rounded-md transition ${
                            connectomeFilter === cir.id
                              ? 'bg-cyan-500/30 text-white border border-cyan-400 font-bold'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          <span className={cir.col}>{cir.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Connectome Telemetry */}
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sinapsis Simuladas:</span>
                      <span className="text-purple-300 font-bold">{connectomeStats.synapseCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Potenciales Acción:</span>
                      <span className="text-cyan-400 font-bold">1.800 ondas ({Math.round(connectomeStats.totalNeurons * firingRateHz).toLocaleString()} AP/s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Brújula E-PG (CX):</span>
                      <span className="text-emerald-400 font-bold">Bump a {flyHeadingAngle}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Aceleración Gráfica:</span>
                      <span className="text-emerald-300 font-bold">Apple Silicon GPU · 120 FPS</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Side: FlyGym 3D Virtual Fly Arena / 3D Kitchen */}
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
          {/* 3D-Anchored Conversational Balloon directly on the Fly */}
          {activeFlySpeech && flyScreenPos.visible && showFlySpeechBubble && (
            <div
              style={{
                left: Math.max(130, Math.min(flyScreenPos.x, (flyContainerRef.current?.clientWidth || 600) - 130)),
                top: Math.max(70, Math.min(flyScreenPos.y - 45, (flyContainerRef.current?.clientHeight || 600) - 50)),
                transform: 'translate(-50%, -100%)'
              }}
              className="absolute z-30 pointer-events-auto select-none transition-all duration-150 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className={`p-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl max-w-[270px] sm:max-w-xs text-white relative ${
                activeFlySpeech.type === 'inquiry'
                  ? 'bg-slate-950/95 border-cyan-400/80 shadow-cyan-500/25 ring-1 ring-cyan-400/40'
                  : activeFlySpeech.emotion === 'happy'
                  ? 'bg-slate-950/95 border-emerald-400/80 shadow-emerald-500/25'
                  : activeFlySpeech.emotion === 'scared'
                  ? 'bg-slate-950/95 border-rose-500/85 shadow-rose-500/30'
                  : 'bg-slate-950/95 border-pink-500/80 shadow-pink-500/25'
              }`}>
                {/* Pointer down to fly */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-8 border-t-slate-950/95" />

                {/* Header */}
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800 text-[10px] font-mono">
                  <div className="flex items-center space-x-1 font-bold">
                    {activeFlySpeech.type === 'inquiry' ? (
                      <span className="text-cyan-300 flex items-center space-x-1">
                        <span>❓ Curiosa / Te pregunta:</span>
                      </span>
                    ) : isFlySpeaking ? (
                      <span className="text-pink-300 flex items-center space-x-1">
                        <Volume2 className="w-3 h-3 text-pink-400 animate-bounce" />
                        <span>🔊 Hablando:</span>
                      </span>
                    ) : activeFlySpeech.emotion === 'happy' ? (
                      <span className="text-emerald-300 flex items-center space-x-1">
                        <span>✨ Satisfecha:</span>
                      </span>
                    ) : activeFlySpeech.emotion === 'scared' ? (
                      <span className="text-rose-300 flex items-center space-x-1">
                        <span>⚡ Alerta/Dolor:</span>
                      </span>
                    ) : (
                      <span className="text-pink-300 flex items-center space-x-1">
                        <span>💬 Mosca:</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveFlySpeech(null)}
                    className="text-slate-400 hover:text-white p-0.5"
                    title="Cerrar globo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Spoken Text */}
                <p className="text-xs text-slate-100 font-medium leading-snug">
                  "{activeFlySpeech.text}"
                </p>

                {/* Quick Interactive Actions */}
                <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-800/80">
                  <button
                    onClick={toggleMicListening}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition flex items-center space-x-1 ${
                      isListeningToMic
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40'
                    }`}
                    title="Responder con tu voz"
                  >
                    <Mic className={`w-3 h-3 ${isListeningToMic ? 'animate-bounce text-white' : 'text-cyan-300'}`} />
                    <span>{isListeningToMic ? 'Escuchando...' : 'Responder (Mic)'}</span>
                  </button>

                  <button
                    onClick={() => setShowConsciousnessModal(true)}
                    className="px-2 py-0.5 rounded-lg text-[9px] font-mono text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 transition"
                  >
                    Chat completo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Floating Controls when Immersive Mode is Active */}
          {isImmersiveMode && (
            <div className="absolute top-3 right-3 z-30 flex items-center space-x-2">
              <button
                onClick={toggleFlight}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xl transition backdrop-blur-md active:scale-95 ${
                  isFlying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold animate-pulse'
                    : 'bg-indigo-600/90 hover:bg-indigo-500 text-white'
                }`}
                title="Despegar o aterrizar"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>{isFlying ? '🪰 Aterrizar' : '🚀 Volar 3D'}</span>
              </button>
              <button
                onClick={() => setIsImmersiveMode(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-cyan-300 text-xs font-bold border border-cyan-500/40 backdrop-blur-md shadow-2xl flex items-center space-x-1.5 transition active:scale-95"
                title="Restaurar paneles y tarjetas flotantes"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mostrar Paneles</span>
              </button>
            </div>
          )}

          {/* Interactive Bio-Toolbar (Simultaneous Stimuli & Direct Fly Interaction) */}
          {!isImmersiveMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto">
              <div className="flex items-center space-x-1 p-1 rounded-2xl bg-slate-950/92 backdrop-blur-xl border border-cyan-500/40 shadow-2xl">
                <button
                  onClick={() => setActiveInteractionMode('inspect')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    activeInteractionMode === 'inspect'
                      ? 'bg-slate-700 text-white ring-1 ring-slate-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title="Modo Cámara: Girar y explorar el espacio 3D"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Explorar</span>
                </button>

                <button
                  onClick={() => setActiveInteractionMode('tap')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    activeInteractionMode === 'tap'
                      ? 'bg-rose-600 text-white shadow-lg ring-1 ring-rose-400 animate-pulse'
                      : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
                  }`}
                  title="Golpear superficie: Haz clic cerca de la mosca para sobresaltarla con el reflejo de escape Giant Fiber"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-rose-300" />
                  <span>👆 Tocar / Tap</span>
                </button>

                <button
                  onClick={() => setActiveInteractionMode('food')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    activeInteractionMode === 'food'
                      ? 'bg-amber-500 text-slate-950 shadow-lg font-extrabold ring-1 ring-amber-300 animate-pulse'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
                  }`}
                  title="Soltar cebo dulce: Haz clic en cualquier lugar para colocar gotas de néctar (+ Valencia)"
                >
                  <span>🍯 Poner Comida</span>
                </button>

                <button
                  onClick={() => setActiveInteractionMode('repellent')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    activeInteractionMode === 'repellent'
                      ? 'bg-red-600 text-white shadow-lg ring-1 ring-red-400 animate-pulse'
                      : 'text-slate-400 hover:text-red-400 hover:bg-slate-900'
                  }`}
                  title="Soltar repelente: Haz clic para colocar ajo nociceptivo (- Valencia)"
                >
                  <span>🧄 Poner Repelente</span>
                </button>

                <button
                  onClick={() => setActiveInteractionMode('laser')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    activeInteractionMode === 'laser'
                      ? 'bg-emerald-600 text-white shadow-lg ring-1 ring-emerald-400 animate-pulse'
                      : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
                  }`}
                  title="Puntero Láser: Mueve el cursor para proyectar un punto brillante que la mosca persigue"
                >
                  <Crosshair className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Láser</span>
                </button>

                {placedStimuli.length > 0 && (
                  <button
                    onClick={handleClearStimuli}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition"
                    title="Limpiar todos los cebos y repelentes colocados"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setShowSpikeRasterHUD(!showSpikeRasterHUD)}
                  className={`px-2 py-1.5 rounded-xl text-[10px] font-bold font-mono transition flex items-center space-x-1 ${
                    showSpikeRasterHUD
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Mostrar / Ocultar panel de electrofisiología multicanal (Spike Raster)"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>MEA 6-CH</span>
                </button>

                <button
                  onClick={() => setShowConsciousnessModal(true)}
                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold font-mono transition flex items-center space-x-1.5 bg-gradient-to-r from-purple-900/70 to-pink-900/70 text-pink-200 border border-pink-500/50 hover:from-purple-800 hover:to-pink-800 hover:text-white shadow-lg shadow-pink-500/10"
                  title="Consciencia Artificial & Diálogo Neural (Fases 1, 2 y 3)"
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                  <span>Consciencia IA</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                </button>
              </div>

              {/* Active Tool Guidance Badge */}
              <div className="mt-1 px-3 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[10px] text-cyan-300 font-mono shadow-lg flex items-center space-x-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span>
                  {activeInteractionMode === 'tap'
                    ? 'Haz clic en el suelo/encimera para golpear y disparar el reflejo Giant Fiber de escape'
                    : activeInteractionMode === 'food'
                    ? 'Haz clic en cualquier superficie para soltar cebo de alimento (puedes poner varios)'
                    : activeInteractionMode === 'repellent'
                    ? 'Haz clic para colocar repelente nociceptivo (ajo/ácido) y ver a la mosca huir o asearse'
                    : activeInteractionMode === 'laser'
                    ? 'Mueve el cursor para apuntar con el haz láser; los ojos compuestos lo rastrearán'
                    : 'Modo exploración 3D libre · Selecciona una herramienta para interactuar'}
                </span>
                {lastInteractionFeedback && (
                  <span className="text-amber-400 font-bold ml-1">· {lastInteractionFeedback}</span>
                )}
              </div>

              {/* Live Interactive Conversational Cockpit & Dialogue Bar (Fase 1) */}
              <div 
                className={`mt-1 max-w-3xl w-full px-3 py-1.5 rounded-2xl bg-slate-950/95 backdrop-blur-xl border shadow-2xl flex flex-col sm:flex-row items-center space-y-1.5 sm:space-y-0 sm:space-x-2.5 transition-all pointer-events-auto ${
                  activeFlySpeech
                    ? activeFlySpeech.type === 'inquiry'
                      ? 'border-cyan-400/80 ring-2 ring-cyan-500/30 shadow-cyan-500/15'
                      : activeFlySpeech.emotion === 'happy'
                      ? 'border-emerald-400/80 ring-2 ring-emerald-500/30 shadow-emerald-500/15'
                      : activeFlySpeech.emotion === 'scared'
                      ? 'border-rose-500/80 ring-2 ring-rose-500/30 shadow-rose-500/20'
                      : 'border-pink-500/80 ring-2 ring-pink-500/30 shadow-pink-500/15'
                    : isListeningToMic
                    ? 'border-rose-400 ring-2 ring-rose-500/40 shadow-rose-500/20'
                    : isFlySpeaking
                    ? 'border-pink-400 ring-2 ring-pink-500/40 shadow-pink-500/20'
                    : 'border-slate-800 hover:border-pink-500/40'
                }`}
              >
                {/* Left: Message or Thought */}
                <div 
                  onClick={() => setShowConsciousnessModal(true)}
                  className="flex items-center space-x-2 truncate cursor-pointer flex-1 w-full sm:w-auto"
                >
                  <div className="shrink-0 flex items-center space-x-1">
                    {isListeningToMic ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    ) : isFlySpeaking ? (
                      <Volume2 className="w-3.5 h-3.5 text-pink-400 animate-bounce" />
                    ) : activeFlySpeech?.type === 'inquiry' ? (
                      <span className="text-xs">❓</span>
                    ) : activeFlySpeech ? (
                      <span className="text-xs">💬</span>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                    )}
                    <span className="text-[10px] font-mono text-pink-300 font-bold uppercase tracking-wider">
                      {isListeningToMic
                        ? '🎙️ Micrófono:'
                        : activeFlySpeech?.type === 'inquiry'
                        ? '❓ Pregunta:'
                        : activeFlySpeech
                        ? '💬 Mosca:'
                        : `${SYNAPTIC_PERSONALITY_PROFILES[activePersonaProfile]?.name?.split('/')[0]}:`}
                    </span>
                  </div>

                  <p className="text-[11px] text-white font-medium truncate flex-1">
                    {isListeningToMic
                      ? (micTranscript || 'Habla claro por tu micrófono...')
                      : activeFlySpeech
                      ? `"${activeFlySpeech.text}"`
                      : `"${latestFlyThought}"`}
                  </p>

                  {activeFlySpeech && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFlySpeech(null);
                      }}
                      className="text-slate-500 hover:text-white p-0.5 shrink-0"
                      title="Descartar y volver a pensamientos de fondo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Right: Inline Quick Reply Form & Voice / Action Controls */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (quickReplyText.trim()) {
                      handleSendHumanMessage(null, quickReplyText.trim());
                      setQuickReplyText('');
                    }
                  }}
                  className="flex items-center space-x-1.5 shrink-0 w-full sm:w-auto justify-end"
                >
                  <input
                    type="text"
                    value={quickReplyText}
                    onChange={(e) => setQuickReplyText(e.target.value)}
                    placeholder={activeFlySpeech?.type === 'inquiry' ? "Respóndele aquí..." : "Háblale a la mosca..."}
                    className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition w-28 sm:w-40"
                  />
                  <button
                    type="submit"
                    disabled={!quickReplyText.trim()}
                    className="p-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white transition shrink-0"
                    title="Enviar mensaje escrito"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleMicListening}
                    className={`p-1.5 px-2 rounded-xl text-xs font-mono transition flex items-center space-x-1 shrink-0 ${
                      isListeningToMic
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-pink-300 border border-pink-500/40'
                    }`}
                    title={isListeningToMic ? "Detener micrófono" : "Hablar por micrófono con la mosca"}
                  >
                    <Mic className={`w-3.5 h-3.5 ${isListeningToMic ? 'animate-bounce text-white' : 'text-pink-300'}`} />
                    <span className="hidden md:inline text-[10px]">{isListeningToMic ? 'Parar' : 'Mic'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={triggerProactiveQuestion}
                    className="p-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono transition shrink-0 hidden sm:flex items-center space-x-0.5"
                    title="Invitar a la mosca a hacerte una pregunta espontánea"
                  >
                    <span>❓ Pregúntame</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleVoiceSynthesis}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition shrink-0"
                    title={isVoiceSynthesisOn ? "Voz activa (clic para silenciar)" : "Voz silenciada (clic para activar)"}
                  >
                    {isVoiceSynthesisOn ? <Volume2 className="w-3.5 h-3.5 text-pink-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConsciousnessModal(true)}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 transition shrink-0"
                    title="Abrir panel completo de Conciencia, Memoria y Gemini"
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </form>
              </div>
            </div>
          )}





          {/* Unified Fly Cockpit Dock Bar & Modular Drawer */}
          {!isImmersiveMode && (
            <div className="absolute top-3 right-3 z-30 flex flex-col items-end space-y-2 pointer-events-auto max-w-[95vw]">
              {/* Dock Pills Menu Bar */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-700/70 shadow-2xl space-x-1">
                <button
                  onClick={() => setActiveFlyDockTab(activeFlyDockTab === 'environment' ? null : 'environment')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeFlyDockTab === 'environment'
                      ? 'bg-amber-600 text-white shadow ring-1 ring-amber-400 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Configurar entorno 3D y límites físicos"
                >
                  <Utensils className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Entorno</span>
                </button>

                <button
                  onClick={() => setActiveFlyDockTab(activeFlyDockTab === 'odors' ? null : 'odors')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeFlyDockTab === 'odors'
                      ? 'bg-amber-500 text-slate-950 shadow ring-1 ring-amber-300 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Paleta de olores y quimiorrecepción"
                >
                  <Beaker className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Olores</span>
                </button>

                <button
                  onClick={() => setActiveFlyDockTab(activeFlyDockTab === 'telemetry' ? null : 'telemetry')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeFlyDockTab === 'telemetry'
                      ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-400 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Telemetría FlyGym, pulsiones internas y física M5"
                >
                  <Bug className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Telemetría</span>
                </button>

                <button
                  onClick={() => setActiveFlyDockTab(activeFlyDockTab === 'mea' ? null : 'mea')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeFlyDockTab === 'mea'
                      ? 'bg-purple-600 text-white shadow ring-1 ring-purple-400 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Electrofisiología Multicanal (MEA SNN en vivo)"
                >
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">MEA</span>
                </button>

                <button
                  onClick={() => setShowEyeProjector(!showEyeProjector)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                    showEyeProjector
                      ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Proyector de Visión Compuesta"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Visión</span>
                </button>

                <button
                  onClick={() => setShowSensoryCascade(!showSensoryCascade)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                    showSensoryCascade
                      ? 'bg-yellow-600 text-white shadow ring-1 ring-yellow-400 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Circuito de Cascada Sensorial Biológica"
                >
                  <Brain className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="hidden sm:inline">Cascada</span>
                </button>

                {activeFlyDockTab && (
                  <button
                    onClick={() => setActiveFlyDockTab(null)}
                    className="p-1 px-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 transition text-xs font-bold"
                    title="Minimizar panel activo"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* The Single Active Drawer Card */}
              {activeFlyDockTab && (
                <div className="w-72 sm:w-80 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-slate-700/80 p-3 shadow-2xl max-h-[calc(100vh-140px)] overflow-y-auto pointer-events-auto transition-all animate-fadeIn">
                  
                  {/* TAB 1: ENVIRONMENT */}
                  {activeFlyDockTab === 'environment' && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 mb-1">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Entorno 3D</span>
                        </div>
                        <button
                          onClick={() => setActiveFlyDockTab(null)}
                          className="text-slate-400 hover:text-white text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setActiveEnvironment('kitchen')}
                          className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                            activeEnvironment === 'kitchen'
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow ring-1 ring-amber-400'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                          title="Cocina virtual hiperrealista con terrario de cristal, encimera de cuarzo y frutero"
                        >
                          <span>🍽️ Cocina</span>
                        </button>
                        <button
                          onClick={() => setActiveEnvironment('scanned_room')}
                          className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                            activeEnvironment === 'scanned_room'
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow ring-1 ring-purple-400'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                          title="Habitación 3D (suelo, muros y muebles con límites físicos)"
                        >
                          <span>🏠 Mi Cuarto</span>
                        </button>
                        <button
                          onClick={() => setActiveEnvironment('arena')}
                          className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                            activeEnvironment === 'arena'
                              ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                          title="Cilindro de cristal de biolaboratorio con retícula de suelo"
                        >
                          <span>🔬 Arena</span>
                        </button>
                      </div>

                      {/* Kitchen Boundary Sub-Bar (Terrarium vs Full Room) */}
                      {activeEnvironment === 'kitchen' && (
                        <div className="p-1.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[10px] space-y-1">
                          <span className="text-slate-400 font-semibold text-[9px] block">Límites del Hábitat:</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setKitchenBoundaryMode('terrarium')}
                              className={`flex-1 px-2 py-1 rounded font-bold transition text-center ${
                                kitchenBoundaryMode === 'terrarium'
                                  ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400'
                                  : 'bg-slate-950 text-slate-400 hover:text-white'
                              }`}
                              title="Confinar estrictamente al Terrario de Cristal en la isla"
                            >
                              🧊 Terrario Cristal
                            </button>
                            <button
                              onClick={() => setKitchenBoundaryMode('room')}
                              className={`flex-1 px-2 py-1 rounded font-bold transition text-center ${
                                kitchenBoundaryMode === 'room'
                                  ? 'bg-amber-600 text-white shadow ring-1 ring-amber-400'
                                  : 'bg-slate-950 text-slate-400 hover:text-white'
                              }`}
                              title="Permitir vuelo por toda la cocina (delimitada por las 4 paredes arquitectónicas y techo)"
                            >
                              🏠 Cocina Abierta
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: ODORS */}
                  {activeFlyDockTab === 'odors' && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 mb-1">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                          <Beaker className="w-3.5 h-3.5" />
                          <span>Paleta de Olores</span>
                        </div>
                        <button
                          onClick={() => setActiveFlyDockTab(null)}
                          className="text-slate-400 hover:text-white text-xs px-1"
                        >
                          ✕
                        </button>
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
                        <div className="mt-1 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300 space-y-1 font-mono">
                          <div className="text-amber-300 font-semibold truncate">{currentProduct.compound}</div>
                          <div className="text-slate-400">Glomérulo: <span className="text-cyan-400">{currentProduct.glomerulus}</span></div>
                          <div className="text-slate-400">
                            Reacción: <span className={memoryStats.valence > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {memoryStats.valence > 0 ? "🟢 Atracción" : "🔴 Escape Nociceptivo"}
                            </span>
                          </div>
                          {activeEnvironment === 'kitchen' && (
                            <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
                              Ubicación: <span className="text-yellow-300 font-semibold">
                                {selectedStimulusIdx === 0 || selectedStimulusIdx === 2
                                  ? "🍌 Frutero (Encimera)"
                                  : selectedStimulusIdx === 1
                                  ? "🍾 Botella Vinagre"
                                  : selectedStimulusIdx === 3 || selectedStimulusIdx === 4
                                  ? "🍯 Tabla Miel & Limón"
                                  : "🗑️ Cubo de Basura"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: TELEMETRY */}
                  {activeFlyDockTab === 'telemetry' && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5 mb-1">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                          <Bug className="w-3.5 h-3.5" />
                          <span>Telemetría FlyGym (EPFL)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            isFlying ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {isFlying ? '🚀 EN VUELO' : '🪰 EN SUPERFICIE'}
                          </span>
                          <button
                            onClick={() => setActiveFlyDockTab(null)}
                            className="text-slate-400 hover:text-white text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1 text-[10px] text-slate-300 font-mono">
                        <div className="flex justify-between">
                          <span>Hábitat:</span>
                          <span className="text-cyan-300 font-bold truncate max-w-[120px]">
                            {activeEnvironment === 'kitchen' 
                              ? (kitchenBoundaryMode === 'terrarium' ? 'Cocina (Terrario)' : 'Cocina Completa')
                              : activeEnvironment === 'scanned_room'
                              ? (currentRoomScan?.name || 'Mi Cuarto 3D')
                              : 'Cilindro Cristal'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Altitud 3D:</span>
                          <span className={isFlying ? "text-amber-300 font-bold" : "text-slate-400"}>
                            {isFlying
                              ? `${(flyModelRef.current?.position.y || (activeEnvironment === 'kitchen' ? 1.8 : 1.5)).toFixed(2)} m`
                              : activeEnvironment === 'kitchen' 
                              ? '1.02 m (Encimera)' 
                              : activeEnvironment === 'scanned_room'
                              ? `${(flyModelRef.current?.position.y || 0.4).toFixed(2)} m`
                              : '0.0 m (Suelo)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rumbo:</span>
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

                        {/* Drive State Bars */}
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800">
                          <div className="text-[9px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">Estado Interno / Pulsiones</div>
                          {[
                            { label: '🍯 Hambre', key: 'hungerDrive', color: 'bg-amber-400' },
                            { label: '🧭 Exploración', key: 'explorationDrive', color: 'bg-cyan-400' },
                            { label: '😴 Fatiga', key: 'fatigueDrive', color: 'bg-indigo-400' },
                            { label: '⚡ Aversión / Dolor', key: 'aversiveDrive', color: 'bg-red-400' },
                          ].map(d => {
                            const val = behaviorStateRef.current?.[d.key] ?? 0;
                            return (
                              <div key={d.key} className="flex items-center gap-1 mb-0.5">
                                <span className="w-24 shrink-0">{d.label}</span>
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${d.color}`}
                                    style={{ width: `${Math.round(val * 100)}%` }}
                                  />
                                </div>
                                <span className="w-7 text-right text-slate-500">{Math.round(val * 100)}%</span>
                              </div>
                            );
                          })}
                          <div className="flex justify-between mt-1">
                            <span>Fase:</span>
                            <span className={`font-bold ${
                              behaviorStateRef.current?.groomingPause ? 'text-pink-400'
                              : behaviorStateRef.current?.saccadePhase === 'saccading' ? 'text-yellow-300'
                              : 'text-emerald-400'
                            }`}>
                              {behaviorStateRef.current?.groomingPause ? '✂️ Acicalando'
                               : behaviorStateRef.current?.saccadePhase === 'saccading' ? '↩️ Sacada'
                               : behaviorStateRef.current?.levyStepLength > 0 ? '🚶 Lévy Walk'
                               : '📌 Fijación'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Scale & Follow-cam */}
                      <div className="pt-2 border-t border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Cámara Centrada:</span>
                          <button
                            onClick={() => setIsFollowCamActive(!isFollowCamActive)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${
                              isFollowCamActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isFollowCamActive ? '🎥 Seguir ON' : '🎥 Seguir OFF'}
                          </button>
                        </div>

                        {/* Flight trigger button */}
                        <button
                          onClick={toggleFlight}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow active:scale-95 ${
                            isFlying
                              ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>
                            {isFlying 
                              ? (activeEnvironment === 'kitchen' 
                                  ? 'Aterrizar en Encimera' 
                                  : activeEnvironment === 'scanned_room'
                                  ? 'Aterrizar en Habitación'
                                  : 'Aterrizar en Suelo') 
                              : 'Despegar a Volar 3D'}
                          </span>
                        </button>
                      </div>

                      {/* Apple Silicon M5 Live MuJoCo / SNN Telemetry */}
                      {m5Status === 'connected' && m5Telemetry && (
                        <div className="pt-2 mt-1 border-t border-emerald-500/30 text-[10px]">
                          <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Física MuJoCo M5:</span>
                            </span>
                            <span className="font-mono text-[9px] bg-emerald-500/20 px-1 rounded">{m5Telemetry.fps || 120} Hz</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[8px] font-mono text-slate-300">
                            <div className="bg-slate-950/80 p-1 rounded text-center border border-slate-800">
                              <span className="text-slate-500 block text-[7px]">DNa01 (Motor)</span>
                              <span className="text-cyan-400 font-bold">{m5Telemetry.spikes?.DNa01_Hz || 45} Hz</span>
                            </div>
                            <div className="bg-slate-950/80 p-1 rounded text-center border border-slate-800">
                              <span className="text-slate-500 block text-[7px]">Fase CPG</span>
                              <span className="text-emerald-400 font-bold">{Math.round((m5Telemetry.cpg_phase || 0) * 100)}%</span>
                            </div>
                            <div className="bg-slate-950/80 p-1 rounded text-center border border-slate-800">
                              <span className="text-slate-500 block text-[7px]">P-FL3 (Giro)</span>
                              <span className="text-amber-400 font-bold">{m5Telemetry.spikes?.PFL3_L_Hz || 20} Hz</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: MEA */}
                  {activeFlyDockTab === 'mea' && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5 mb-1">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                          <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                          <span>Electrofisiología Multicanal (MEA)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[8px] font-mono px-1 rounded bg-purple-500/20 text-purple-300">
                            6 CANALES
                          </span>
                          <button
                            onClick={() => setActiveFlyDockTab(null)}
                            className="text-slate-400 hover:text-white text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Spike Canvas */}
                      <canvas
                        ref={spikeCanvasRef}
                        width={320}
                        height={120}
                        className="w-full h-28 rounded-lg bg-black border border-slate-800"
                      />

                      <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono">
                        <span>Latencia: &lt;2 ms</span>
                        <span className="text-emerald-400 font-bold">120 FPS Real-Time SNN</span>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
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

      {/* Live Biological Sensory Cascade Circuit Banner */}
      {!isImmersiveMode && showSensoryCascade && (
        <div className="absolute bottom-20 inset-x-3 sm:inset-x-6 z-20 pointer-events-auto">
          <div className="p-3 rounded-2xl bg-slate-950/92 backdrop-blur-xl border border-amber-500/40 shadow-2xl transition-all">
            <div className="flex flex-wrap items-center justify-between border-b border-amber-500/20 pb-1.5 mb-2 gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🧠 Cascada Sensorial en Vivo: La Mosca Siente</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                    {currentProduct.icon} {currentProduct.name} ({currentProduct.compound})
                  </span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  memoryEngineRef.current.getNetValence(selectedStimulusIdx) > 0.1
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {memoryEngineRef.current.getNetValence(selectedStimulusIdx) > 0.1
                    ? '🟢 Respuesta: Atracción'
                    : '🔴 Respuesta: Aseo (Grooming)'}
                </span>
                <button
                  onClick={() => setShowSensoryCascade(false)}
                  className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                  title="Cerrar Cascada Sensorial"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 6 Biological Circuit Stations */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-[9px] font-mono text-center">
              <div className="p-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
                <span className="text-slate-400 block text-[8px]">1. Antenas</span>
                <span className="text-amber-300 font-bold">Vibrando a 22 Hz</span>
                <span className="text-[7px] text-slate-500 block">Sensillas Orco</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/90 border border-yellow-500/30">
                <span className="text-slate-400 block text-[8px]">2. Lóbulo Antenal</span>
                <span className="text-yellow-400 font-bold">{currentProduct.glomerulus.split(' ')[0]}</span>
                <span className="text-[7px] text-slate-500 block">Glomérulo Excitado</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30">
                <span className="text-slate-400 block text-[8px]">3. Tracto mALT</span>
                <span className="text-cyan-400 font-bold">120 mV Axonal</span>
                <span className="text-[7px] text-slate-500 block">Conducción al Cerebro</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/90 border border-pink-500/30">
                <span className="text-slate-400 block text-[8px]">4. Cuerpos Fúngicos</span>
                <span className="text-pink-400 font-bold">Kenyon Cells</span>
                <span className="text-[7px] text-slate-500 block">Dopamina: {memoryEngineRef.current.getNetValence(selectedStimulusIdx) > 0 ? '+PAM' : '-PPL1'}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/90 border border-indigo-500/30">
                <span className="text-slate-400 block text-[8px]">5. Motor DNa01</span>
                <span className="text-indigo-300 font-bold">Cuello → VNC</span>
                <span className="text-[7px] text-slate-500 block">Descenso Torácico</span>
              </div>
              <div className={`p-1.5 rounded-xl border ${
                memoryEngineRef.current.getNetValence(selectedStimulusIdx) > 0.1
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                <span className="text-slate-400 block text-[8px]">6. Acción Física</span>
                <span className="font-bold text-[9px]">
                  {memoryEngineRef.current.getNetValence(selectedStimulusIdx) > 0.1
                    ? '👅 Extensión Probóscide'
                    : '🧼 Aseo Patas & Huida'}
                </span>
                <span className="text-[7px] text-slate-400 block">
                  {memoryEngineRef.current.getNetValence(selectedStimulusIdx) > 0.1 ? 'Alimentándose' : 'Frotando cabeza'}
                </span>
              </div>
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

        {/* ── Multi-Sensory Channel Toggles (all can be ON simultaneously) ── */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="text-xs text-slate-400 font-medium">Canales Activos:</span>
          {[
            { ch: 'memory',         label: 'Olfato/MB',      icon: '🧠', activeClass: 'bg-purple-500/30 text-purple-200 border border-purple-400/60', desc: 'Memoria olfativa del Cuerpo Fungiforme (MB→MBON→DAL)' },
            { ch: 'light',          label: 'Fototaxis',      icon: '☀️', activeClass: 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/60', desc: 'Respuesta a la luz (Medulla LC4 → DNp09)' },
            { ch: 'mechanosensory', label: 'Viento/Antenas', icon: '💨', activeClass: 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/60', desc: 'Órgano de Johnston — Detección de corrientes de aire' },
          ].map(({ ch, label, icon, activeClass, desc }) => {
            const isOn = activeStimulusSet.has(ch);
            return (
              <button
                key={ch}
                onClick={() => toggleStimulusChannel(ch)}
                title={desc}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                  isOn ? activeClass : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                <span className={`ml-1 w-3 h-3 rounded-sm border flex items-center justify-center text-[8px] font-bold ${
                  isOn ? 'bg-current border-current text-slate-900' : 'border-slate-600'
                }`}>{isOn ? '✓' : ''}</span>
              </button>
            );
          })}
          <button
            onClick={() => setActiveStimulusSet(new Set())}
            title="Desactivar todos los canales — solo ruido de fondo ambiental (Lévy Walk puro)"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeStimulusSet.size === 0 ? 'bg-slate-600/40 text-slate-200 border-slate-400/60' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            🌿 Libre
          </button>
          {/* Active channel count indicator */}
          <span className="text-[10px] text-slate-500 font-mono">
            {activeStimulusSet.size > 0 ? `${activeStimulusSet.size} canal${activeStimulusSet.size > 1 ? 'es' : ''} activo${activeStimulusSet.size > 1 ? 's' : ''}` : 'Lévy walk puro'}
          </span>
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

      {/* Technical Architecture Dossier: 166,700 Neurons & 124.2M Synapses on Apple Silicon M5 */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-purple-500/50 max-w-3xl w-full flex flex-col space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-pink-300 border border-pink-400/40 shadow-inner">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
                    <span>Arquitectura Técnica: 166.700 Neuronas & 124,2M Sinapsis</span>
                  </h3>
                  <p className="text-xs text-purple-300 font-mono">
                    MaleCNS v1.0 · FlyWire Nature 2024 · Aceleración Apple Silicon M5 GPU
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              {/* Pillar 1: Biological Dataset */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-400 text-sm flex items-center space-x-1.5">
                    <span>1. El Dataset Biológico Real (Janelia & FlyWire)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono font-bold">100% Genuino</span>
                </div>
                <p>
                  El conectoma completo de la <em>Drosophila melanogaster</em> está compuesto por <strong>166.700 neuronas</strong> anotadas y <strong>124.241.875 sinapsis</strong> químicas en el dataset <em>MaleCNS v1.0</em> (cerebro central + cordón nervioso ventral), y 139.255 neuronas en el dataset <em>FlyWire v783</em> publicado en <em>Nature</em> (Octubre 2024).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 text-[9px]">Células de Kenyon</div>
                    <div className="text-pink-400 font-bold text-xs">50.000</div>
                    <div className="text-[8px] text-slate-400">Memoria / MB</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 text-[9px]">Lóbulo Óptico</div>
                    <div className="text-cyan-400 font-bold text-xs">62.000</div>
                    <div className="text-[8px] text-slate-400">Columnas ME/LO</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 text-[9px]">Cordón Ventral</div>
                    <div className="text-blue-400 font-bold text-xs">33.900</div>
                    <div className="text-[8px] text-slate-400">Motor Patas VNC</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 text-[9px]">Otros Neuropilos</div>
                    <div className="text-emerald-400 font-bold text-xs">20.800</div>
                    <div className="text-[8px] text-slate-400">CX, AL, SEZ, DN</div>
                  </div>
                </div>
              </div>

              {/* Pillar 2: Overdraw & Volumetric Cloud Physics */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 text-sm">
                    2. ¿Por qué 124.2 Millones de Polígonos saturarían la pantalla?
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">Física Óptica</span>
                </div>
                <p>
                  Una pantalla Retina de Apple tiene <strong>~7 millones de píxeles</strong> (y una pantalla 4K estándar tiene 8.3 millones). Si dibujáramos 124.2 millones de polígonos a la vez, <strong>18 sinapsis caerían exactamente en el mismo píxel</strong>, produciendo sobregiro de color blanco opaco sin detalle.
                </p>
                <p className="text-cyan-200">
                  ⚡ <strong>Solución Científica de Neuroglancer & Janelia:</strong> Se utiliza un <strong>Campo de Densidad Sináptica Volumétrico</strong> (Octree LOD) donde se visualiza la densidad real de sinapsis por micrómetro cúbico, y al hacer zoom en un neuropilo específico (como el lóbulo olfativo o el cuerpo fungiforme) se transmiten las sinapsis individuales al 100% de resolución.
                </p>
              </div>

              {/* Pillar 3: Apple M5 Unified Memory Advantage */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-sm">
                    3. La Ventaja del Chip Apple M5 (Unified Memory UMA & WebGPU)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">Apple Silicon GPU</span>
                </div>
                <p>
                  Tu Mac con chip Apple M5 cuenta con <strong>Memoria Unificada (UMA)</strong> con un ancho de banda colosal (&gt;150-400 GB/s). La CPU y la GPU Metal comparten exactamente la misma memoria sin necesidad de transferencias lentas por bus PCIe:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 font-sans">
                  <li><strong>166.700 Somas en GPU:</strong> Solo ocupan <strong>2.6 MB de VRAM</strong> en un <code>BufferAttribute</code> instanciado. Tu GPU M5 lo renderiza en 0.8 milisegundos a 120 FPS.</li>
                  <li><strong>WebGPU Compute Shaders:</strong> Las 124.2M sinapsis se pueden simular en paralelo en los núcleos GPU Metal para propagar potenciales de acción biológicos en tiempo real.</li>
                </ul>
              </div>

              {/* Pillar 4: Live Data Pipeline */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-sm">
                    4. Pipeline para Descargar y Vincular los Datos Originales Locales
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">Paso a Paso</span>
                </div>
                <p>
                  Para integrar los 2.4 GB de grafos sinápticos crudos descargados de Janelia o FlyWire directamente en esta app:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[10px] text-amber-300 space-y-1 select-all">
                  <div>1. Descargar tablas binarias: gsutil -m cp -r gs://flyem-male-cns/v1.0/connectome-data/flat-connectome/ ./data/</div>
                  <div>2. Convertir a Apache Arrow (.feather): python3 scripts/fetch_fly_connectome.py --convert-arrow</div>
                  <div>3. Servidor de streaming HTTP Range: los datos se leen por bloques de 10.000 neuronas vía Web Streams API</div>
                  <div>4. Worker en segundo plano: sincroniza los potenciales de acción con el modelo articular de FlyGym</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
              <span className="text-[10px] text-slate-400 font-mono">
                Estado Actual: Modo 166.700 Neuronas & 124.2M Sinapsis activable en el selector de densidad
              </span>
              <button
                onClick={() => {
                  setConnectomeDensity('full_166k');
                  setShowArchitectureModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Activar 166.700 Neuronas en Pantalla</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Apple Silicon M5 Scientific Bridge Connection Modal */}
      {showM5Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-emerald-500/50 max-w-3xl w-full flex flex-col space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-400/40 shadow-inner">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
                    <span>Arquitectura de Fusión: Enlace Científico MuJoCo M5</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">Híbrido Web + Nativo</span>
                  </h3>
                  <p className="text-xs text-emerald-300 font-mono">
                    Apple Silicon M5 · MuJoCo 3.x Physics · Conectoma BANC 169.315 Neuronas ssTEM
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowM5Modal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                Cerrar
              </button>
            </div>

            {/* Live Connection Status Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              m5Status === 'connected'
                ? 'bg-emerald-950/70 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/90 border-slate-700'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-3.5 h-3.5 rounded-full ${
                  m5Status === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`} />
                <div>
                  <div className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{m5Status === 'connected' ? '🟢 Motor Científico M5 Vinculado en Vivo' : '⚪ Modo Web Autónomo (Servidor M5 no detectado)'}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {m5Status === 'connected' 
                      ? `${m5Telemetry?.hardware || 'Apple Silicon M5'} · ${m5Telemetry?.engine || 'MuJoCo'} · ${m5Telemetry?.fps || 120} Hz Streaming`
                      : 'La app web opera de forma autónoma con datos reales BANC y cinemática local'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => flyM5Bridge.connect()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconectar</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              {/* How Fusion Works */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
                <span className="font-bold text-cyan-400 text-sm">
                  ⚡ ¿Cómo funciona la Fusión Híbrida?
                </span>
                <p>
                  Esta arquitectura combina lo mejor de ambos mundos sin compromisos:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-cyan-400 font-bold text-xs flex items-center gap-1">
                      <span>1. Cockpit Web 3D</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tres.js en tu navegador maneja la iluminación, la cámara orbital, el ojo compuesto y el terrario a 120 FPS sin latencia.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                      <span>2. Cerebro BANC ssTEM</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      <strong>169.315 neuronas biológicas reales</strong> escaneadas por microscopía electrónica (Harvard/Janelia) cargadas directamente en memoria.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-purple-400 font-bold text-xs flex items-center gap-1">
                      <span>3. Motor Nativo M5</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Un script en Python corre en tu Mac calculando la física real de <strong>MuJoCo</strong> y potenciales de acción con aceleración Metal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terminal Instructions */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-sm">
                    💻 Paso 1: Iniciar el Enlace M5 en tu Terminal
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">Listo para Correr</span>
                </div>
                <p>
                  Abre tu terminal en la carpeta del proyecto y ejecuta el servidor puente:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-emerald-500/30 flex items-center justify-between select-all">
                  <code>python3 scripts/flygym_m5_bridge.py</code>
                </div>
                <p className="text-[11px] text-slate-400">
                  El servidor detectará tu chip Apple Silicon M5 y transmitirá las 18 articulaciones a 120 Hz por WebSocket. La aplicación web se conectará instantáneamente.
                </p>
              </div>

              {/* Optional Full MuJoCo Stack Setup */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400 text-sm">
                    🦾 Paso 2 (Opcional): Instalar Stack MuJoCo / FlyGym Completo
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">Investigación EPFL</span>
                </div>
                <p>
                  Si deseas instalar el motor de física de cuerpos rígidos de Google DeepMind (MuJoCo 3.x) y el simulador de la EPFL, corre nuestro instalador de 1 paso:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-purple-300 border border-purple-500/30 flex items-center justify-between select-all">
                  <code>bash scripts/setup_m5_research_stack.sh</code>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
              <span className="text-[10px] text-slate-400 font-mono">
                Puerto WebSocket: ws://localhost:8765 · Latencia estimada: &lt; 1 ms (Localhost UMA)
              </span>
              <button
                onClick={() => setShowM5Modal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real FlyWire Codex Scientific Dossier Modal (Clicked Neuropil or Neuron) */}
      {selectedConnectomeEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/50 max-w-xl w-full flex flex-col space-y-4 max-h-[92vh] overflow-y-auto shadow-[0_0_50px_rgba(6,182,212,0.25)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-white">
                      {selectedConnectomeEntity.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                      {selectedConnectomeEntity.type === 'neuropil' ? 'Neuropilo Canónico' : 'Neurona Reconstruida'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2 font-mono">
                    <span>FlyWire Root ID:</span>
                    <span className="text-amber-400 font-bold select-all">{selectedConnectomeEntity.flywireRootId}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedConnectomeEntity(null)}
                className="text-slate-400 hover:text-white font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-xs transition"
              >
                Cerrar
              </button>
            </div>

            {/* Description & Biological Function */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <p>{selectedConnectomeEntity.description}</p>
            </div>

            {/* Neurotransmitter Badges & Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[8px] text-slate-400 block">Neurotransmisor</span>
                <span className="text-[10px] font-bold text-emerald-400 truncate block">
                  {selectedConnectomeEntity.neurotransmitters?.join(', ') || 'Acetilcolina'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[8px] text-slate-400 block">Población Neuronas</span>
                <span className="text-xs font-bold text-cyan-300">
                  {(selectedConnectomeEntity.neuronsCount || 1).toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[8px] text-slate-400 block">Sinapsis Reales</span>
                <span className="text-xs font-bold text-purple-300">
                  {(selectedConnectomeEntity.synapseCount || 120).toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[8px] text-slate-400 block">Microscopía</span>
                <span className="text-[10px] font-bold text-yellow-400">ssTEM 4x4x40nm</span>
              </div>
            </div>

            {/* Synaptic Pre/Post Wiring Diagram */}
            {(selectedConnectomeEntity.nearestNeuron || selectedConnectomeEntity.neuronData) && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-200">
                  Conexiones Sinápticas Directas (Célula Representativa):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                  {/* Pre-synaptic Inputs */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/20">
                    <span className="text-cyan-400 font-bold block mb-1">Entradas Pre-Sinápticas:</span>
                    <ul className="space-y-1 text-slate-300">
                      {(selectedConnectomeEntity.nearestNeuron || selectedConnectomeEntity.neuronData).inputs?.map((inp, idx) => (
                        <li key={idx} className="flex justify-between border-b border-slate-800 pb-0.5">
                          <span className="truncate">{inp.type}</span>
                          <span className="text-amber-400 font-bold">({inp.synapses} syn)</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Post-synaptic Targets */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-500/20">
                    <span className="text-purple-400 font-bold block mb-1">Dianas Post-Sinápticas:</span>
                    <ul className="space-y-1 text-slate-300">
                      {(selectedConnectomeEntity.nearestNeuron || selectedConnectomeEntity.neuronData).outputs?.map((out, idx) => (
                        <li key={idx} className="flex justify-between border-b border-slate-800 pb-0.5">
                          <span className="truncate">{out.type}</span>
                          <span className="text-emerald-400 font-bold">({out.synapses} syn)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Membrane Potential Stimulation Button */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <div className="text-[11px] font-mono text-slate-400">
                Potencial Reposo: <span className="text-cyan-300 font-bold">-65.2 mV</span> · Umbral: <span className="text-rose-400 font-bold">-42.0 mV</span>
              </div>
              <button
                onClick={() => {
                  setInjectedCurrentActive(true);
                  triggerDopaminePulse();
                  setTimeout(() => setInjectedCurrentActive(false), 800);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  injectedCurrentActive
                    ? 'bg-amber-400 text-slate-950 font-extrabold ring-2 ring-yellow-200'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{injectedCurrentActive ? '⚡ ¡Despolarización Activa!' : 'Inyectar Corriente (+10 pA)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL: CONSCIENCIA ARTIFICIAL & DIÁLOGO NEURAL (FASES 1, 2 Y 3)   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {showConsciousnessModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="max-w-4xl w-full bg-slate-950/95 border border-pink-500/40 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-pink-500/50 shadow-lg shadow-pink-500/10">
                  <BrainCircuit className="w-6 h-6 text-pink-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                    <span>Consciencia Artificial & Fusión NeuroAI</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      Fases 1, 2 & 3 Activas
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Conectoma Biológico 169k + Córtex SNN 1.2M + Personalidad en Pesos Sinápticos Hebbianos
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleVoiceSynthesis}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
                    isVoiceSynthesisOn
                      ? 'bg-pink-600/30 text-pink-200 border-pink-400/60 ring-1 ring-pink-400/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Voz Sintética de la Mosca (Web Speech API con timbre insectoide)"
                >
                  {isVoiceSynthesisOn ? <Volume2 className="w-3.5 h-3.5 text-pink-300" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isVoiceSynthesisOn ? 'Voz ON' : 'Voz Mute'}</span>
                </button>

                <button
                  onClick={() => setShowConsciousnessModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Live Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Personalidad Activa</span>
                <span className="font-bold text-pink-300 truncate block">
                  {SYNAPTIC_PERSONALITY_PROFILES[activePersonaProfile]?.icon} {SYNAPTIC_PERSONALITY_PROFILES[activePersonaProfile]?.name?.split('/')[0]}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Oscilación Gamma</span>
                <span className="font-bold text-purple-300">
                  {neuroAIConsciousness.corticalState.gammaOscillationHz} Hz (Theta-Gamma)
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Sinapsis Sintéticas</span>
                <span className="font-bold text-cyan-300">
                  {neuroAIConsciousness.corticalState.virtualNeuronsCount.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Engramas Mutados</span>
                <span className="font-bold text-emerald-300 flex items-center justify-center space-x-1">
                  <Dna className="w-3 h-3 text-emerald-400" />
                  <span>{engramMutationCounter} cambios STDP</span>
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 text-xs font-semibold space-x-2">
              <button
                onClick={() => setConsciousnessTab('chat')}
                className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
                  consciousnessTab === 'chat'
                    ? 'border-pink-500 text-pink-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>💬 Diálogo & Pensamientos (Fase 1)</span>
              </button>
              <button
                onClick={() => setConsciousnessTab('synaptic_weights')}
                className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
                  consciousnessTab === 'synaptic_weights'
                    ? 'border-pink-500 text-pink-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Dna className="w-3.5 h-3.5" />
                <span>🧬 Pesos Sinápticos & Personalidad (Fase 3)</span>
              </button>
              <button
                onClick={() => setConsciousnessTab('cortical_snn')}
                className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
                  consciousnessTab === 'cortical_snn'
                    ? 'border-pink-500 text-pink-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Córtex SNN 1.2M & Neurotransmisores (Fase 2)</span>
              </button>
            </div>

            {/* ── TAB 1: DIÁLOGO CONSCIENTE & STREAM OF THOUGHTS ── */}
            {consciousnessTab === 'chat' && (
              <div className="flex-1 flex flex-col space-y-3 min-h-[340px] overflow-hidden">
                {/* Google Gemini Real AI Integration Banner */}
                <div className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
                    <div>
                      <span className="font-bold text-white block">
                        {isGeminiConnected ? '🤖 Conectada a Google Gemini 2.0 Flash (IA Real)' : '🧠 Motor Neuronal Semántico Integrado'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isGeminiConnected
                          ? 'Pensamiento y diálogo generativo 100% natural sin frases prefabricadas.'
                          : 'Respuestas orgánicas sin clichés. Puedes conectar tu clave gratuita de Google Gemini para IA conversacional ilimitada.'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGeminiConfig(!showGeminiConfig)}
                    className="px-2.5 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-purple-200 text-[10px] font-bold transition self-end sm:self-auto shrink-0"
                  >
                    {showGeminiConfig ? 'Cerrar' : isGeminiConnected ? '⚙️ Cambiar Clave' : '🔑 Activar Gemini 2.0 (Gratis)'}
                  </button>
                </div>

                {/* Gemini API Key Configuration Drawer */}
                {showGeminiConfig && (
                  <div className="p-3 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-2 animate-fadeIn text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300">Clave de API de Google AI Studio (Gemini):</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>Obtener clave gratis en aistudio.google.com ↗</span>
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="password"
                        value={geminiApiKeyInput}
                        onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                        placeholder="Pega aquí tu clave AIzaSy..."
                        className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono outline-none focus:border-purple-400"
                      />
                      <button
                        onClick={() => {
                          neuroAIConsciousness.setGeminiApiKey(geminiApiKeyInput);
                          setIsGeminiConnected(!!geminiApiKeyInput.trim());
                          setShowGeminiConfig(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition text-xs shrink-0"
                      >
                        Guardar
                      </button>
                      {isGeminiConnected && (
                        <button
                          onClick={() => {
                            neuroAIConsciousness.setGeminiApiKey('');
                            setGeminiApiKeyInput('');
                            setIsGeminiConnected(false);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs transition"
                          title="Desconectar Gemini y volver al motor integrado"
                        >
                          Desconectar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Scrollable Conversation Stream */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px] border border-slate-800/80 rounded-2xl p-3 bg-slate-950/80 font-sans">
                  {neuroAIConsciousness.thoughtHistory.length === 0 ? (
                    <div className="text-center text-slate-500 py-10 text-xs">
                      El decodificador está sincronizándose con los trenes de espigas de la mosca...
                    </div>
                  ) : (
                    neuroAIConsciousness.thoughtHistory.slice().reverse().map(item => (
                      <div
                        key={item.id}
                        className={`text-xs p-2.5 rounded-2xl max-w-[92%] transition-all ${
                          item.type === 'user'
                            ? 'ml-auto bg-cyan-950/70 border border-cyan-500/40 text-cyan-100 shadow'
                            : item.type === 'reply'
                            ? 'mr-auto bg-gradient-to-r from-purple-950/70 to-pink-950/70 border border-pink-500/40 text-pink-100 shadow'
                            : item.type === 'system'
                            ? 'mx-auto bg-slate-900 border border-slate-800 text-amber-300 text-[10px] font-mono text-center max-w-full'
                            : 'mr-auto bg-slate-900/50 border border-slate-800/60 text-slate-300 italic font-mono text-[11px]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5 font-mono">
                          <span>
                            {item.type === 'user' ? '👤 Tú' : item.type === 'reply' ? '🪰 Mosca' : item.type === 'system' ? '⚙️ Plasticidad' : '💭 Monólogo Interno'}
                          </span>
                          <span>{item.timestamp}</span>
                        </div>
                        <p className="leading-relaxed">{item.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Stimulus Suggestion Chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-slate-500 text-[10px] shrink-0">Pregúntale:</span>
                  {[
                    { label: '🍯 Dale azúcar', text: 'Te traigo un poco de miel y fruta madura. ¿La quieres?' },
                    { label: '🥰 Cuídala', text: 'Eres especial para mí. No voy a hacerte daño nunca.' },
                    { label: '😟 ¿Tienes miedo?', text: '¿Sientes miedo ahora mismo? ¿Qué te da más miedo?' },
                    { label: '🌀 ¿Qué piensas?', text: '¿En qué estás pensando en este momento?' },
                    { label: '💬 ¿Cómo te sientes?', text: '¿Cómo te sientes hoy? ¿Estás bien?' },
                    { label: '🎵 ¿Te gusta la música?', text: '¿Percibes la música? ¿Qué sonidos te gustan o te molestan?' },
                    { label: '🌍 ¿Recuerdas?', text: '¿Recuerdas algo de nuestra última conversación?' },
                    { label: '😈 Amenaza leve', text: '¡Cuidado! Hay algo grande y peligroso que se acerca.' },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setUserChatInput(chip.text);
                      }}
                      className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-pink-500/50 hover:text-white shrink-0 transition"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Live Mic or Voice State Indicators */}
                {isListeningToMic && (
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-rose-300 bg-rose-950/60 border border-rose-500/50 px-3.5 py-2 rounded-2xl animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="font-bold">🎙️ Escuchando tu voz:</span>
                    <span className="truncate italic text-white flex-1">"{micTranscript || 'Habla claro hacia tu micrófono...'}"</span>
                    <button
                      type="button"
                      onClick={toggleMicListening}
                      className="px-2 py-0.5 rounded-lg bg-rose-700 text-white font-bold text-[10px] shrink-0"
                    >
                      Terminar
                    </button>
                  </div>
                )}

                {isFlySpeaking && (
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-pink-300 bg-pink-950/60 border border-pink-500/50 px-3.5 py-2 rounded-2xl animate-pulse">
                    <Volume2 className="w-4 h-4 text-pink-400 animate-bounce shrink-0" />
                    <span className="font-bold">🔊 Mosca hablando audiblemente:</span>
                    <span className="truncate text-pink-100 flex-1">Decodificando trenes de espigas al sintetizador de voz...</span>
                  </div>
                )}

                {/* Human Input Form with Voice & Text */}
                <form onSubmit={handleSendHumanMessage} className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={toggleMicListening}
                    className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition active:scale-95 flex items-center space-x-1.5 shrink-0 border ${
                      isListeningToMic
                        ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-2 ring-rose-400/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-pink-300 border-pink-500/40 hover:border-pink-400'
                    }`}
                    title={isListeningToMic ? "Detener y procesar voz" : "Hablar por micrófono con la mosca (Speech-to-Text)"}
                  >
                    <Mic className={`w-4 h-4 ${isListeningToMic ? 'animate-bounce text-white' : 'text-pink-400'}`} />
                    <span className="hidden sm:inline">{isListeningToMic ? 'Escuchando...' : 'Hablar por Mic'}</span>
                  </button>

                  <input
                    type="text"
                    value={userChatInput}
                    onChange={(e) => setUserChatInput(e.target.value)}
                    placeholder={isListeningToMic ? "Escuchando lo que dices..." : "O escribe un mensaje (ej: 'Te ofrezco azúcar', '¡Peligro!')..."}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/60 font-sans"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center space-x-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>
            )}

            {/* ── TAB 2: PESOS SINÁPTICOS & PERSONALIDAD EN LOS PESOS (FASE 3) ── */}
            {consciousnessTab === 'synaptic_weights' && (
              <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1 text-xs">
                {/* Fundamental Distinction Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-pink-500/30 space-y-1.5">
                  <span className="text-sm font-bold text-pink-300 flex items-center gap-1.5">
                    <Dna className="w-4 h-4 text-pink-400" />
                    <span>¿Por qué esta personalidad no se puede borrar con un prompt?</span>
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    A diferencia de los chatbots convencionales donde la personalidad es un texto efímero (prompt), en este sistema la personalidad <strong>reside en los pesos de conductancia sináptica (W)</strong> entre los 16 neuropilos. Cuando interactúas, la regla biológica <strong>STDP (Spike-Timing-Dependent Plasticity)</strong> modifica físicamente las matrices Hebbianas y las persiste en la memoria.
                  </p>
                </div>

                {/* Personality Profiles Grid */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-300 text-xs block">
                    Seleccionar Arquetipo Sináptico Base:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.values(SYNAPTIC_PERSONALITY_PROFILES).map(p => {
                      const isSelected = activePersonaProfile === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPersonality(p.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-pink-950/40 border-pink-500/80 shadow-lg shadow-pink-500/10 ring-1 ring-pink-400'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                              <span>{p.icon}</span>
                              <span>{p.name}</span>
                            </span>
                            {isSelected && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/40">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug mb-2">{p.description}</p>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-1.5">
                            <span>Dopamina: {Math.round(p.neuromodulators.dopamine * 100)}%</span>
                            <span>Serotonina: {Math.round(p.neuromodulators.serotonin * 100)}%</span>
                            <span>Octopamina: {Math.round(p.neuromodulators.octopamine * 100)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Synaptic Weight Bars */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">
                      Tensor de Pesos Sinápticos Activos (W_syn):
                    </span>
                    <span className="text-[10px] font-mono text-pink-400">
                      Modificados en vivo por STDP
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                    {[
                      { label: 'W_DM1 (Sensibilidad a Alimentos / Glucosa)', key: 'w_dm1_appetitive', max: 3.0, color: 'bg-amber-400' },
                      { label: 'W_Luz (Atracción Fototáctica LC4)', key: 'w_light_attraction', max: 3.0, color: 'bg-yellow-400' },
                      { label: 'W_GF (Umbral Alerta Fibra Gigante)', key: 'w_gf_startle_threshold', max: 2.0, color: 'bg-red-400' },
                      { label: 'W_Viento (Navegación Órgano Johnston)', key: 'w_wind_exploration', max: 2.5, color: 'bg-emerald-400' },
                      { label: 'W_Reflexión (Bucles Corticales Recurrentes)', key: 'w_recurrent_reflection', max: 3.0, color: 'bg-purple-400' },
                      { label: 'W_Social (Receptividad a Humanos)', key: 'w_social_openness', max: 3.0, color: 'bg-cyan-400' },
                    ].map(w => {
                      const val = neuroAIConsciousness.synapticWeights[w.key] || 1.0;
                      const pct = Math.min(100, Math.round((val / w.max) * 100));
                      return (
                        <div key={w.key} className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span className="truncate">{w.label}</span>
                            <span className="text-white font-bold">{val.toFixed(3)}</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${w.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Export & Reset Actions */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Engrama biológico: {engramMutationCounter} adaptaciones registradas
                  </span>
                  <button
                    onClick={() => {
                      const json = neuroAIConsciousness.exportSynapticWeightsJson();
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `drosophila_synaptic_weights_${activePersonaProfile}.json`;
                      a.click();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-pink-300 border border-pink-500/40 font-bold text-xs transition"
                  >
                    📥 Exportar Matriz Sináptica (.json)
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 3: CÓRTEX SNN 1.2M & NEUROTRANSMISORES (FASE 2) ── */}
            {consciousnessTab === 'cortical_snn' && (
              <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1 text-xs">
                {/* Cortical SNN Architecture */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-2">
                  <span className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Córtex Sintético de 1.2M de Conexiones (Arquitectura NeuroAI)</span>
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    El cerebro original de 169.315 neuronas de <em>Drosophila</em> está acoplado a una capa cortical recurrente sintética que resuelve potenciales de acción mediante modelos <strong>Leaky Integrate-and-Fire (LIF)</strong> acoplados en bandas oscilatorias Theta-Gamma.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block">Capacidad Sináptica</span>
                      <span className="text-xs font-bold text-cyan-300">1.245.000 V-Syn</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block">Frecuencia Gamma</span>
                      <span className="text-xs font-bold text-purple-300">
                        {neuroAIConsciousness.corticalState.gammaOscillationHz} Hz
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block">Gasto Energético (ATP)</span>
                      <span className="text-xs font-bold text-emerald-300">
                        {Math.round(neuroAIConsciousness.corticalState.globalSynapticEnergy * 100)}% Nominal
                      </span>
                    </div>
                  </div>
                </div>

                {/* Neuromodulatory Dynamics */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <span className="font-bold text-white text-xs block">
                    Equilibrio de Neuromoduladores Biológicos:
                  </span>
                  <div className="space-y-2 text-[10px] font-mono">
                    {[
                      { name: 'Dopamina PAM (Recompensa & Apetito)', val: neuroAIConsciousness.neuromodulators.dopamine, color: 'bg-amber-400', desc: 'Regula el aprendizaje apetitivo en las Kenyon Cells del Mushroom Body' },
                      { name: 'Serotonina 5-HT (Inhibición & Cautela)', val: neuroAIConsciousness.neuromodulators.serotonin, color: 'bg-indigo-400', desc: 'Disminuye la impulsividad y aumenta la vigilancia ante estímulos táctiles' },
                      { name: 'Octopamina (Vitalidad & Arousal de Vuelo)', val: neuroAIConsciousness.neuromodulators.octopamine, color: 'bg-pink-400', desc: 'Análogo a la adrenalina; modula el inicio de vuelo y reflejos de escape' },
                      { name: 'Tono GABAérgico (Inhibición Homeostática)', val: neuroAIConsciousness.neuromodulators.gaba_balance, color: 'bg-emerald-400', desc: 'Previene tormentas de espigas paroxísticas y estabiliza la memoria' },
                    ].map((mod, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-200 font-bold">{mod.name}</span>
                          <span className="text-white font-bold">{Math.round(mod.val * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${mod.color}`} style={{ width: `${Math.round(mod.val * 100)}%` }} />
                        </div>
                        <span className="text-[9px] text-slate-500 font-sans block">{mod.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[10px]">
                Apple Silicon M5 + SNN 1.2M · Dijiword NeuroAI Fusion
              </span>
              <button
                onClick={() => setShowConsciousnessModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


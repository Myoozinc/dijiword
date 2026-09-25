import React, { useEffect, useRef, useState } from 'react';
import { 
  Camera, 
  FlipHorizontal, 
  Zap, 
  ZapOff, 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  Info, 
  Box, 
  Scan,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SpatialEngine } from '../services/spatialEngine';
import { AIVisionDetector } from '../services/aiVisionDetector';
import { SpatialObjectManager } from '../services/spatialObjectManager';

export function CameraScanner({ onCompleteScan, onLoadPreset }) {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const engineRef = useRef(null);
  const aiDetectorRef = useRef(null);
  const spatialManagerRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [pointCount, setPointCount] = useState(0);
  const [currentFrameDetections, setCurrentFrameDetections] = useState([]);
  const [anchoredObjects, setAnchoredObjects] = useState([]);
  const [keyframeList, setKeyframeList] = useState([]);
  const [needsSensorPermission, setNeedsSensorPermission] = useState(false);
  
  const [coverage, setCoverage] = useState({
    floor: 0,
    ceiling: 0,
    north: 0,
    south: 0,
    east: 0,
    west: 0,
    total: 0
  });
  const [angles, setAngles] = useState({ pitch: 0, roll: 0, yaw: 0 });
  const [guidanceMsg, setGuidanceMsg] = useState('Apunta la cámara para mapear el espacio, objetos y texturas');

  // Initialize Engines
  useEffect(() => {
    engineRef.current = new SpatialEngine();
    aiDetectorRef.current = new AIVisionDetector();
    spatialManagerRef.current = new SpatialObjectManager();
    aiDetectorRef.current.loadModel();

    // Check if iOS needs manual gesture for sensor permission
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      setNeedsSensorPermission(true);
    }

    return () => {
      if (engineRef.current) engineRef.current.stopCamera();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleRequestSensors = async () => {
    if (engineRef.current) {
      const granted = await engineRef.current.requestSensors();
      if (granted) setNeedsSensorPermission(false);
    }
  };

  // Start Camera Stream
  const startCameraStream = async () => {
    try {
      setCameraError(null);
      if (videoRef.current && engineRef.current) {
        await engineRef.current.startCamera(videoRef.current, facingMode);
        setCameraActive(true);
        startCVLoop();
      }
    } catch (err) {
      console.error('Camera init error:', err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? 'Permiso de cámara denegado. Permite el acceso a la cámara en los ajustes del navegador.' 
          : 'No se pudo acceder a la cámara. Asegúrate de usar HTTPS en móvil o prueba con las Demos 3D.'
      );
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCameraStream();
  }, [facingMode]);

  // Main CV & AI loop
  const startCVLoop = () => {
    const loop = async () => {
      if (engineRef.current && overlayCanvasRef.current && videoRef.current) {
        const result = engineRef.current.processFrame();
        
        let rawDetections = [];
        if (aiDetectorRef.current && videoRef.current.readyState >= 2) {
          rawDetections = await aiDetectorRef.current.detectFrame(
            videoRef.current, 
            null, 
            engineRef.current.deviceAngle
          );
          
          if (rawDetections.length > 0) {
            setCurrentFrameDetections(rawDetections);
            
            // Integrate into persistent spatial world anchors
            if (spatialManagerRef.current) {
              const prevCount = spatialManagerRef.current.getAnchors(2).length;
              spatialManagerRef.current.integrateDetections(rawDetections);
              const confirmedAnchors = spatialManagerRef.current.getAnchors(2);
              setAnchoredObjects([...confirmedAnchors]);

              // Haptic vibrate when a brand-new confirmed object is anchored
              if (confirmedAnchors.length > prevCount && navigator.vibrate) {
                try { navigator.vibrate(35); } catch (e) {}
              }
            }
          }
        }

        if (result) {
          setPointCount(result.pointCount);
          setCoverage({ ...result.coverage });
          setAngles({ ...result.angles });

          // Render AR Overlays with tracking points and object bounding boxes
          drawAROverlay(result.features, result.angles, rawDetections);
          updateGuidance(result.coverage, rawDetections);
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
  };

  const updateGuidance = (cov, rawDetections) => {
    const totalAnchored = spatialManagerRef.current ? spatialManagerRef.current.getAnchors(2).length : 0;

    if (rawDetections.length > 0) {
      setGuidanceMsg(`🎯 Fijando en 3D: ${rawDetections[0].label} (${rawDetections[0].depth}m)`);
    } else if (cov.floor < 25) {
      setGuidanceMsg('Apunta hacia el suelo para calibrar el plano base y texturas...');
    } else if (cov.north < 35 && cov.east < 35) {
      setGuidanceMsg('Recorre despacio las paredes y muebles del espacio...');
    } else if (totalAnchored >= 4) {
      setGuidanceMsg(`✨ ${totalAnchored} objetos anclados. Pulsa "Simular 3D" cuando desees.`);
    } else {
      setGuidanceMsg('Gira en 360° para capturar todos los muebles y esquinas.');
    }
  };

  // Draw AR Overlays
  const drawAROverlay = (features, devAngles, rawDetections = []) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Draw 3D Feature Tracking points
    features.forEach(f => {
      const px = f.x * w;
      const py = f.y * h;
      
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = isScanning ? 'rgba(6, 182, 212, 0.45)' : 'rgba(16, 185, 129, 0.4)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isScanning ? '#22d3ee' : '#34d399';
      ctx.fill();
    });

    // 2. Draw AI Detected Objects Bounding Boxes
    rawDetections.forEach(obj => {
      const [bx, by, bw, bh] = obj.normBbox;
      const x = bx * w;
      const y = by * h;
      const boxW = bw * w;
      const boxH = bh * h;

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;

      const cornerLen = Math.min(22, boxW * 0.25, boxH * 0.25);

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLen, y);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(x + boxW - cornerLen, y);
      ctx.lineTo(x + boxW, y);
      ctx.lineTo(x + boxW, y + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(x, y + boxH - cornerLen);
      ctx.lineTo(x, y + boxH);
      ctx.lineTo(x + cornerLen, y + boxH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(x + boxW - cornerLen, y + boxH);
      ctx.lineTo(x + boxW, y + boxH);
      ctx.lineTo(x + boxW, y + cornerLen);
      ctx.stroke();

      // Glassmorphic Label Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      const labelText = `${obj.icon || '📦'} ${obj.label} • ${obj.depth}m`;
      ctx.font = 'bold 12px system-ui';
      const textMetrics = ctx.measureText(labelText);
      const bgW = textMetrics.width + 18;
      const bgH = 22;

      ctx.beginPath();
      ctx.roundRect(x, Math.max(0, y - bgH - 6), bgW, bgH, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x + 8, Math.max(16, y - 10));
    });

    // 3. Artificial Horizon
    const roll = devAngles.roll || 0;
    const pitch = devAngles.pitch || 0;
    const centerY = h / 2 + (pitch / (Math.PI / 2)) * (h / 3);

    ctx.save();
    ctx.translate(w / 2, centerY);
    ctx.rotate(roll);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, 0);
    ctx.lineTo(w * 0.28, 0);
    ctx.stroke();

    ctx.restore();
  };

  const toggleScan = () => {
    if (!engineRef.current) return;
    const nextState = !isScanning;
    engineRef.current.isScanning = nextState;
    setIsScanning(nextState);

    if (nextState && keyframeList.length === 0) {
      handleCaptureKeyframe();
    }
  };

  const handleCaptureKeyframe = () => {
    if (!engineRef.current) return;
    const kf = engineRef.current.captureKeyframe();
    if (kf) {
      setKeyframeList(prev => [...prev, kf]);
    }
  };

  const handleToggleTorch = async () => {
    if (!engineRef.current) return;
    const nextTorch = !torchOn;
    const success = await engineRef.current.toggleTorch(nextTorch);
    if (success) setTorchOn(nextTorch);
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.resetScan();
      if (spatialManagerRef.current) spatialManagerRef.current.reset();
      setPointCount(0);
      setKeyframeList([]);
      setCurrentFrameDetections([]);
      setAnchoredObjects([]);
      setCoverage({ floor: 0, ceiling: 0, north: 0, south: 0, east: 0, west: 0, total: 0 });
      setIsScanning(false);
    }
  };

  const handleFinishScan = () => {
    if (!engineRef.current) return;
    engineRef.current.isScanning = false;
    setIsScanning(false);

    const bounds = engineRef.current.computeRoomBounds();
    const points = [...engineRef.current.points];
    const keyframes = [...engineRef.current.keyframes];
    const finalAnchors = spatialManagerRef.current ? spatialManagerRef.current.getAnchors() : [];

    onCompleteScan({
      id: `scan_${Date.now()}`,
      name: `Mapeo ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      bounds,
      points,
      keyframes,
      aiDetectedObjects: finalAnchors,
      timestamp: Date.now()
    });
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-black overflow-hidden select-none">
      {/* Background Video Camera Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* AR Tracking Canvas Overlay */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Cyber Scanning Grid Overlay */}
      <div className={`absolute inset-0 scan-grid pointer-events-none z-10 transition-opacity duration-500 ${isScanning ? 'opacity-40' : 'opacity-10'}`} />

      {/* Scanning laser animation */}
      {isScanning && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan-line pointer-events-none z-15" />
      )}

      {/* Top Header Bar with Safe Area Inset for Notch / Dynamic Island */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center space-x-1.5">
              <span>DijiWord Spatial</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-300 font-medium">Mapeador AR & Memoria 3D</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {needsSensorPermission && (
            <button
              onClick={handleRequestSensors}
              className="px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-amber-500 text-black shadow-lg animate-pulse"
              title="Permiso de Giroscopio en iOS"
            >
              Giroscopio
            </button>
          )}

          <button
            onClick={handleToggleTorch}
            className={`p-2 rounded-full glass-btn ${torchOn ? 'text-amber-300 bg-amber-500/30' : 'text-slate-300'}`}
            title="Flash"
          >
            {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
          </button>

          <button
            onClick={handleFlipCamera}
            className="p-2 rounded-full glass-btn text-slate-300"
            title="Cambiar Cámara"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onLoadPreset}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/80 to-purple-600/80 text-white border border-white/20 shadow-lg flex items-center space-x-1 active:scale-95 transition-transform"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Demos</span>
          </button>
        </div>
      </div>

      {/* Floating Guidance HUD Banner */}
      {!cameraError && (
        <div className="relative z-20 mx-4 mt-1">
          <div className="glass-pill px-3 py-1.5 rounded-full flex items-center justify-between border border-cyan-500/20">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              <p className="text-xs font-medium text-slate-200 truncate max-w-[240px] sm:max-w-md">
                {guidanceMsg}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-mono font-bold text-cyan-300">
              {anchoredObjects.length} guardados
            </span>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {cameraError && (
        <div className="relative z-30 mx-4 my-auto p-5 rounded-2xl glass-panel border border-red-500/30 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Acceso a la Cámara</h3>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">{cameraError}</p>
          <div className="flex flex-col space-y-2">
            <button
              onClick={startCameraStream}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
            >
              Reintentar Conexión
            </button>
            <button
              onClick={onLoadPreset}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-cyan-400 font-semibold text-xs border border-cyan-500/30"
            >
              Cargar Espacio 3D de Demostración
            </button>
          </div>
        </div>
      )}

      {/* Real-time Telemetry Dock with Safe Area Bottom */}
      <div className="mt-auto relative z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col space-y-2.5">
        {/* Persistent Spatial Objects Memory Bar */}
        <div className="glass-panel p-2.5 rounded-2xl flex flex-col space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>Memoria Espacial ({anchoredObjects.length})</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {pointCount.toLocaleString()} pts 3D
            </span>
          </div>

          {/* Horizontal scroll of all anchored objects in room */}
          {anchoredObjects.length === 0 ? (
            <div className="text-[10px] text-slate-400 py-1">
              Rastrea sofás, camas, mesas, sillas, pantallas, plantas o personas...
            </div>
          ) : (
            <div className="flex space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {anchoredObjects.map((obj) => (
                <div
                  key={obj.id}
                  className="px-2 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 whitespace-nowrap flex items-center space-x-1 text-[11px]"
                >
                  <span>{obj.icon || '📦'}</span>
                  <span className="font-semibold text-white">{obj.label}</span>
                  <span className="text-[9px] text-cyan-400/80">({obj.size3D.width}×{obj.size3D.depth}m)</span>
                </div>
              ))}
            </div>
          )}

          {/* Mini Sector Progress */}
          <div className="grid grid-cols-6 gap-1 text-[9px] text-center font-mono pt-1">
            <div className={`p-0.5 rounded border ${coverage.floor > 40 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              Suelo {Math.round(coverage.floor)}%
            </div>
            <div className={`p-0.5 rounded border ${coverage.north > 40 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              Norte {Math.round(coverage.north)}%
            </div>
            <div className={`p-0.5 rounded border ${coverage.east > 40 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              Este {Math.round(coverage.east)}%
            </div>
            <div className={`p-0.5 rounded border ${coverage.south > 40 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              Sur {Math.round(coverage.south)}%
            </div>
            <div className={`p-0.5 rounded border ${coverage.west > 40 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              Oeste {Math.round(coverage.west)}%
            </div>
            <div className={`p-0.5 rounded border ${coverage.ceiling > 40 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              Techo {Math.round(coverage.ceiling)}%
            </div>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center justify-between space-x-2.5">
          <button
            onClick={handleReset}
            disabled={pointCount === 0 && anchoredObjects.length === 0}
            className={`p-3 rounded-2xl glass-btn text-slate-300 ${pointCount === 0 && anchoredObjects.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:text-red-400'}`}
            title="Reiniciar"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleScan}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-xl transition-all duration-200 active:scale-95 ${
              isScanning
                ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-red-500/30 ring-2 ring-red-400/50'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-cyan-500/30'
            }`}
          >
            {isScanning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pausar Mapeo</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{pointCount > 0 ? 'Reanudar Mapeo' : 'Iniciar Mapeo AR'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleCaptureKeyframe}
            className="p-3 rounded-2xl glass-btn text-cyan-400 hover:text-cyan-300"
            title="Foto Clave"
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            onClick={handleFinishScan}
            disabled={pointCount < 10 && anchoredObjects.length === 0}
            className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 ${
              pointCount >= 10 || anchoredObjects.length > 0
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Simulación 3D"
          >
            <Eye className="w-4 h-4" />
            <span>Simular 3D</span>
          </button>
        </div>
      </div>
    </div>
  );
}

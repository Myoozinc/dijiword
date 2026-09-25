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
  User,
  Tv,
  Scan
} from 'lucide-react';
import { SpatialEngine } from '../services/spatialEngine';
import { AIVisionDetector } from '../services/aiVisionDetector';

export function CameraScanner({ onCompleteScan, onLoadPreset }) {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const engineRef = useRef(null);
  const aiDetectorRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [pointCount, setPointCount] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [keyframeList, setKeyframeList] = useState([]);
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
  const [guidanceMsg, setGuidanceMsg] = useState('Apunta la cámara para detectar objetos, texturas y profundidad');

  // Initialize SpatialEngine and AI Detector
  useEffect(() => {
    engineRef.current = new SpatialEngine();
    aiDetectorRef.current = new AIVisionDetector();
    aiDetectorRef.current.loadModel(); // Background load COCO-SSD

    return () => {
      if (engineRef.current) engineRef.current.stopCamera();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Start Camera
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
          : 'No se pudo acceder a la cámara. Puedes probar en tu móvil con HTTPS o cargar una simulación de ejemplo.'
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
        
        let aiObjs = [];
        if (aiDetectorRef.current && videoRef.current.readyState >= 2) {
          aiObjs = await aiDetectorRef.current.detectFrame(
            videoRef.current, 
            null, 
            engineRef.current.deviceAngle
          );
          if (aiObjs.length > 0) {
            setDetectedObjects(aiObjs);
          }
        }

        if (result) {
          setPointCount(result.pointCount);
          setCoverage({ ...result.coverage });
          setAngles({ ...result.angles });

          // Render AR Overlays with AI Bounding Boxes & Features
          drawAROverlay(result.features, result.angles, aiObjs);
          updateGuidance(result.coverage, aiObjs);
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
  };

  const updateGuidance = (cov, aiObjs) => {
    if (aiObjs.length > 0) {
      setGuidanceMsg(`🎯 Detectado: ${aiObjs.map(o => o.label).slice(0, 2).join(', ')} (${aiObjs[0].depth}m)`);
    } else if (cov.floor < 30) {
      setGuidanceMsg('Apunta hacia el suelo para calibrar el plano base y texturas...');
    } else if (cov.north < 40 && cov.east < 40) {
      setGuidanceMsg('Gira lentamente hacia las paredes y objetos del espacio...');
    } else if (cov.total > 60) {
      setGuidanceMsg('¡Espacio y objetos listos! Pulsa "Simular 3D" para entrar.');
    }
  };

  // Draw AR Overlays
  const drawAROverlay = (features, devAngles, aiObjs = []) => {
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
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isScanning ? 'rgba(6, 182, 212, 0.4)' : 'rgba(16, 185, 129, 0.4)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isScanning ? '#22d3ee' : '#34d399';
      ctx.fill();
    });

    // 2. Draw AI Detected Objects Bounding Boxes & Tags
    aiObjs.forEach(obj => {
      const [bx, by, bw, bh] = obj.normBbox;
      const x = bx * w;
      const y = by * h;
      const boxW = bw * w;
      const boxH = bh * h;

      // Cyan / Emerald corner brackets
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;

      const cornerLen = Math.min(20, boxW * 0.25, boxH * 0.25);

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
      ctx.lineTo(x + boxW, y + boxH - cornerLen);
      ctx.stroke();

      // Label Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      const labelText = `${obj.label} ${obj.score}% • ${obj.depth}m`;
      ctx.font = 'bold 11px system-ui';
      const textMetrics = ctx.measureText(labelText);
      const bgW = textMetrics.width + 16;
      const bgH = 20;

      ctx.beginPath();
      ctx.roundRect(x, Math.max(0, y - bgH - 4), bgW, bgH, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#22d3ee';
      ctx.fillText(labelText, x + 8, Math.max(14, y - 8));
    });

    // 3. Artificial Horizon
    const roll = devAngles.roll || 0;
    const pitch = devAngles.pitch || 0;
    const centerY = h / 2 + (pitch / (Math.PI / 2)) * (h / 3);

    ctx.save();
    ctx.translate(w / 2, centerY);
    ctx.rotate(roll);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, 0);
    ctx.lineTo(w * 0.3, 0);
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
      setPointCount(0);
      setKeyframeList([]);
      setDetectedObjects([]);
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

    onCompleteScan({
      id: `scan_${Date.now()}`,
      name: `Mapeo ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      bounds,
      points,
      keyframes,
      aiDetectedObjects: detectedObjects,
      timestamp: Date.now()
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden select-none">
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

      {/* Laser Scanning Line Animation */}
      {isScanning && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan-line pointer-events-none z-15" />
      )}

      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center space-x-1.5">
              <span>DijiWord AI Vision</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-300 font-medium">Objetos • Texturas • Profundidad</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleTorch}
            className={`p-2 rounded-full glass-btn ${torchOn ? 'text-amber-300 bg-amber-500/30' : 'text-slate-300'}`}
            title="Linterna / Flash"
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
            <span>Demos 3D</span>
          </button>
        </div>
      </div>

      {/* Camera Error / Permission Fallback */}
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
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
            >
              Reintentar Conexión
            </button>
            <button
              onClick={onLoadPreset}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs border border-cyan-500/30 transition"
            >
              Cargar Espacio 3D de Ejemplo
            </button>
          </div>
        </div>
      )}

      {/* Floating Guidance HUD Banner */}
      {!cameraError && (
        <div className="relative z-20 mx-4 mt-1">
          <div className="glass-pill px-3 py-1.5 rounded-full flex items-center justify-between border border-cyan-500/20">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              <p className="text-xs font-medium text-slate-200 truncate max-w-[260px] sm:max-w-md">
                {guidanceMsg}
              </p>
            </div>
            {detectedObjects.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-bold text-cyan-300">
                {detectedObjects.length} obj
              </span>
            )}
          </div>
        </div>
      )}

      {/* Real-time Telemetry Cards */}
      <div className="mt-auto relative z-20 px-4 pb-4 flex flex-col space-y-3">
        {/* Coverage & AI Detections Pills */}
        <div className="glass-panel p-3 rounded-2xl flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mapeo y Texturas</span>
            </div>
            <div className="text-xs font-mono text-cyan-400 font-bold">
              {pointCount.toLocaleString()} pts 3D
            </div>
          </div>

          {/* AI Detected Objects Live Chips */}
          {detectedObjects.length > 0 && (
            <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              {detectedObjects.slice(0, 5).map((obj) => (
                <div
                  key={obj.id}
                  className="px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 whitespace-nowrap flex items-center space-x-1"
                >
                  <Box className="w-3 h-3 text-cyan-400" />
                  <span>{obj.label}</span>
                  <span className="text-[10px] text-slate-400">({obj.depth}m)</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress Mini Grid */}
          <div className="grid grid-cols-6 gap-1.5 text-[10px] text-center font-mono">
            <div className={`p-1 rounded-lg border ${coverage.floor > 50 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              <div className="text-[9px] text-slate-400 uppercase">Suelo</div>
              <div>{Math.round(coverage.floor)}%</div>
            </div>
            <div className={`p-1 rounded-lg border ${coverage.north > 50 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              <div className="text-[9px] text-slate-400 uppercase">Norte</div>
              <div>{Math.round(coverage.north)}%</div>
            </div>
            <div className={`p-1 rounded-lg border ${coverage.east > 50 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              <div className="text-[9px] text-slate-400 uppercase">Este</div>
              <div>{Math.round(coverage.east)}%</div>
            </div>
            <div className={`p-1 rounded-lg border ${coverage.south > 50 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              <div className="text-[9px] text-slate-400 uppercase">Sur</div>
              <div>{Math.round(coverage.south)}%</div>
            </div>
            <div className={`p-1 rounded-lg border ${coverage.west > 50 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              <div className="text-[9px] text-slate-400 uppercase">Oeste</div>
              <div>{Math.round(coverage.west)}%</div>
            </div>
            <div className={`p-1 rounded-lg border ${coverage.ceiling > 50 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
              <div className="text-[9px] text-slate-400 uppercase">Techo</div>
              <div>{Math.round(coverage.ceiling)}%</div>
            </div>
          </div>
        </div>

        {/* Primary Controls Dock */}
        <div className="flex items-center justify-between space-x-3">
          <button
            onClick={handleReset}
            disabled={pointCount === 0}
            className={`p-3.5 rounded-2xl glass-btn text-slate-300 ${pointCount === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:text-red-400'}`}
            title="Reiniciar Escaneo"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Main Scan Trigger Toggle Button */}
          <button
            onClick={toggleScan}
            className={`flex-1 py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-xl transition-all duration-300 active:scale-95 ${
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
                <span>{pointCount > 0 ? 'Reanudar Mapeo' : 'Iniciar Mapeo Espacial'}</span>
              </>
            )}
          </button>

          {/* Manual Snapshot */}
          <button
            onClick={handleCaptureKeyframe}
            className="p-3.5 rounded-2xl glass-btn text-cyan-400 hover:text-cyan-300"
            title="Capturar Foto Clave"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Finish & View 3D Simulation */}
          <button
            onClick={handleFinishScan}
            disabled={pointCount < 10 && detectedObjects.length === 0}
            className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center space-x-1.5 transition-all duration-300 active:scale-95 ${
              pointCount >= 10 || detectedObjects.length > 0
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Generar Simulación 3D"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Simular 3D</span>
          </button>
        </div>
      </div>
    </div>
  );
}

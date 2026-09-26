import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Camera, Eye, Info, Scan, Sparkles, AlertTriangle, Box, Home
} from 'lucide-react';
import { Xr8SpatialEngine } from '../services/xr8Engine';
import { RoomReconstruction } from '../services/roomReconstruction';
import { AIVisionDetector } from '../services/aiVisionDetector';
import { SpatialObjectManager } from '../services/spatialObjectManager';

/**
 * Real AR room scanner backed by the free, open-source 8th Wall engine
 * (genuine SLAM/VIO tracking — works in Safari on iPhone, unlike WebXR).
 *
 * If XR8 fails to boot (unsupported browser, no camera, blocked script,
 * desktop without camera, etc.) this calls onUnsupported() so the parent
 * can fall back to the heuristic <CameraScanner /> instead of showing a
 * broken screen.
 */
export function Xr8RoomScanner({ onCompleteScan, onLoadPreset, onUnsupported, onOpenFlyConnectome, onBackToLobby }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const aiDetectorRef = useRef(null);
  const spatialManagerRef = useRef(null);

  const [phase, setPhase] = useState('idle'); // idle | starting | running | error
  const [errorMsg, setErrorMsg] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pointCount, setPointCount] = useState(0);
  const [coverage, setCoverage] = useState({ floor: 0, ceiling: 0, north: 0, south: 0, east: 0, west: 0, total: 0 });
  const [trackingStatus, setTrackingStatus] = useState('INITIALIZING');
  const [keyframeCount, setKeyframeCount] = useState(0);
  const [anchoredObjects, setAnchoredObjects] = useState([]);

  useEffect(() => {
    engineRef.current = new Xr8SpatialEngine();
    aiDetectorRef.current = new AIVisionDetector();
    aiDetectorRef.current.loadModel().catch(e => console.warn('AI Detector load warn:', e));
    spatialManagerRef.current = new SpatialObjectManager();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (engineRef.current) engineRef.current.stopCamera();
    };
  }, []);

  // Must be triggered by a direct tap (iOS requires a user gesture for
  // camera + motion sensor permission prompts).
  const handleStart = async () => {
    if (!canvasRef.current || !engineRef.current) return;
    setPhase('starting');
    setErrorMsg(null);
    try {
      await engineRef.current.startCamera(canvasRef.current, 'environment');
      engineRef.current.isScanning = true;
      setIsScanning(true);
      setPhase('running');
      loop();
    } catch (err) {
      console.error('XR8 boot failed:', err);
      setErrorMsg(err && err.message ? err.message : 'No se pudo iniciar el motor AR.');
      setPhase('error');
      if (onUnsupported) onUnsupported(err);
    }
  };

  const loop = () => {
    let lastAIDetectTime = 0;
    const tick = (now) => {
      const engine = engineRef.current;
      if (engine) {
        const result = engine.processFrame();
        setPointCount(result.pointCount);
        setCoverage({ ...result.coverage });
        setTrackingStatus(result.trackingStatus);

        // Run AI neural vision object detection periodically on the real camera canvas
        if (now - lastAIDetectTime > 380 && aiDetectorRef.current && canvasRef.current && engine.isScanning) {
          lastAIDetectTime = now;
          aiDetectorRef.current.detectFrame(canvasRef.current, null, engine.deviceAngle)
            .then(detections => {
              if (detections && detections.length > 0 && spatialManagerRef.current) {
                spatialManagerRef.current.integrateDetections(detections);
                const confirmed = spatialManagerRef.current.getAnchors(1);
                setAnchoredObjects([...confirmed]);
              }
            })
            .catch(() => {});
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const toggleScan = () => {
    if (!engineRef.current) return;
    const next = !isScanning;
    engineRef.current.isScanning = next;
    setIsScanning(next);
    if (next && keyframeCount === 0) handleCaptureKeyframe();
  };

  const handleCaptureKeyframe = () => {
    if (!engineRef.current) return;
    const kf = engineRef.current.captureKeyframe();
    if (kf) setKeyframeCount(prev => prev + 1);
  };

  const handleReset = () => {
    if (!engineRef.current) return;
    engineRef.current.resetScan();
    spatialManagerRef.current?.reset();
    setAnchoredObjects([]);
    setPointCount(0);
    setKeyframeCount(0);
    setCoverage({ floor: 0, ceiling: 0, north: 0, south: 0, east: 0, west: 0, total: 0 });
    setIsScanning(false);
  };

  const handleFinishScan = () => {
    if (!engineRef.current) return;
    engineRef.current.isScanning = false;
    setIsScanning(false);

    const bounds = engineRef.current.computeRoomBounds();
    let points = [...engineRef.current.points];
    const keyframes = [...engineRef.current.keyframes];
    const finalAnchors = spatialManagerRef.current ? spatialManagerRef.current.getAnchors(1) : [];

    // If point count is low (e.g. tracking just started or bare walls), supplement with procedural points
    // so the 3D room simulation has a full volumetric space and mesh immediately
    if (points.length < 100) {
      const procedural = RoomReconstruction.generateProceduralPoints(
        bounds.width || 4.2,
        bounds.length || 3.8,
        bounds.height || 2.7,
        1500
      );
      points = [...points, ...procedural];
    }

    onCompleteScan({
      id: `scan_${Date.now()}`,
      name: `Mapeo AR ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      bounds,
      points,
      keyframes,
      aiDetectedObjects: finalAnchors,
      engine: 'xr8-slam',
      timestamp: Date.now()
    });
  };

  const trackingLabel = trackingStatus === 'NORMAL'
    ? 'Tracking estable'
    : trackingStatus === 'LIMITED'
      ? 'Tracking limitado — movete más despacio'
      : 'Inicializando tracking...';
  const trackingColor = trackingStatus === 'NORMAL' ? 'bg-emerald-400' : trackingStatus === 'LIMITED' ? 'bg-amber-400' : 'bg-slate-400';

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-black overflow-hidden select-none">
      {/* XR8 owns this canvas: draws the real camera feed AND does SLAM tracking on it */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Idle / Start gate — required so the camera+motion permission prompt is a direct user gesture */}
      {phase === 'idle' && (
        <div className="relative z-30 m-auto p-6 rounded-2xl glass-panel border border-cyan-500/30 text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Scan className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Mapeo AR Real (SLAM)</h3>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Este modo usa tracking real de cámara + sensores (8th Wall) en vez de estimaciones.
            Te va a pedir permiso de cámara y de sensores de movimiento.
          </p>
          <button
            onClick={handleStart}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg active:scale-95 transition"
          >
            Activar Cámara AR
          </button>
          {onUnsupported && (
            <button
              onClick={() => onUnsupported()}
              className="w-full mt-2.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition"
            >
              Usar Escáner Básico (Sin SLAM)
            </button>
          )}
          {onBackToLobby && (
            <button
              onClick={onBackToLobby}
              className="w-full mt-2 py-2 rounded-xl text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-cyan-500/20 transition"
            >
              Volver al Menú Principal (Lobby)
            </button>
          )}
        </div>
      )}

      {phase === 'starting' && (
        <div className="relative z-30 m-auto p-6 rounded-2xl glass-panel border border-cyan-500/30 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-300">Iniciando tracking AR...</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="relative z-30 m-auto p-5 rounded-2xl glass-panel border border-amber-500/30 text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">AR no disponible acá</h3>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">{errorMsg}</p>
          <div className="flex flex-col space-y-2">
            <button onClick={handleStart} className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs">
              Reintentar
            </button>
            <button onClick={onLoadPreset} className="w-full py-2.5 rounded-xl bg-slate-800 text-cyan-400 font-semibold text-xs border border-cyan-500/30">
              Cargar Espacio 3D de Demostración
            </button>
          </div>
        </div>
      )}

      {phase === 'running' && (
        <>
          <div className="relative z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <Scan className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-wider uppercase text-cyan-400">DijiWord Spatial · AR Real</div>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-300 font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${trackingColor}`} />
                  <span>{trackingLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onBackToLobby && (
                <button
                  onClick={onBackToLobby}
                  className="px-2.5 py-1.5 rounded-full text-[10px] font-bold glass-btn text-cyan-300 hover:text-white flex items-center space-x-1"
                  title="Volver al Menú Principal (Lobby)"
                >
                  <Home className="w-3 h-3 text-cyan-400" />
                  <span>Lobby</span>
                </button>
              )}
              {onUnsupported && (
                <button
                  onClick={() => onUnsupported()}
                  className="px-2.5 py-1.5 rounded-full text-[10px] font-bold glass-btn text-slate-300 hover:text-white"
                  title="Cambiar a escáner básico"
                >
                  Básico
                </button>
              )}
              {onOpenFlyConnectome && (
                <button
                  onClick={onOpenFlyConnectome}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-400/40 hover:brightness-110 flex items-center space-x-1 transition active:scale-95"
                  title="Simulador Conectoma Drosophila"
                >
                  <span>🪰 Mosca 3D</span>
                </button>
              )}
              <button onClick={onLoadPreset} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/80 to-purple-600/80 text-white border border-white/20 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Demos</span>
              </button>
            </div>
          </div>

          <div className="mt-auto relative z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col space-y-2.5">
            {anchoredObjects.length > 0 && (
              <div className="glass-panel p-2 rounded-xl flex items-center space-x-2 text-xs border border-cyan-500/30 bg-slate-900/80 animate-fade-in">
                <Box className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                <span className="font-bold text-cyan-300">{anchoredObjects.length} muebles detectados:</span>
                <span className="truncate text-slate-200 font-medium">
                  {anchoredObjects.map(o => `${o.icon || '📦'} ${o.label}`).join(' · ')}
                </span>
              </div>
            )}

            <div className="glass-panel p-2.5 rounded-2xl flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Puntos 3D reales</span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">{pointCount.toLocaleString()} pts</span>
              </div>
              <div className="grid grid-cols-6 gap-1 text-[9px] text-center font-mono pt-1">
                {['floor', 'north', 'east', 'south', 'west', 'ceiling'].map((k) => (
                  <div key={k} className={`p-0.5 rounded border ${coverage[k] > 40 ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400'}`}>
                    {({ floor: 'Suelo', north: 'Norte', east: 'Este', south: 'Sur', west: 'Oeste', ceiling: 'Techo' })[k]} {Math.round(coverage[k])}%
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2.5">
              <button onClick={handleReset} disabled={pointCount === 0} className={`p-3 rounded-2xl glass-btn text-slate-300 ${pointCount === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:text-red-400'}`} title="Reiniciar">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={toggleScan}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-xl active:scale-95 transition-all ${isScanning ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white ring-2 ring-red-400/50' : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white'}`}
              >
                {isScanning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isScanning ? 'Pausar Mapeo' : (pointCount > 0 ? 'Reanudar Mapeo' : 'Iniciar Mapeo AR')}</span>
              </button>
              <button onClick={handleCaptureKeyframe} className="p-3 rounded-2xl glass-btn text-cyan-400 hover:text-cyan-300" title="Foto Clave">
                <Camera className="w-5 h-5" />
              </button>
              <button
                onClick={handleFinishScan}
                className="py-3 px-4 rounded-2xl font-bold text-xs flex items-center space-x-1.5 active:scale-95 transition-all bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 cursor-pointer"
                title="Simulación 3D"
              >
                <Eye className="w-4 h-4" />
                <span>Simular 3D</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center flex items-center justify-center space-x-1">
              <Info className="w-3 h-3" />
              <span>Recorré el cuarto despacio — el tracking real necesita ver superficies con textura, no paredes lisas de un solo color.</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

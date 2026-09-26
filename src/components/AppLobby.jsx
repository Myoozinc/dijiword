import React from 'react';
import {
  Brain,
  Bug,
  Camera,
  Scan,
  Box,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Utensils,
  Eye,
  Activity,
  Play,
  Download,
  Info
} from 'lucide-react';

export function AppLobby({
  onOpenFlySimulator,
  onOpenRoomScanner,
  onOpenSavedScans,
  onOpenFlyInSampleRoom
}) {
  return (
    <div className="relative w-screen h-screen bg-[#060913] text-slate-100 flex flex-col overflow-y-auto select-none font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col space-y-8 my-auto">
        {/* Top Header / Branding */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0a0f1d] rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  DijiWord <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">3D</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  v2.0 M5 Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mapeo Espacial 3D & Simulación Biomecánica Neuronal (Drosophila Connectome)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSavedScans}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-xs font-semibold text-slate-300 border border-slate-700/80 hover:border-cyan-500/40 flex items-center space-x-2 transition shadow-sm"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Espacios Guardados</span>
            </button>
          </div>
        </header>

        {/* Hero Section: Primary Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: 🪰 Simulador de Mosca 3D */}
          <div className="group relative rounded-3xl p-[1px] bg-gradient-to-b from-cyan-500/40 via-emerald-500/20 to-slate-800 hover:from-cyan-400 hover:to-emerald-400 transition-all duration-300 shadow-2xl">
            <div className="w-full h-full bg-slate-900/90 backdrop-blur-xl rounded-[23px] p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Bug className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center space-x-1">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Apple M5 Ultra GPU · 120 FPS</span>
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-emerald-300 transition">
                  Simulador de Mosca 3D
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Emulación del conectoma cerebral completo de <span className="text-cyan-300 font-semibold">Drosophila melanogaster</span> (166.700 neuronas y 124,2M de sinapsis de Janelia Research).
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-medium">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>5.200+ Neuronas Reales con Potenciales de Acción</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Cocina 3D (Encimera de Cuarzo, Frutero, Vinagre)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Proyector Retiniano Omatidial en Vivo</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Plasticidad & Memoria Dopaminérgica</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onOpenFlySimulator}
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Entrar al Simulador Mosca</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: 📱 Escáner de Cuartos 3D (Spatial Room Mapping) */}
          <div className="group relative rounded-3xl p-[1px] bg-gradient-to-b from-indigo-500/40 via-cyan-500/20 to-slate-800 hover:from-indigo-400 hover:to-cyan-400 transition-all duration-300 shadow-2xl">
            <div className="w-full h-full bg-slate-900/90 backdrop-blur-xl rounded-[23px] p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-inner">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center space-x-1">
                    <Scan className="w-3.5 h-3.5" />
                    <span>SLAM AR Real (8th Wall)</span>
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-cyan-300 transition">
                  Escáner de Cuartos 3D
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Mapea cualquier habitación física de tu casa en tiempo real con la cámara. Detecta planos de suelo, muros, cotas y muebles con redes neuronales de visión.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-medium">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                    <Scan className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Tracking Espacial 6-DoF SLAM</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                    <Box className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Reconstrucción Arquitectónica 3D</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Detección de Muebles & Cajas 3D</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                    <Download className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Exportación OBJ / CAD / PLY</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onOpenRoomScanner}
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/25 active:scale-98 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Escanear Cuarto con Cámara</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Banner: 🪰🏠 Mapear y Meter la Mosca en tu Cuarto */}
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-r from-amber-500/40 via-emerald-500/30 to-cyan-500/40 shadow-xl overflow-hidden">
          <div className="w-full bg-slate-900/90 backdrop-blur-xl rounded-[23px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-emerald-500/30 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🪰🏠
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Flujo Combinado Espacial
                  </span>
                  <span className="text-xs text-slate-400">· Nuevo</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mt-1">
                  Mapea cualquier habitación y mete a la mosca dentro
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Escanea tu propia sala, cuarto u oficina (o prueba con un cuarto preset demo). Al finalizar, suelta a la mosca virtual directamente dentro: volará entre tus paredes, caminará sobre tus mesas y podrás ver tu propia habitación a través de su proyector retiniano omatidial.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={onOpenFlyInSampleRoom}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-semibold text-xs flex items-center justify-center space-x-2 transition"
                title="Carga una habitación 3D prediseñada con muebles e inserta la mosca adentro inmediatamente"
              >
                <span>🪰 Probar Mosca en Cuarto Demo</span>
              </button>
              <button
                onClick={onOpenRoomScanner}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Mapear Mi Cuarto Ahora</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <footer className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>WebGL 2.0 · Metal GPU Acceleration · WebXR / 8th Wall SLAM</span>
          </div>
          <div className="mt-2 sm:mt-0 font-mono">
            DijiWord 3D Suite · Janelia Research MaleCNS Connectome & FlyGym
          </div>
        </footer>
      </div>
    </div>
  );
}

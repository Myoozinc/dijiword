import React from 'react';
import { Sparkles, Trash2, Calendar, Layers, X, Box, ArrowRight } from 'lucide-react';
import { RoomReconstruction } from '../services/roomReconstruction';
import { Exporter } from '../services/exporter';

export function SavedScansModal({ isOpen, onClose, onSelectScan }) {
  if (!isOpen) return null;

  const presets = RoomReconstruction.getPresetRooms();
  const savedScans = Exporter.getSavedScans();

  const handleSelectPreset = (preset) => {
    onSelectScan({
      id: preset.id,
      name: preset.name,
      bounds: preset.bounds,
      points: preset.points,
      defaultItems: preset.defaultItems,
      timestamp: Date.now()
    });
    onClose();
  };

  const handleSelectSaved = (scan) => {
    onSelectScan(scan);
    onClose();
  };

  const handleDeleteSaved = (e, id) => {
    e.stopPropagation();
    Exporter.deleteScan(id);
    // Force re-render handled by parent or local state
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto glass-panel rounded-3xl border border-cyan-500/30 p-5 flex flex-col space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Espacios 3D Listos para Simular</h2>
              <p className="text-xs text-slate-400">Selecciona un modelo escaneado o un preset de prueba</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full glass-btn text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center space-x-1.5">
            <Box className="w-3.5 h-3.5" />
            <span>Presets de Demostración 3D</span>
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {presets.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className="p-3.5 rounded-2xl glass-btn hover:border-cyan-400/60 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1 mb-1.5">
                    {p.description}
                  </p>
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                    <span>{p.bounds.area} m² ({p.bounds.width}×{p.bounds.length}m)</span>
                    <span>•</span>
                    <span className="text-cyan-400">{p.points.length.toLocaleString()} pts 3D</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-cyan-500/10 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved User Scans */}
        {savedScans.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tus Escaneos Anteriores</span>
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {savedScans.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSaved(s)}
                  className="p-3 rounded-xl glass-btn flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{s.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {s.bounds?.area} m² • {s.points?.length?.toLocaleString()} puntos
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSaved(e, s.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

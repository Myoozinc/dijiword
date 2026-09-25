import React, { useState } from 'react';
import { CameraScanner } from './components/CameraScanner';
import { Xr8RoomScanner } from './components/Xr8RoomScanner';
import { SimulationViewer } from './components/SimulationViewer';
import { SavedScansModal } from './components/SavedScansModal';
import { RoomReconstruction } from './services/roomReconstruction';
import { Exporter } from './services/exporter';

export default function App() {
  const [activeView, setActiveView] = useState('SCAN'); // 'SCAN' | 'SIMULATE'
  const [currentScan, setCurrentScan] = useState(null);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  // 'xr8' = motor real de SLAM (8th Wall). 'legacy' = fallback heurístico,
  // usado solo si XR8 no puede arrancar (navegador/dispositivo no soportado).
  const [scannerEngine, setScannerEngine] = useState('xr8');

  // Handle completed scan from camera
  const handleCompleteScan = (scanData) => {
    Exporter.saveScanToStorage(scanData);
    setCurrentScan(scanData);
    setActiveView('SIMULATE');
  };

  // Load preset or saved scan
  const handleSelectScan = (scanData) => {
    setCurrentScan(scanData);
    setActiveView('SIMULATE');
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {activeView === 'SCAN' && scannerEngine === 'xr8' && (
        <Xr8RoomScanner
          onCompleteScan={handleCompleteScan}
          onLoadPreset={() => setShowPresetsModal(true)}
          onUnsupported={() => setScannerEngine('legacy')}
        />
      )}

      {activeView === 'SCAN' && scannerEngine === 'legacy' && (
        <CameraScanner
          onCompleteScan={handleCompleteScan}
          onLoadPreset={() => setShowPresetsModal(true)}
          onSwitchToRealAR={() => setScannerEngine('xr8')}
        />
      )}

      {activeView === 'SIMULATE' && currentScan && (
        <SimulationViewer
          scanData={currentScan}
          onBackToScan={() => setActiveView('SCAN')}
        />
      )}

      {/* Preset & Saved Scans Modal */}
      <SavedScansModal
        isOpen={showPresetsModal}
        onClose={() => setShowPresetsModal(false)}
        onSelectScan={handleSelectScan}
      />
    </main>
  );
}

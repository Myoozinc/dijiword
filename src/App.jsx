import React, { useState } from 'react';
import { CameraScanner } from './components/CameraScanner';
import { SimulationViewer } from './components/SimulationViewer';
import { SavedScansModal } from './components/SavedScansModal';
import { RoomReconstruction } from './services/roomReconstruction';
import { Exporter } from './services/exporter';

export default function App() {
  const [activeView, setActiveView] = useState('SCAN'); // 'SCAN' | 'SIMULATE'
  const [currentScan, setCurrentScan] = useState(null);
  const [showPresetsModal, setShowPresetsModal] = useState(false);

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
      {activeView === 'SCAN' && (
        <CameraScanner
          onCompleteScan={handleCompleteScan}
          onLoadPreset={() => setShowPresetsModal(true)}
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

import React, { useState, useEffect } from 'react';
import { CameraScanner } from './components/CameraScanner';
import { Xr8RoomScanner } from './components/Xr8RoomScanner';
import { SimulationViewer } from './components/SimulationViewer';
import { FlySimulationViewer } from './components/FlySimulationViewer';
import { SavedScansModal } from './components/SavedScansModal';
import { RoomReconstruction } from './services/roomReconstruction';
import { Exporter } from './services/exporter';

export default function App() {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const path = window.location.pathname;
      const search = window.location.search;
      if (
        hash === '#fly' ||
        hash === '#browser' ||
        path.includes('/browser') ||
        path.includes('/fly') ||
        search.includes('fly') ||
        search.includes('browser')
      ) {
        return 'FLY';
      }
    }
    return 'SCAN'; // 'SCAN' | 'SIMULATE' | 'FLY'
  });

  const [currentScan, setCurrentScan] = useState(null);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  // 'xr8' = motor real de SLAM (8th Wall). 'legacy' = fallback heurístico,
  // usado solo si XR8 no puede arrancar (navegador/dispositivo no soportado).
  const [scannerEngine, setScannerEngine] = useState('xr8');

  // Synchronize URL hash with active view
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#fly' || hash === '#browser') {
        setActiveView('FLY');
      } else if (hash === '#scan' || hash === '') {
        if (activeView === 'FLY') setActiveView('SCAN');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeView]);

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
          onOpenFlyConnectome={() => {
            window.location.hash = 'fly';
            setActiveView('FLY');
          }}
          onUnsupported={() => setScannerEngine('legacy')}
        />
      )}

      {activeView === 'SCAN' && scannerEngine === 'legacy' && (
        <CameraScanner
          onCompleteScan={handleCompleteScan}
          onLoadPreset={() => setShowPresetsModal(true)}
          onOpenFlyConnectome={() => {
            window.location.hash = 'fly';
            setActiveView('FLY');
          }}
          onSwitchToRealAR={() => setScannerEngine('xr8')}
        />
      )}

      {activeView === 'SIMULATE' && currentScan && (
        <SimulationViewer
          scanData={currentScan}
          onBackToScan={() => setActiveView('SCAN')}
          onOpenFlyConnectome={() => {
            window.location.hash = 'fly';
            setActiveView('FLY');
          }}
        />
      )}

      {activeView === 'FLY' && (
        <FlySimulationViewer
          onBackToRoomScanner={() => {
            window.location.hash = 'scan';
            setActiveView('SCAN');
          }}
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

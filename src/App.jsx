import React, { useState, useEffect } from 'react';
import { CameraScanner } from './components/CameraScanner';
import { Xr8RoomScanner } from './components/Xr8RoomScanner';
import { SimulationViewer } from './components/SimulationViewer';
import { FlySimulationViewer } from './components/FlySimulationViewer';
import { AppLobby } from './components/AppLobby';
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
      if (hash === '#scan') return 'SCAN';
      if (hash === '#simulate') return 'SIMULATE';
      if (hash === '#lobby') return 'LOBBY';
    }
    return 'LOBBY'; // Default landing screen is the App Lobby!
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
      } else if (hash === '#scan') {
        setActiveView('SCAN');
      } else if (hash === '#simulate') {
        setActiveView('SIMULATE');
      } else if (hash === '#lobby' || hash === '') {
        setActiveView('LOBBY');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle completed scan from camera
  const handleCompleteScan = (scanData) => {
    Exporter.saveScanToStorage(scanData);
    setCurrentScan(scanData);
    window.location.hash = 'simulate';
    setActiveView('SIMULATE');
  };

  // Load preset or saved scan
  const handleSelectScan = (scanData) => {
    setCurrentScan(scanData);
    window.location.hash = 'simulate';
    setActiveView('SIMULATE');
  };

  // Launch fly simulation (with optional scanned room data)
  const handleOpenFlyConnectome = (scanData = null) => {
    if (scanData) {
      setCurrentScan(scanData);
    }
    window.location.hash = 'fly';
    setActiveView('FLY');
  };

  // Quick launch fly in a demo 3D room
  const handleOpenFlyInSampleRoom = () => {
    const preset = RoomReconstruction.getPresetRooms()[0];
    setCurrentScan(preset);
    window.location.hash = 'fly';
    setActiveView('FLY');
  };

  // Back to lobby
  const handleBackToLobby = () => {
    window.location.hash = 'lobby';
    setActiveView('LOBBY');
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* 1. App Lobby / Main Landing Screen */}
      {activeView === 'LOBBY' && (
        <AppLobby
          onOpenFlySimulator={() => handleOpenFlyConnectome()}
          onOpenRoomScanner={() => {
            window.location.hash = 'scan';
            setActiveView('SCAN');
          }}
          onOpenSavedScans={() => setShowPresetsModal(true)}
          onOpenFlyInSampleRoom={handleOpenFlyInSampleRoom}
        />
      )}

      {/* 2. Room Scanner (XR8 SLAM or Legacy Camera) */}
      {activeView === 'SCAN' && scannerEngine === 'xr8' && (
        <Xr8RoomScanner
          onCompleteScan={handleCompleteScan}
          onLoadPreset={() => setShowPresetsModal(true)}
          onOpenFlyConnectome={handleOpenFlyConnectome}
          onUnsupported={() => setScannerEngine('legacy')}
          onBackToLobby={handleBackToLobby}
        />
      )}

      {activeView === 'SCAN' && scannerEngine === 'legacy' && (
        <CameraScanner
          onCompleteScan={handleCompleteScan}
          onLoadPreset={() => setShowPresetsModal(true)}
          onOpenFlyConnectome={handleOpenFlyConnectome}
          onSwitchToRealAR={() => setScannerEngine('xr8')}
          onBackToLobby={handleBackToLobby}
        />
      )}

      {/* 3. 3D Architectural Room Simulation Viewer */}
      {activeView === 'SIMULATE' && currentScan && (
        <SimulationViewer
          scanData={currentScan}
          onBackToScan={() => {
            window.location.hash = 'scan';
            setActiveView('SCAN');
          }}
          onBackToLobby={handleBackToLobby}
          onOpenFlyConnectome={handleOpenFlyConnectome}
        />
      )}

      {/* 4. Drosophila Biomechanical Fly Simulation & Connectome */}
      {activeView === 'FLY' && (
        <FlySimulationViewer
          onBackToRoomScanner={() => {
            window.location.hash = 'scan';
            setActiveView('SCAN');
          }}
          onBackToLobby={handleBackToLobby}
          scannedRoomData={currentScan}
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

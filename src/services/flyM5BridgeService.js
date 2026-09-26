/**
 * Drosophila M5 Scientific Bridge Service (Apple Silicon Native Link)
 * ===================================================================
 * Connects the Dijiword 3D Web Cockpit to the native Python MuJoCo / FlyGym
 * biophysical simulation engine running locally on macOS via WebSocket (ws://localhost:8765).
 * 
 * Streams at 60-120 Hz:
 * - 18 DOF leg joint angles (Coxa, Femur, Tibia, Tarsus for all 6 legs)
 * - 4 DOF wing stroke kinematics (Pitch, Stroke, Deviation for L/R wings)
 * - Ground reaction contact forces (Tarsus-substrate friction)
 * - Descending motor spikes (DNa01/DNa02) & Central Complex steering commands (P-FL3)
 */

class FlyM5BridgeService {
  constructor() {
    this.wsUrl = 'ws://localhost:8765';
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectTimer = null;
    this.autoReconnect = true;
    
    // Telemetry state
    this.latestTelemetry = {
      engine: 'disconnected',
      hardware: 'Ninguno',
      fps: 0,
      timestamp: 0,
      gait: 'idle',
      joint_angles: null,
      wing_angles: null,
      ground_forces: { L1: 0, R1: 0, L2: 0, R2: 0, L3: 0, R3: 0 },
      spikes: { DNa01: 0, DNa02: 0, PFL3_L: 0, PFL3_R: 0, CPG_phase: 0 }
    };

    this.listeners = new Set();
    this.statusListeners = new Set();
  }

  /**
   * Initializes WebSocket connection to localhost:8765
   */
  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    this.notifyStatus('connecting');

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        console.log('🟢 [FlyM5Bridge] Conectado al Motor Científico MuJoCo M5 en ws://localhost:8765');
        this.notifyStatus('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'telemetry') {
            this.latestTelemetry = {
              ...this.latestTelemetry,
              ...data,
              timestamp: performance.now()
            };
            this.notifyListeners(this.latestTelemetry);
          }
        } catch (err) {
          console.warn('[FlyM5Bridge] Error parseando paquete de telemetría:', err);
        }
      };

      this.socket.onclose = () => {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.isConnecting = false;
        this.latestTelemetry.engine = 'disconnected';
        if (wasConnected) {
          console.warn('⚪ [FlyM5Bridge] Conexión cerrada con el servidor M5.');
        }
        this.notifyStatus('disconnected');

        if (this.autoReconnect) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        // Silent error to prevent console spam when Python server is not running
        this.isConnected = false;
        this.isConnecting = false;
        this.notifyStatus('disconnected');
      };
    } catch {
      this.isConnected = false;
      this.isConnecting = false;
      this.notifyStatus('disconnected');
      if (this.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }

  disconnect() {
    this.autoReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.notifyStatus('disconnected');
  }

  /**
   * Envia comando de estímulo olfativo al motor físico/neuronal en Python
   */
  sendOdorStimulus(valence, odorName = 'Sustancia') {
    if (!this.isConnected || !this.socket) return;
    try {
      this.socket.send(JSON.stringify({
        cmd: 'set_stimulus',
        type: 'odor',
        valence,
        name: odorName,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[FlyM5Bridge] Error enviando estímulo olfativo:', e);
    }
  }

  /**
   * Envia comando de modo de locomoción (caminar / volar / descanso)
   */
  sendLocomotionMode(mode = 'walking') {
    if (!this.isConnected || !this.socket) return;
    try {
      this.socket.send(JSON.stringify({
        cmd: 'set_mode',
        mode,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[FlyM5Bridge] Error enviando modo de marcha:', e);
    }
  }

  onTelemetry(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected ? 'connected' : (this.isConnecting ? 'connecting' : 'disconnected'));
    return () => this.statusListeners.delete(callback);
  }

  notifyListeners(data) {
    for (const cb of this.listeners) {
      try {
        cb(data);
      } catch (err) {
        console.error(err);
      }
    }
  }

  notifyStatus(status) {
    for (const cb of this.statusListeners) {
      try {
        cb(status);
      } catch (err) {
        console.error(err);
      }
    }
  }
}

export const flyM5Bridge = new FlyM5BridgeService();

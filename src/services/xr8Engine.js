/**
 * Xr8SpatialEngine — REAL monocular SLAM/VIO room mapping using the free,
 * open-source 8th Wall Engine binary (https://8thwall.org).
 *
 * Unlike the legacy `SpatialEngine` (spatialEngine.js), which guesses point
 * depth from fixed assumptions (flat floor at y=0, ceiling at 2.8m, ~2.4m
 * wall distance), this engine gets real tracked 6DoF camera pose and a real
 * sparse world point cloud from 8th Wall's XrController — the same class of
 * visual-inertial tracking used by production WebAR apps, and it works in
 * mobile Safari (iPhone) without needing WebXR, which Safari doesn't support.
 *
 * Public interface intentionally mirrors `SpatialEngine` so it can be used
 * as a drop-in replacement by a scanner component:
 *   points, keyframes, coverage, deviceAngle, isScanning
 *   startCamera(canvasEl, facingMode), stopCamera()
 *   processFrame(), captureKeyframe(), toggleTorch(), resetScan()
 *   computeRoomBounds()
 *
 * IMPORTANT — things that could not be verified on a real device in this
 * environment (no phone available here). Test on an actual iPhone/Android
 * over HTTPS before shipping:
 *   - Exact `worldPoints` payload shape returned by XrController on the
 *     current engine version (assumed: array of {x,y,z}, meters, y-up,
 *     same convention three.js/roomReconstruction.js already expects).
 *   - Torch control is NOT exposed through a documented 8th Wall API, so
 *     it's intentionally disabled (not faked) in this engine.
 */

const ENGINE_SCRIPT_TIMEOUT_MS = 12000;

let xr8LoadPromise = null;

/**
 * Resolves once window.XR8 is ready (fires 8th Wall's `xrloaded` event),
 * or rejects if the script never loads (e.g. blocked, offline, old browser).
 */
export function loadXR8() {
  if (xr8LoadPromise) return xr8LoadPromise;

  xr8LoadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No hay entorno de navegador.'));
      return;
    }
    if (window.XR8) {
      resolve(window.XR8);
      return;
    }

    const onLoaded = () => {
      window.removeEventListener('xrloaded', onLoaded);
      clearTimeout(timer);
      if (window.XR8) {
        resolve(window.XR8);
      } else {
        xr8LoadPromise = null;
        reject(new Error('XR8 no se inicializó correctamente.'));
      }
    };

    const timer = setTimeout(() => {
      window.removeEventListener('xrloaded', onLoaded);
      xr8LoadPromise = null; // Reset so retry works
      reject(new Error('Tiempo de espera agotado cargando el motor 8th Wall (¿bloqueado por el navegador o sin conexión?).'));
    }, ENGINE_SCRIPT_TIMEOUT_MS);

    window.addEventListener('xrloaded', onLoaded);
  });

  return xr8LoadPromise;
}

/** Quick capability probe: is there any chance XR8 will run here at all? */
export function isLikelySupportedDevice() {
  if (typeof navigator === 'undefined') return false;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
  // 8th Wall needs a real camera; desktop without a camera will still "load"
  // the script but XrController will report unsupported/limited tracking.
  return true;
}

export class Xr8SpatialEngine {
  constructor() {
    this.XR8 = null;
    this.canvas = null;

    this.points = []; // {x,y,z,r,g,b} — REAL tracked points from XrController
    this.keyframes = [];
    this.isScanning = false;

    this.trackingStatus = 'INITIALIZING'; // 'NORMAL' | 'LIMITED' | 'INITIALIZING'
    this._lastReality = null; // {rotation, position, trackingStatus, worldPoints}
    this.deviceAngle = { pitch: 0, roll: 0, yaw: 0 };
    this.orientation = { alpha: 0, beta: 0, gamma: 0 };

    this.coverage = {
      floor: 0, ceiling: 0, north: 0, south: 0, east: 0, west: 0, total: 0
    };

    this._seenSectorPoints = { floor: 0, ceiling: 0, north: 0, south: 0, east: 0, west: 0 };
    this._started = false;
  }

  /**
   * Boots the real 8th Wall camera + SLAM pipeline onto the given canvas.
   * MUST be called from a direct user gesture (button tap) — iOS requires
   * that for camera + motion sensor permission prompts.
   */
  async startCamera(canvasEl, facingMode = 'environment') {
    this.canvas = canvasEl;
    this.XR8 = await loadXR8();
    const XR8 = this.XR8;

    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (err) => {
        if (settled) return;
        settled = true;
        reject(err instanceof Error ? err : new Error(String(err && err.reason || err || 'Error desconocido de XR8')));
      };

      const bridgeModule = {
        name: 'dijiword-xr8-bridge',
        onStart: () => {
          if (settled) return;
          settled = true;
          this._started = true;
          resolve(true);
        },
        onException: (err) => fail(err),
        onUpdate: ({ processCpuResult }) => {
          const reality = processCpuResult && processCpuResult.reality;
          if (!reality) return;
          this._lastReality = reality;
          this.trackingStatus = reality.trackingStatus || this.trackingStatus;

          if (reality.rotation) {
            this.deviceAngle = quaternionToEuler(reality.rotation);
          }

          if (this.isScanning && reality.trackingStatus === 'NORMAL' && Array.isArray(reality.worldPoints)) {
            this._ingestWorldPoints(reality.worldPoints);
          }
        }
      };

      try {
        if (typeof XR8.clearCameraPipelineModules === 'function') {
          try { XR8.clearCameraPipelineModules(); } catch (e) {}
        }

        XR8.addCameraPipelineModules([
          XR8.GlTextureRenderer.pipelineModule(), // draws the real camera feed to the canvas
          XR8.XrController.pipelineModule(),       // real 6DoF SLAM/VIO tracking
          bridgeModule
        ]);

        XR8.run({
          canvas: canvasEl,
          cameraConfig: {
            direction: facingMode === 'user'
              ? XR8.XrConfig.camera().FRONT
              : XR8.XrConfig.camera().BACK
          },
          allowedDevices: XR8.XrConfig.device().ANY
        });
      } catch (err) {
        fail(err);
      }

      // Extra safety timeout in case neither onStart nor onException fires.
      setTimeout(() => fail(new Error('XR8 no arrancó la cámara a tiempo.')), ENGINE_SCRIPT_TIMEOUT_MS);
    });
  }

  stopCamera() {
    try {
      if (this.XR8 && this._started) {
        this.XR8.stop();
        if (typeof this.XR8.clearCameraPipelineModules === 'function') {
          try { this.XR8.clearCameraPipelineModules(); } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('XR8 stop error:', e);
    }
    this._started = false;
  }

  /** Voxel-deduplicated ingestion of real tracked world points. */
  _ingestWorldPoints(worldPoints) {
    for (const wp of worldPoints) {
      if (!wp) continue;
      // Handle both {x, y, z} and [x, y, z] structures from XrController
      const rawX = typeof wp.x === 'number' ? wp.x : (Array.isArray(wp) ? wp[0] : undefined);
      const rawY = typeof wp.y === 'number' ? wp.y : (Array.isArray(wp) ? wp[1] : undefined);
      const rawZ = typeof wp.z === 'number' ? wp.z : (Array.isArray(wp) ? wp[2] : undefined);

      if (!Number.isFinite(rawX) || !Number.isFinite(rawY) || !Number.isFinite(rawZ)) continue;

      const x = rawX;
      const y = Math.max(0, rawY);
      const z = rawZ;
      if (this._isDuplicate(x, y, z)) continue;

      // Height gradient shading so the cloud reads as a clear room with elevation relief
      const normY = Math.min(1.0, y / 2.5);
      const r = Number((0.20 + normY * 0.25).toFixed(3));
      const g = Number((0.68 + normY * 0.20).toFixed(3));
      const b = Number((0.88 + normY * 0.12).toFixed(3));

      this.points.push({
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        z: Number(z.toFixed(3)),
        r,
        g,
        b
      });

      this._bucketCoverage(x, y, z);
    }

    if (this.points.length > 60000) {
      this.points = this.points.filter((_, idx) => idx % 2 === 0);
    }
  }

  _isDuplicate(x, y, z, threshold = 0.05) {
    const len = this.points.length;
    const start = Math.max(0, len - 300);
    for (let i = start; i < len; i++) {
      const p = this.points[i];
      const dx = p.x - x, dy = p.y - y, dz = p.z - z;
      if (dx * dx + dy * dy + dz * dz < threshold * threshold) return true;
    }
    return false;
  }

  /** Real coverage: buckets ACTUAL captured points, not just "time spent pointing somewhere". */
  _bucketCoverage(x, y, z) {
    const eyeHeight = 1.5;
    if (y < 0.25) {
      this._seenSectorPoints.floor++;
    } else if (y > eyeHeight + 0.9) {
      this._seenSectorPoints.ceiling++;
    } else {
      const yaw = Math.atan2(x, -z); // -PI..PI
      const deg = ((yaw * 180 / Math.PI) + 360) % 360;
      if (deg >= 315 || deg < 45) this._seenSectorPoints.north++;
      else if (deg < 135) this._seenSectorPoints.east++;
      else if (deg < 225) this._seenSectorPoints.south++;
      else this._seenSectorPoints.west++;
    }

    const target = 220; // points considered "full coverage" per sector
    const s = this._seenSectorPoints;
    this.coverage = {
      floor: Math.min(100, (s.floor / target) * 100),
      ceiling: Math.min(100, (s.ceiling / target) * 100),
      north: Math.min(100, (s.north / target) * 100),
      south: Math.min(100, (s.south / target) * 100),
      east: Math.min(100, (s.east / target) * 100),
      west: Math.min(100, (s.west / target) * 100),
      total: 0
    };
    const sum = this.coverage.floor + this.coverage.ceiling + this.coverage.north
      + this.coverage.south + this.coverage.east + this.coverage.west;
    this.coverage.total = Math.min(100, Math.round(sum / 6));
  }

  /** Called every rAF by the scanner UI, same contract as SpatialEngine.processFrame(). */
  processFrame() {
    return {
      features: [], // no fake per-frame corner dots in real mode; see trackingStatus instead
      pointCount: this.points.length,
      coverage: this.coverage,
      angles: this.deviceAngle,
      trackingStatus: this.trackingStatus
    };
  }

  captureKeyframe() {
    if (!this.canvas) return null;
    let image = null;
    try {
      image = this.canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      // Canvas can be tainted in rare cross-origin edge cases; keep going without the thumbnail.
    }
    const keyframe = {
      id: Date.now(),
      image,
      pose: { ...this.deviceAngle },
      orientation: { ...this.orientation },
      pointsAtCapture: this.points.length
    };
    this.keyframes.push(keyframe);
    return keyframe;
  }

  async toggleTorch() {
    // Not exposed through a documented 8th Wall API — intentionally a no-op
    // rather than a fake success. See file header note.
    console.warn('Linterna no disponible en modo AR real (8th Wall).');
    return false;
  }

  resetScan() {
    this.points = [];
    this.keyframes = [];
    this._seenSectorPoints = { floor: 0, ceiling: 0, north: 0, south: 0, east: 0, west: 0 };
    this.coverage = { floor: 0, ceiling: 0, north: 0, south: 0, east: 0, west: 0, total: 0 };
  }

  /** Identical percentile-based box fit to SpatialEngine, now run on real points. */
  computeRoomBounds() {
    if (this.points.length < 20) {
      return {
        width: 4.2, length: 3.8, height: 2.7, area: 15.96, volume: 43.09,
        min: { x: -2.1, y: 0, z: -1.9 }, max: { x: 2.1, y: 2.7, z: 1.9 },
        center: { x: 0, y: 1.35, z: 0 }
      };
    }

    const sortedX = [...this.points.map(p => p.x)].sort((a, b) => a - b);
    const sortedY = [...this.points.map(p => p.y)].sort((a, b) => a - b);
    const sortedZ = [...this.points.map(p => p.z)].sort((a, b) => a - b);

    const q05 = Math.floor(sortedX.length * 0.05);
    const q95 = Math.floor(sortedX.length * 0.95);

    const minX = sortedX[q05], maxX = sortedX[q95];
    const minY = Math.max(0, sortedY[q05]);
    const maxY = Math.max(minY + 2.2, sortedY[q95]);
    const minZ = sortedZ[q05], maxZ = sortedZ[q95];

    const width = Math.max(2.0, Number((maxX - minX).toFixed(2)));
    const length = Math.max(2.0, Number((maxZ - minZ).toFixed(2)));
    const height = Math.max(2.2, Number((maxY - minY).toFixed(2)));
    const area = Number((width * length).toFixed(2));
    const volume = Number((area * height).toFixed(2));

    return {
      width, length, height, area, volume,
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
      center: {
        x: Number(((minX + maxX) / 2).toFixed(2)),
        y: Number(((minY + maxY) / 2).toFixed(2)),
        z: Number(((minZ + maxZ) / 2).toFixed(2))
      }
    };
  }
}

function quaternionToEuler({ w, x, y, z }) {
  // Standard quaternion -> Euler (yaw/pitch/roll), consistent with the
  // pitch/roll/yaw fields the rest of the app already expects.
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  const sinp = 2 * (w * y - z * x);
  const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * (Math.PI / 2) : Math.asin(sinp);

  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return { pitch, roll, yaw };
}

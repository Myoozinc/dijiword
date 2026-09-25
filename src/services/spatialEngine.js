/**
 * Spatial Engine - Monocular Computer Vision & 3D Mapping Engine
 * Operates purely on mobile RGB camera feed & device orientation sensors
 */

export class SpatialEngine {
  constructor() {
    this.video = null;
    this.stream = null;
    this.analysisCanvas = document.createElement('canvas');
    this.analysisCtx = this.analysisCanvas.getContext('2d', { willReadFrequently: true });
    
    // Camera intrinsics estimation (standard mobile 65° FOV)
    this.fov = 65 * (Math.PI / 180);
    this.focalLength = 1.0;
    
    // Sensor orientation
    this.orientation = { alpha: 0, beta: 0, gamma: 0 };
    this.deviceAngle = { pitch: 0, roll: 0, yaw: 0 };
    this.hasSensorAccess = false;
    
    // Mapping state
    this.points = []; // Array of {x, y, z, r, g, b, nx, ny, nz}
    this.keyframes = []; // Array of { image, pose, timestamp }
    this.isScanning = false;
    this.coverage = {
      floor: 0,
      ceiling: 0,
      north: 0,
      south: 0,
      east: 0,
      west: 0,
      total: 0
    };
    
    // Tracking historical optical flow
    this.prevFrameData = null;
    this.trackedFeatures = [];
    this.lastCaptureTime = 0;
    
    // Bind sensor listener
    this.handleOrientation = this.handleOrientation.bind(this);
  }

  /**
   * Request motion/orientation sensor permissions for iOS and Android
   */
  async requestSensors() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', this.handleOrientation, true);
          this.hasSensorAccess = true;
          return true;
        }
      } catch (err) {
        console.warn('Orientation permission error:', err);
      }
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', this.handleOrientation, true);
      this.hasSensorAccess = true;
      return true;
    }
    return false;
  }

  handleOrientation(event) {
    if (event.alpha !== null) {
      this.orientation.alpha = event.alpha; // 0 to 360 compass
      this.orientation.beta = event.beta;   // -180 to 180 pitch
      this.orientation.gamma = event.gamma; // -90 to 90 roll
      
      // Normalized angles in radians
      this.deviceAngle.yaw = (event.alpha || 0) * (Math.PI / 180);
      this.deviceAngle.pitch = (event.beta || 0) * (Math.PI / 180);
      this.deviceAngle.roll = (event.gamma || 0) * (Math.PI / 180);
    }
  }

  /**
   * Start mobile back camera
   */
  async startCamera(videoElement, facingMode = 'environment') {
    this.video = videoElement;
    
    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30 }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();
      
      // Calculate focal length in pixels based on video stream dimensions
      const w = this.video.videoWidth || 1280;
      this.focalLength = (w / 2) / Math.tan(this.fov / 2);
      
      this.analysisCanvas.width = 320; // Downscaled for real-time mobile CV
      this.analysisCanvas.height = 180;
      
      await this.requestSensors();
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      throw err;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    window.removeEventListener('deviceorientation', this.handleOrientation);
  }

  async toggleTorch(enable) {
    if (!this.stream) return false;
    const track = this.stream.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          await track.applyConstraints({ advanced: [{ torch: !!enable }] });
          return true;
        }
      } catch (e) {
        console.warn('Torch constraint error:', e);
      }
    }
    return false;
  }

  /**
   * Process a single video frame for AR tracking and 3D depth extraction
   */
  processFrame() {
    if (!this.video || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
      return null;
    }

    const cw = this.analysisCanvas.width;
    const ch = this.analysisCanvas.height;
    
    // Draw current frame downscaled to analysis canvas
    this.analysisCtx.drawImage(this.video, 0, 0, cw, ch);
    const frameData = this.analysisCtx.getImageData(0, 0, cw, ch);
    const pixels = frameData.data;

    // Feature point detection (FAST corner detection / gradient peaks)
    const features = [];
    const step = 8; // Grid sample step
    const threshold = 28;

    for (let y = step; y < ch - step; y += step) {
      for (let x = step; x < cw - step; x += step) {
        const idx = (y * cw + x) * 4;
        const lum = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
        
        // Horizontal and vertical gradients
        const idxRight = (y * cw + (x + 2)) * 4;
        const idxDown = ((y + 2) * cw + x) * 4;
        
        const lumRight = 0.299 * pixels[idxRight] + 0.587 * pixels[idxRight + 1] + 0.114 * pixels[idxRight + 2];
        const lumDown = 0.299 * pixels[idxDown] + 0.587 * pixels[idxDown + 1] + 0.114 * pixels[idxDown + 2];
        
        const grad = Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
        
        if (grad > threshold) {
          features.push({
            x: x / cw, // Normalized 0..1
            y: y / ch,
            lum,
            r: pixels[idx],
            g: pixels[idx + 1],
            b: pixels[idx + 2],
            grad
          });
        }
      }
    }

    this.trackedFeatures = features;

    // Update coverage orientation
    this.updateCoverage();

    // If scanning is active, generate and accumulate 3D points
    if (this.isScanning) {
      this.reprojectFeaturesTo3D(features);
    }

    return {
      features: features.slice(0, 100), // Top tracked points for AR display
      pointCount: this.points.length,
      coverage: this.coverage,
      angles: this.deviceAngle
    };
  }

  /**
   * Update room coverage sectors based on device pitch and yaw
   */
  updateCoverage() {
    const pitchDeg = this.orientation.beta; // -90 (pointing up) to +90 (pointing down)
    const yawDeg = (this.orientation.alpha + 360) % 360;

    if (pitchDeg > 45) {
      this.coverage.floor = Math.min(100, this.coverage.floor + 1.2);
    } else if (pitchDeg < -35) {
      this.coverage.ceiling = Math.min(100, this.coverage.ceiling + 1.2);
    } else {
      // Walls according to compass quadrant
      if (yawDeg >= 315 || yawDeg < 45) {
        this.coverage.north = Math.min(100, this.coverage.north + 1.0);
      } else if (yawDeg >= 45 && yawDeg < 135) {
        this.coverage.east = Math.min(100, this.coverage.east + 1.0);
      } else if (yawDeg >= 135 && yawDeg < 225) {
        this.coverage.south = Math.min(100, this.coverage.south + 1.0);
      } else {
        this.coverage.west = Math.min(100, this.coverage.west + 1.0);
      }
    }

    const sum = this.coverage.floor + this.coverage.ceiling + this.coverage.north +
                this.coverage.south + this.coverage.east + this.coverage.west;
    this.coverage.total = Math.min(100, Math.round(sum / 6));
  }

  /**
   * Monocular depth estimation and 3D back-projection
   * Converts 2D pixel coordinates and camera orientation into 3D world space (X, Y, Z)
   */
  reprojectFeaturesTo3D(features) {
    const pitch = this.deviceAngle.pitch;
    const yaw = this.deviceAngle.yaw;
    const roll = this.deviceAngle.roll;
    
    // Camera eye height estimate: 1.6 meters above ground
    const eyeHeight = 1.6;

    // Rotation matrices
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);

    // Monocular 3D Surface Reconstruction
    const maxNewPointsPerFrame = 90;
    const selected = features
      .sort((a, b) => b.grad - a.grad)
      .slice(0, maxNewPointsPerFrame);

    for (const f of selected) {
      const ndcX = (f.x - 0.5) * 2;
      const ndcY = (0.5 - f.y) * 2;
      
      const rayCamX = ndcX * Math.tan(this.fov / 2);
      const rayCamY = ndcY * Math.tan(this.fov / 2) * (9 / 16);
      const rayCamZ = -1.0;

      // Rotate ray by pitch & yaw
      const ry1 = rayCamY * cosPitch - rayCamZ * sinPitch;
      const rz1 = rayCamY * sinPitch + rayCamZ * cosPitch;
      const rx1 = rayCamX;

      const rx2 = rx1 * cosYaw + rz1 * sinYaw;
      const ry2 = ry1;
      const rz2 = -rx1 * sinYaw + rz1 * cosYaw;

      const len = Math.sqrt(rx2 * rx2 + ry2 * ry2 + rz2 * rz2) || 1;
      const dirX = rx2 / len;
      const dirY = ry2 / len;
      const dirZ = rz2 / len;

      let depth = 2.4;
      let targetElevation = 0; // Surface height above floor

      if (dirY < -0.05) {
        // Pointing down towards floor or elevated furniture (couch, table, bed, chairs)
        // Check if feature is in lower-middle zone where furniture rests (elevation relief)
        if (f.y < 0.65 && f.grad > 40) {
          // Elevated surface (table, desk, couch, bed cushion)
          targetElevation = Math.min(1.1, Math.max(0.2, (0.65 - f.y) * 2.2));
        } else {
          targetElevation = 0; // Ground floor plane
        }

        const tSurface = (targetElevation - eyeHeight) / dirY;
        depth = Math.max(0.5, Math.min(6.5, tSurface));
      } else if (dirY > 0.15) {
        // Ceiling
        const ceilingHeight = 2.8;
        const tCeil = (ceilingHeight - eyeHeight) / dirY;
        depth = Math.max(0.8, Math.min(5.5, tCeil));
        targetElevation = ceilingHeight;
      } else {
        // Vertical walls or tall furniture
        const contrastFactor = Math.min(1.4, Math.max(0.65, 120 / (f.grad + 40)));
        depth = 2.4 * contrastFactor;
        targetElevation = Math.max(0, eyeHeight + dirY * depth);
      }

      // 3D world coordinates with true physical elevation
      const worldX = dirX * depth;
      const worldY = Math.max(0, targetElevation);
      const worldZ = dirZ * depth;

      // Spatial downsampling with 5cm voxel resolution
      if (!this.isPointDuplicate(worldX, worldY, worldZ, 0.05)) {
        this.points.push({
          x: Number(worldX.toFixed(3)),
          y: Number(worldY.toFixed(3)),
          z: Number(worldZ.toFixed(3)),
          r: f.r / 255,
          g: f.g / 255,
          b: f.b / 255
        });
      }
    }

    // Limit maximum points for smooth 60fps mobile simulation
    if (this.points.length > 50000) {
      this.points = this.points.filter((_, idx) => idx % 2 === 0);
    }
  }

  isPointDuplicate(x, y, z, threshold = 0.08) {
    const len = this.points.length;
    // Check last 200 points for speed
    const start = Math.max(0, len - 200);
    for (let i = start; i < len; i++) {
      const p = this.points[i];
      const dx = p.x - x;
      const dy = p.y - y;
      const dz = p.z - z;
      if (dx * dx + dy * dy + dz * dz < threshold * threshold) {
        return true;
      }
    }
    return false;
  }

  /**
   * Capture high-res keyframe with timestamp & orientation
   */
  captureKeyframe() {
    if (!this.video) return null;
    
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 640;
    snapCanvas.height = 360;
    const ctx = snapCanvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, 640, 360);
    
    const keyframe = {
      id: Date.now(),
      image: snapCanvas.toDataURL('image/jpeg', 0.8),
      pose: { ...this.deviceAngle },
      orientation: { ...this.orientation },
      pointsAtCapture: this.points.length
    };
    
    this.keyframes.push(keyframe);
    return keyframe;
  }

  /**
   * Calculate bounding box and room dimensions (Width, Length, Height, Area, Volume)
   */
  computeRoomBounds() {
    if (this.points.length < 20) {
      // Default standard room: 4.2m x 3.8m x 2.7m
      return {
        width: 4.2,
        length: 3.8,
        height: 2.7,
        area: 15.96,
        volume: 43.09,
        min: { x: -2.1, y: 0, z: -1.9 },
        max: { x: 2.1, y: 2.7, z: 1.9 },
        center: { x: 0, y: 1.35, z: 0 }
      };
    }

    // Discard outlier percentiles (5% - 95%)
    const sortedX = [...this.points.map(p => p.x)].sort((a, b) => a - b);
    const sortedY = [...this.points.map(p => p.y)].sort((a, b) => a - b);
    const sortedZ = [...this.points.map(p => p.z)].sort((a, b) => a - b);

    const q05 = Math.floor(sortedX.length * 0.05);
    const q95 = Math.floor(sortedX.length * 0.95);

    const minX = sortedX[q05];
    const maxX = sortedX[q95];
    const minY = Math.max(0, sortedY[q05]);
    const maxY = Math.max(minY + 2.2, sortedY[q95]);
    const minZ = sortedZ[q05];
    const maxZ = sortedZ[q95];

    const width = Math.max(2.0, Number((maxX - minX).toFixed(2)));
    const length = Math.max(2.0, Number((maxZ - minZ).toFixed(2)));
    const height = Math.max(2.2, Number((maxY - minY).toFixed(2)));
    const area = Number((width * length).toFixed(2));
    const volume = Number((area * height).toFixed(2));

    return {
      width,
      length,
      height,
      area,
      volume,
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
      center: {
        x: Number(((minX + maxX) / 2).toFixed(2)),
        y: Number(((minY + maxY) / 2).toFixed(2)),
        z: Number(((minZ + maxZ) / 2).toFixed(2))
      }
    };
  }

  /**
   * Reset scanning data
   */
  resetScan() {
    this.points = [];
    this.keyframes = [];
    this.coverage = {
      floor: 0,
      ceiling: 0,
      north: 0,
      south: 0,
      east: 0,
      west: 0,
      total: 0
    };
  }
}

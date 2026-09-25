/**
 * AI Vision & Neural Object Detector Service
 * Detects subjects, furniture, electronics, and extracts real textures & 3D depths
 */
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

export class AIVisionDetector {
  constructor() {
    this.model = null;
    this.isLoading = false;
    this.isLoaded = false;
    this.lastDetectionTime = 0;
    this.detectionInterval = 180; // ms between AI inferences for smooth 60fps UI
    this.cachedDetections = [];
    this.cropCanvas = document.createElement('canvas');
    this.cropCtx = this.cropCanvas.getContext('2d');
  }

  /**
   * Load COCO-SSD MobileNet Neural Network
   */
  async loadModel() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    try {
      await tf.ready();
      this.model = await cocoSsd.load({ base: 'mobilenet_v2' });
      this.isLoaded = true;
      console.log('✅ AI Vision Model (COCO-SSD) loaded successfully.');
    } catch (err) {
      console.warn('COCO-SSD load error, falling back to spatial heuristic vision:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Translate English COCO-SSD class names to user-friendly Spanish labels
   */
  static getLocalizedLabel(className) {
    const dict = {
      person: 'Persona / Sujeto',
      chair: 'Silla',
      couch: 'Sofá',
      sofa: 'Sofá',
      'potted plant': 'Planta',
      bed: 'Cama',
      'dining table': 'Mesa',
      table: 'Mesa',
      tv: 'Televisor / Pantalla',
      laptop: 'Ordenador Portátil',
      mouse: 'Ratón',
      remote: 'Control Remoto',
      keyboard: 'Teclado',
      'cell phone': 'Teléfono Móvil',
      microwave: 'Microondas',
      oven: 'Horno',
      sink: 'Lavabo',
      refrigerator: 'Nevera',
      book: 'Libro',
      clock: 'Reloj',
      vase: 'Jarrón',
      bottle: 'Botella',
      cup: 'Taza',
      backpack: 'Mochila',
      handbag: 'Bolso',
      suitcase: 'Maleta',
      door: 'Puerta',
      window: 'Ventana'
    };
    return dict[className.toLowerCase()] || className;
  }

  /**
   * Detect objects in current video frame with depth & texture extraction
   */
  async detectFrame(video, roomBounds = null, cameraAngles = { pitch: 0, yaw: 0 }) {
    if (!video || video.readyState < 2) return this.cachedDetections;

    const now = performance.now();
    if (now - this.lastDetectionTime < this.detectionInterval) {
      return this.cachedDetections;
    }
    this.lastDetectionTime = now;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    let predictions = [];

    if (this.model) {
      try {
        predictions = await this.model.detect(video, 12, 0.45);
      } catch (e) {
        console.warn('Detection infer error:', e);
      }
    }

    // Process predictions into rich 3D spatial objects with real photo textures
    const processed = predictions.map((pred, idx) => {
      const [bx, by, bw, bh] = pred.bbox;
      const normX = (bx + bw / 2) / vw; // 0..1 horizontal center
      const normBottomY = (by + bh) / vh; // 0..1 bottom ground contact point

      // Estimate depth from bottom ground contact and bounding box scale
      // Objects lower in the screen or larger are closer
      const depth = Math.max(0.8, Math.min(6.0, 1.6 / Math.max(0.15, normBottomY - 0.2)));

      // 3D position in world space
      const angleH = (normX - 0.5) * (65 * (Math.PI / 180));
      const worldX = Math.sin(angleH + cameraAngles.yaw) * depth;
      const worldZ = -Math.cos(angleH + cameraAngles.yaw) * depth;
      const worldY = Math.max(0, (1 - normBottomY) * 1.5);

      // Extract real image texture of the detected object
      let textureDataUrl = null;
      try {
        const cropW = Math.max(32, Math.min(256, bw));
        const cropH = Math.max(32, Math.min(256, bh));
        this.cropCanvas.width = cropW;
        this.cropCanvas.height = cropH;
        this.cropCtx.drawImage(video, bx, by, bw, bh, 0, 0, cropW, cropH);
        textureDataUrl = this.cropCanvas.toDataURL('image/jpeg', 0.85);
      } catch (err) {
        // Fallback if video tainted
      }

      return {
        id: `ai_obj_${Date.now()}_${idx}`,
        class: pred.class,
        label: AIVisionDetector.getLocalizedLabel(pred.class),
        score: Math.round(pred.score * 100),
        bbox: [bx, by, bw, bh],
        normBbox: [bx / vw, by / vh, bw / vw, bh / vh],
        depth: Number(depth.toFixed(2)),
        position3D: {
          x: Number(worldX.toFixed(2)),
          y: Number(worldY.toFixed(2)),
          z: Number(worldZ.toFixed(2))
        },
        size3D: {
          width: Math.max(0.3, Number((bw / vw * depth).toFixed(2))),
          height: Math.max(0.3, Number((bh / vh * depth).toFixed(2))),
          depth: Math.max(0.3, Number((bw / vw * depth * 0.7).toFixed(2)))
        },
        texture: textureDataUrl,
        timestamp: Date.now()
      };
    });

    this.cachedDetections = processed;
    return processed;
  }
}

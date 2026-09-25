/**
 * Spatial Object Manager & World Anchor Memory System
 * Maintains persistent 3D spatial anchors for all detected objects with physical metric priors
 */

export const OBJECT_PRIORS = {
  couch: { width: 2.1, height: 0.85, depth: 0.9, icon: '🛋️', label: 'Sofá' },
  sofa: { width: 2.1, height: 0.85, depth: 0.9, icon: '🛋️', label: 'Sofá' },
  chair: { width: 0.55, height: 0.85, depth: 0.55, icon: '🪑', label: 'Silla' },
  bed: { width: 1.65, height: 0.75, depth: 2.05, icon: '🛏️', label: 'Cama Queen' },
  'dining table': { width: 1.4, height: 0.75, depth: 0.85, icon: '🍽️', label: 'Mesa Comedor' },
  table: { width: 1.1, height: 0.75, depth: 0.75, icon: '🪑', label: 'Mesa' },
  desk: { width: 1.35, height: 0.75, depth: 0.75, icon: '🖥️', label: 'Escritorio' },
  tv: { width: 1.3, height: 0.75, depth: 0.15, icon: '📺', label: 'Smart TV' },
  laptop: { width: 0.35, height: 0.22, depth: 0.26, icon: '💻', label: 'Portátil' },
  'potted plant': { width: 0.45, height: 0.75, depth: 0.45, icon: '🪴', label: 'Planta' },
  plant: { width: 0.45, height: 0.75, depth: 0.45, icon: '🪴', label: 'Planta' },
  person: { width: 0.5, height: 1.72, depth: 0.35, icon: '🧍', label: 'Persona (1:1)' },
  refrigerator: { width: 0.8, height: 1.8, depth: 0.8, icon: '🧊', label: 'Refrigerador' },
  microwave: { width: 0.55, height: 0.35, depth: 0.4, icon: '📻', label: 'Microondas' },
  sink: { width: 0.65, height: 0.85, depth: 0.55, icon: '🚰', label: 'Lavabo' },
  book: { width: 0.22, height: 0.05, depth: 0.16, icon: '📖', label: 'Libro' },
  clock: { width: 0.3, height: 0.3, depth: 0.06, icon: '⏰', label: 'Reloj' },
  vase: { width: 0.25, height: 0.4, depth: 0.25, icon: '🏺', label: 'Jarrón' },
  bottle: { width: 0.1, height: 0.28, depth: 0.1, icon: '🍾', label: 'Botella' },
  cup: { width: 0.12, height: 0.12, depth: 0.12, icon: '☕', label: 'Taza' },
  backpack: { width: 0.36, height: 0.48, depth: 0.26, icon: '🎒', label: 'Mochila' },
  handbag: { width: 0.32, height: 0.28, depth: 0.18, icon: '👜', label: 'Bolso' },
  'cell phone': { width: 0.08, height: 0.015, depth: 0.16, icon: '📱', label: 'Teléfono Móvil' }
};

export class SpatialObjectManager {
  constructor() {
    this.anchors = []; // Array of persistent 3D object anchors
  }

  /**
   * Reset all spatial anchors
   */
  reset() {
    this.anchors = [];
  }

  /**
   * Get physical calibrated dimensions for a detected class
   */
  static getDimensionsForClass(className, detectedRatio = 1.0) {
    const key = className.toLowerCase();
    const prior = OBJECT_PRIORS[key] || {
      width: 0.7,
      height: 0.7,
      depth: 0.7,
      icon: '📦',
      label: className
    };

    // Fine-tune width/height slightly based on detected aspect ratio while respecting real physics
    let w = prior.width;
    let h = prior.height;
    let d = prior.depth;

    if (detectedRatio > 1.4 && key === 'chair') {
      // Wide chair is likely an armchair or loveseat
      w = 0.85;
      d = 0.85;
    }

    return {
      width: Number(w.toFixed(2)),
      height: Number(h.toFixed(2)),
      depth: Number(d.toFixed(2)),
      icon: prior.icon,
      label: prior.label
    };
  }

  /**
   * Integrate detected frame objects into persistent 3D world anchors
   */
  integrateDetections(rawDetections, roomBounds = null) {
    for (const raw of rawDetections) {
      const cls = raw.class.toLowerCase();
      const dims = SpatialObjectManager.getDimensionsForClass(cls);

      const targetX = raw.position3D.x;
      const targetZ = raw.position3D.z;

      // Find nearest existing anchor of compatible class
      let nearestAnchor = null;
      let minDistance = Infinity;

      for (const anchor of this.anchors) {
        // Match exact class or general category (e.g. chair/couch or table/desk)
        const isCompatible = (anchor.class === cls) || 
          (anchor.class.includes('table') && cls.includes('table')) ||
          (anchor.class.includes('chair') && cls.includes('chair'));

        if (isCompatible) {
          const dx = anchor.position3D.x - targetX;
          const dz = anchor.position3D.z - targetZ;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < minDistance) {
            minDistance = dist;
            nearestAnchor = anchor;
          }
        }
      }

      // Proximity threshold: 0.7 meters for spatial clustering
      if (nearestAnchor && minDistance < 0.7) {
        // Reinforce existing anchor (Weighted running average for steady positioning)
        nearestAnchor.sightings = (nearestAnchor.sightings || 1) + 1;
        nearestAnchor.confidence = Math.max(nearestAnchor.confidence, raw.score);

        // Update position smoothly
        nearestAnchor.position3D.x = Number((nearestAnchor.position3D.x * 0.75 + targetX * 0.25).toFixed(2));
        nearestAnchor.position3D.z = Number((nearestAnchor.position3D.z * 0.75 + targetZ * 0.25).toFixed(2));
        nearestAnchor.position3D.y = 0; // Placed firmly on the floor

        // If new texture has better score or quality, update it
        if (raw.texture && (!nearestAnchor.texture || raw.score >= nearestAnchor.confidence)) {
          nearestAnchor.texture = raw.texture;
        }
      } else {
        // Add brand-new spatial anchor
        const newAnchor = {
          id: `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          class: cls,
          label: dims.label,
          icon: dims.icon,
          confidence: raw.score,
          sightings: 1,
          depth: raw.depth,
          position3D: {
            x: targetX,
            y: 0, // Clamped to floor
            z: targetZ
          },
          size3D: {
            width: dims.width,
            height: dims.height,
            depth: dims.depth
          },
          texture: raw.texture,
          timestamp: Date.now()
        };

        this.anchors.push(newAnchor);
      }
    }

    // Sort anchors by confidence & sightings
    return [...this.anchors].sort((a, b) => b.sightings - a.sightings);
  }

  /**
   * Remove an anchor by ID
   */
  removeAnchor(id) {
    this.anchors = this.anchors.filter(a => a.id !== id);
  }

  /**
   * Get all persistent anchors
   */
  getAnchors() {
    return [...this.anchors];
  }
}

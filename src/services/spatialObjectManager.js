/**
 * Spatial Object Manager & World Anchor Memory System
 * Maintains persistent 3D spatial anchors for all detected objects with physical metric priors
 */

export const STABLE_FURNITURE_CLASSES = new Set([
  'couch',
  'sofa',
  'chair',
  'bed',
  'dining table',
  'table',
  'desk',
  'tv',
  'potted plant',
  'plant'
]);

export const OBJECT_PRIORS = {
  couch: { width: 2.1, height: 0.85, depth: 0.9, icon: '🛋️', label: 'Sofá' },
  sofa: { width: 2.1, height: 0.85, depth: 0.9, icon: '🛋️', label: 'Sofá' },
  chair: { width: 0.55, height: 0.85, depth: 0.55, icon: '🪑', label: 'Silla' },
  bed: { width: 1.65, height: 0.75, depth: 2.05, icon: '🛏️', label: 'Cama Queen' },
  'dining table': { width: 1.4, height: 0.75, depth: 0.85, icon: '🍽️', label: 'Mesa Comedor' },
  table: { width: 1.1, height: 0.75, depth: 0.75, icon: '🪑', label: 'Mesa' },
  desk: { width: 1.35, height: 0.75, depth: 0.75, icon: '🖥️', label: 'Escritorio' },
  tv: { width: 1.3, height: 0.75, depth: 0.15, icon: '📺', label: 'Smart TV' },
  'potted plant': { width: 0.45, height: 0.75, depth: 0.45, icon: '🪴', label: 'Planta' },
  plant: { width: 0.45, height: 0.75, depth: 0.45, icon: '🪴', label: 'Planta' }
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
   * Check if a class is an allowed stable spatial object
   */
  static isAllowedClass(className) {
    if (!className) return false;
    const key = className.toLowerCase().trim();
    return STABLE_FURNITURE_CLASSES.has(key);
  }

  /**
   * Get physical calibrated dimensions for a detected class
   */
  static getDimensionsForClass(className, detectedRatio = 1.0) {
    const key = className.toLowerCase().trim();
    const prior = OBJECT_PRIORS[key] || {
      width: 0.8,
      height: 0.75,
      depth: 0.8,
      icon: '📦',
      label: className
    };

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
   * Filters out spurious transient detections and merges duplicates within proximity
   */
  integrateDetections(rawDetections, roomBounds = null) {
    for (const raw of rawDetections) {
      const cls = (raw.class || '').toLowerCase().trim();

      // STRICT FILTER: Only anchor whitelisted stable furniture, ignore persons, kites, umbrellas, etc.
      if (!SpatialObjectManager.isAllowedClass(cls)) {
        continue;
      }

      // Require minimum confidence score (>= 60)
      if (raw.score < 60) {
        continue;
      }

      const dims = SpatialObjectManager.getDimensionsForClass(cls);
      const targetX = raw.position3D.x;
      const targetZ = raw.position3D.z;

      // Find nearest existing anchor of compatible class within 1.1m
      let nearestAnchor = null;
      let minDistance = Infinity;

      for (const anchor of this.anchors) {
        const isCompatible = (anchor.class === cls) || 
          (anchor.class.includes('table') && cls.includes('table')) ||
          (anchor.class.includes('chair') && cls.includes('chair')) ||
          (anchor.class.includes('couch') && cls.includes('sofa')) ||
          (anchor.class.includes('sofa') && cls.includes('couch'));

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

      // Proximity threshold: 1.1 meters for spatial clustering
      if (nearestAnchor && minDistance < 1.1) {
        // Reinforce existing anchor (Weighted running average for steady positioning)
        nearestAnchor.sightings = (nearestAnchor.sightings || 1) + 1;
        nearestAnchor.confidence = Math.max(nearestAnchor.confidence, raw.score);

        // Update position smoothly
        nearestAnchor.position3D.x = Number((nearestAnchor.position3D.x * 0.75 + targetX * 0.25).toFixed(2));
        nearestAnchor.position3D.z = Number((nearestAnchor.position3D.z * 0.75 + targetZ * 0.25).toFixed(2));
        nearestAnchor.position3D.y = 0; // Placed firmly on the floor

        // Update texture if new one has higher confidence
        if (raw.texture && (!nearestAnchor.texture || raw.score >= nearestAnchor.confidence)) {
          nearestAnchor.texture = raw.texture;
        }
      } else {
        // Only spawn brand-new anchor if we haven't reached the limit of 6 anchors
        if (this.anchors.length < 10) {
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
   * Get confirmed persistent anchors for 3D simulation
   * Requires minimum sightings (>= 3) to eliminate transient one-off noise
   * Capped to maximum 6 anchors per room to avoid clutter
   */
  getAnchors(minSightings = 3) {
    const confirmed = this.anchors
      .filter(a => (a.sightings || 1) >= minSightings && a.confidence >= 60)
      .sort((a, b) => (b.sightings * b.confidence) - (a.sightings * a.confidence));

    // Cap to at most 6 confirmed major furniture anchors
    return confirmed.slice(0, 6);
  }
}

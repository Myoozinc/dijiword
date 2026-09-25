/**
 * Exporter and Storage Service
 * Handles OBJ, PLY point clouds, JSON simulation scenes, and local persistence
 */

export class Exporter {
  /**
   * Export Point Cloud as PLY (Stanford Polygon File Format)
   */
  static exportPLY(points, filename = 'dijiword-scan.ply') {
    let header = 'ply\n';
    header += 'format ascii 1.0\n';
    header += `element vertex ${points.length}\n`;
    header += 'property float x\n';
    header += 'property float y\n';
    header += 'property float z\n';
    header += 'property uchar red\n';
    header += 'property uchar green\n';
    header += 'property uchar blue\n';
    header += 'end_header\n';

    let body = '';
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const r = Math.round((p.r ?? 0.8) * 255);
      const g = Math.round((p.g ?? 0.8) * 255);
      const b = Math.round((p.b ?? 0.8) * 255);
      body += `${p.x.toFixed(4)} ${p.y.toFixed(4)} ${p.z.toFixed(4)} ${r} ${g} ${b}\n`;
    }

    const blob = new Blob([header + body], { type: 'text/plain' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Export 3D Room Box as Wavefront OBJ format
   */
  static exportOBJ(bounds, filename = 'dijiword-room.obj') {
    const { min, max } = bounds;

    // 8 vertices of the room box
    const v = [
      [min.x, min.y, min.z], // 1
      [max.x, min.y, min.z], // 2
      [max.x, min.y, max.z], // 3
      [min.x, min.y, max.z], // 4
      [min.x, max.y, min.z], // 5
      [max.x, max.y, min.z], // 6
      [max.x, max.y, max.z], // 7
      [min.x, max.y, max.z], // 8
    ];

    let obj = '# DijiWord 3D Room Scan\n# https://github.com/Myoozinc/dijiword\n\n';
    
    // Write vertices
    for (const pos of v) {
      obj += `v ${pos[0].toFixed(4)} ${pos[1].toFixed(4)} ${pos[2].toFixed(4)}\n`;
    }

    obj += '\n# Faces (Floor, Ceiling, Walls)\n';
    obj += 'f 1 2 3 4\n'; // Floor
    obj += 'f 8 7 6 5\n'; // Ceiling
    obj += 'f 1 5 6 2\n'; // North wall
    obj += 'f 2 6 7 3\n'; // East wall
    obj += 'f 3 7 8 4\n'; // South wall
    obj += 'f 4 8 5 1\n'; // West wall

    const blob = new Blob([obj], { type: 'text/plain' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Export entire simulation state (bounds, items, lighting, metadata)
   */
  static exportSimulationJSON(scanData, filename = 'dijiword-simulation.json') {
    const jsonStr = JSON.stringify(scanData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }

  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Save scan to browser localStorage
   */
  static saveScanToStorage(scanData) {
    try {
      const scans = this.getSavedScans();
      const updated = [scanData, ...scans.filter(s => s.id !== scanData.id)].slice(0, 10);
      localStorage.setItem('dijiword_scans', JSON.stringify(updated));
      return true;
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
      return false;
    }
  }

  static getSavedScans() {
    try {
      const data = localStorage.getItem('dijiword_scans');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static deleteScan(id) {
    try {
      const scans = this.getSavedScans();
      const filtered = scans.filter(s => s.id !== id);
      localStorage.setItem('dijiword_scans', JSON.stringify(filtered));
      return true;
    } catch (e) {
      return false;
    }
  }
}

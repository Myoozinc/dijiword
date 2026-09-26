#!/usr/bin/env python3
"""
Real Biological Drosophila Connectome Processor (BANC / FlyWire / Janelia)
========================================================================
Extracts and normalizes the 169,315 real neuron coordinates, predicted
neurotransmitters, and anatomical regions from banc_888_meta.feather.
Outputs ultra-fast compact binary buffers and JSON metadata for Three.js.
"""

import sys
import json
from pathlib import Path
import numpy as np
import pyarrow.feather as feather

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "public" / "data" / "fly_connectome"
FEATHER_PATH = DATA_DIR / "raw" / "banc_888_meta.feather"

# Canonical Neurotransmitter mapping & color palette
NT_MAP = {
    "acetylcholine": {"id": 1, "name": "Acetylcholine (Coligérnico - Excitador)", "color": "#06b6d4"},
    "glutamate": {"id": 2, "name": "Glutamate (Glutamatérgico - Excitador/Inhibidor)", "color": "#10b981"},
    "gaba": {"id": 3, "name": "GABA (GABAérgico - Inhibidor Principal)", "color": "#ef4444"},
    "dopamine": {"id": 4, "name": "Dopamine (Dopaminérgico - Aprendizaje / Recompensa)", "color": "#f59e0b"},
    "histamine": {"id": 5, "name": "Histamine (Histaminérgico - Fotorreceptores)", "color": "#8b5cf6"},
    "octopamine": {"id": 6, "name": "Octopamine (Octopaminérgico - Alerta / Vuelo)", "color": "#ec4899"},
    "serotonin": {"id": 7, "name": "Serotonin (Serotoninérgico - Estado de Ánimo / Hambre)", "color": "#3b82f6"},
    "tyramine": {"id": 8, "name": "Tyramine (Tiraminérgico - Modulador Motor)", "color": "#14b8a6"},
    "unknown": {"id": 0, "name": "No Determinado / Glia", "color": "#64748b"}
}

# Canonical Region Grouping
REGION_GROUPS = {
    "OPTIC_RIGHT": {"id": 1, "name": "Lóbulo Óptico Derecho (ME/LO/LOP)", "color": "#38bdf8"},
    "OPTIC_LEFT": {"id": 2, "name": "Lóbulo Óptico Izquierdo (ME/LO/LOP)", "color": "#0284c7"},
    "CENTRAL_BRAIN": {"id": 3, "name": "Cerebro Central / Complejo Central (EB/FB/PB/NO)", "color": "#10b981"},
    "MUSHROOM_BODY": {"id": 4, "name": "Cuerpos Pedunculados (Calyx / Lobes - Memoria)", "color": "#ec4899"},
    "ANTENNAL_LOBE": {"id": 5, "name": "Lóbulos Antenales (Olfato)", "color": "#f59e0b"},
    "SEZ_GNG": {"id": 6, "name": "Zona Subesofágica / GNG (Gusto / Alimentación)", "color": "#a855f7"},
    "VNC_T1": {"id": 7, "name": "Cordón Nervioso VNC T1 (Patas Delanteras)", "color": "#f97316"},
    "VNC_T2": {"id": 8, "name": "Cordón Nervioso VNC T2 (Patas Medias / Alas)", "color": "#ef4444"},
    "VNC_T3": {"id": 9, "name": "Cordón Nervioso VNC T3 (Patas Traseras)", "color": "#e11d48"},
    "VNC_ABDOMEN": {"id": 10, "name": "Cordón Nervioso Abdominal (ABDNM)", "color": "#6366f1"},
    "OTHER": {"id": 0, "name": "Otras Vías de Conexión", "color": "#64748b"}
}

def classify_region(region_str):
    if not isinstance(region_str, str):
        return "OTHER"
    r = region_str.upper()
    if "_R" in r and any(k in r for k in ["ME", "LO", "LOP", "AME"]):
        return "OPTIC_RIGHT"
    if "_L" in r and any(k in r for k in ["ME", "LO", "LOP", "AME"]):
        return "OPTIC_LEFT"
    if any(k in r for k in ["AL_", "AL_L", "AL_R"]):
        return "ANTENNAL_LOBE"
    if any(k in r for k in ["MB_", "CA_", "PED", "LOBES"]):
        return "MUSHROOM_BODY"
    if any(k in r for k in ["EB", "FB", "PB", "NO", "AB"]):
        return "CENTRAL_BRAIN"
    if any(k in r for k in ["GNG", "SEZ", "SOG"]):
        return "SEZ_GNG"
    if "PRONM" in r or "T1" in r:
        return "VNC_T1"
    if "MESONM" in r or "T2" in r or "ANM" in r:
        return "VNC_T2"
    if "METANM" in r or "T3" in r:
        return "VNC_T3"
    if "ABD" in r:
        return "VNC_ABDOMEN"
    return "OTHER"

def main():
    print(f"📖 Leyendo dataset de microscopía electrónica: {FEATHER_PATH} ...")
    if not FEATHER_PATH.exists():
        print(f"❌ Error: {FEATHER_PATH} no existe.")
        sys.exit(1)
        
    df = feather.read_feather(FEATHER_PATH)
    total_raw = len(df)
    print(f"ℹ️ Total neuronas registradas en BANC: {total_raw}")
    
    valid_mask = df["root_position_nm"].notna()
    valid_df = df[valid_mask].copy()
    count = len(valid_df)
    print(f"🔍 Neuronas con coordenadas 3D nanométricas verificadas: {count}")
    
    # Extraer coordenadas
    coords = np.zeros((count, 3), dtype=np.float32)
    for idx, pos_str in enumerate(valid_df["root_position_nm"]):
        p = [float(v.strip()) for v in pos_str.split(",")]
        coords[idx] = p
        
    # Normalización biométrica
    min_b = coords.min(axis=0)
    max_b = coords.max(axis=0)
    center = (min_b + max_b) / 2.0
    extent = (max_b - min_b).max()
    
    # Coordenadas orientadas para Three.js:
    # X: Lateral (-100 a +100)
    # Y: Dorsal/Ventral (-80 a +160)
    # Z: Antero-Posterior (-40 a +40)
    normalized = (coords - center) / extent * 240.0
    threejs_positions = np.zeros((count, 3), dtype=np.float32)
    threejs_positions[:, 0] = normalized[:, 0]
    threejs_positions[:, 1] = -normalized[:, 1] + 35.0  # Orientar encéfalo arriba
    threejs_positions[:, 2] = normalized[:, 2]
    
    # Extraer atributos: 1 byte para Neurotransmisor, 1 byte para Región
    attributes = np.zeros((count, 2), dtype=np.uint8)
    
    nt_counts = {}
    region_counts = {}
    
    for idx, (_, row) in enumerate(valid_df.iterrows()):
        # Neurotransmisor
        nt = str(row.get("neurotransmitter_predicted") or "").lower().strip()
        nt_info = NT_MAP.get(nt, NT_MAP["unknown"])
        attributes[idx, 0] = nt_info["id"]
        nt_counts[nt_info["name"]] = nt_counts.get(nt_info["name"], 0) + 1
        
        # Región anatómica
        reg = classify_region(row.get("root_region"))
        reg_info = REGION_GROUPS.get(reg, REGION_GROUPS["OTHER"])
        attributes[idx, 1] = reg_info["id"]
        region_counts[reg_info["name"]] = region_counts.get(reg_info["name"], 0) + 1

    # Guardar archivos binarios ultrarrápidos
    pos_file = DATA_DIR / "real_banc_169k_positions.bin"
    attr_file = DATA_DIR / "real_banc_169k_attributes.bin"
    
    print(f"💾 Escribiendo buffer de posiciones: {pos_file} ({threejs_positions.nbytes / 1024 / 1024:.2f} MB)...")
    threejs_positions.tofile(pos_file)
    
    print(f"💾 Escribiendo buffer de atributos: {attr_file} ({attributes.nbytes / 1024:.1f} KB)...")
    attributes.tofile(attr_file)
    
    # Extraer muestra de neuronas canónicas famosas con sus IDs reales
    canonical_samples = []
    # Buscar células de Kenyon (Mushroom Body)
    mb_neurons = valid_df[valid_df["cell_class"].str.contains("kenyon|Kenyon", na=False)].head(5)
    for _, row in mb_neurons.iterrows():
        canonical_samples.append({
            "root_id": str(row["root_id"]),
            "class": "Célula de Kenyon (Kenyon Cell)",
            "role": "Memoria Asociativa Olfativa y Aprendizaje",
            "region": "Cuerpos Pedunculados (Mushroom Body)",
            "neurotransmitter": str(row.get("neurotransmitter_predicted")),
            "synapses_in": int(row.get("input_connections") or 0),
            "synapses_out": int(row.get("output_connections") or 0)
        })
        
    # Buscar neuronas brújula (E-PG / Central Complex)
    cx_neurons = valid_df[valid_df["cell_class"].str.contains("central_complex|compass|epg|E-PG", case=False, na=False)].head(5)
    for _, row in cx_neurons.iterrows():
        canonical_samples.append({
            "root_id": str(row["root_id"]),
            "class": "Neurona Brújula E-PG (Ellipsoid Body)",
            "role": "Orientación Espacial y Brújula de Rumbo 360°",
            "region": "Complejo Central (Central Complex)",
            "neurotransmitter": str(row.get("neurotransmitter_predicted")),
            "synapses_in": int(row.get("input_connections") or 0),
            "synapses_out": int(row.get("output_connections") or 0)
        })
        
    # Buscar neuronas motoras descendentes (DN)
    dn_neurons = valid_df[valid_df["super_class"] == "descending"].head(5)
    for _, row in dn_neurons.iterrows():
        canonical_samples.append({
            "root_id": str(row["root_id"]),
            "class": "Neurona Descendente Motora (DNa/DN)",
            "role": "Control Motor Directo Cerebro -> Patas / Alas",
            "region": "Cordón Nervioso Ventral (VNC)",
            "neurotransmitter": str(row.get("neurotransmitter_predicted")),
            "synapses_in": int(row.get("input_connections") or 0),
            "synapses_out": int(row.get("output_connections") or 0)
        })

    # Guardar Metadata JSON
    meta = {
        "dataset_name": "BANC v888 (Brain and Nerve Cord) / FlyWire / Janelia",
        "citation": "Lee, Sterling, et al. (Harvard Medical School, HHMI Janelia, Princeton)",
        "total_neurons_scanned": count,
        "source_format": "Serial-section Transmission Electron Microscopy (ssTEM)",
        "resolution_nm": [4, 4, 40],
        "bounds_nm": {
            "min": min_b.tolist(),
            "max": max_b.tolist(),
            "center": center.tolist(),
            "dimensions_um": ((max_b - min_b) / 1000.0).tolist()
        },
        "neurotransmitters": NT_MAP,
        "neurotransmitter_counts": nt_counts,
        "region_groups": REGION_GROUPS,
        "region_counts": region_counts,
        "canonical_samples": canonical_samples
    }
    
    meta_file = DATA_DIR / "real_banc_169k_meta.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print(f"✅ Metadata biológica guardada en: {meta_file}")
    print("🎉 ¡Procesamiento completado con éxito!")

if __name__ == "__main__":
    main()

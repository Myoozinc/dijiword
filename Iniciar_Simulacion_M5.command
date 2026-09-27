#!/bin/bash
# ==============================================================================
# Dijiword - Lanzador de 1 Clic para Motor de Física MuJoCo M5 en macOS
# ==============================================================================
cd "$(dirname "$0")"

echo "======================================================================"
echo "🧠 Iniciando Motor Físico Científico MuJoCo en Apple Silicon M5"
echo "======================================================================"
echo ""
python3 scripts/flygym_m5_bridge.py

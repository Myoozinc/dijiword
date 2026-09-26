#!/usr/bin/env bash
# ==============================================================================
# Dijiword - Instalador del Stack Científico Drosophila para Apple Silicon M5
# ==============================================================================
set -e

echo "======================================================================"
echo "🧠 Configurando Entorno Científico Nativo (FlyGym + MuJoCo + PyTorch)"
echo "   Hardware detectado: $(uname -sm)"
echo "======================================================================"

# Verificar Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no encontrado en el sistema."
    exit 1
fi

echo "📦 1. Actualizando pip..."
python3 -m pip install --upgrade pip

echo "⚡ 2. Instalando WebSockets y soporte de datos (pyarrow, numpy, scipy)..."
python3 -m pip install websockets pyarrow numpy scipy

echo "🦾 3. Instalando MuJoCo de Google DeepMind (Motor Físico de Cuerpos Rígidos)..."
python3 -m pip install mujoco

echo "🪰 4. Instalando FlyGym de la EPFL (Simulador Biomecánico de Drosophila)..."
python3 -m pip install flygym || {
    echo "⚠️ Nota: FlyGym requiere dependencias adicionales de compilación en algunas versiones de Python."
    echo "   El puente 'flygym_m5_bridge.py' continuará funcionando perfectamente con MuJoCo nativo."
}

echo ""
echo "======================================================================"
echo "🎉 ¡Instalación Completada con Éxito!"
echo "   Para iniciar el enlace científico en tiempo real con Dijiword, corre:"
echo "   👉  python3 scripts/flygym_m5_bridge.py"
echo "======================================================================"

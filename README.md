# DijiWord 3D — Spatial Room Mapper & Simulator

Una aplicación web progresiva (PWA) de alto rendimiento capaz de mapear espacios físicos reales y generar una simulación 3D interactiva utilizando **únicamente la cámara RGB estándar de cualquier smartphone** (sin requerir sensores LiDAR obligatorios).

---

## 🚀 Características Principales

### 1. Mapeo Espacial Monocular (Cámara del Teléfono)
- **Computer Vision en Tiempo Real:** Detección de esquinas y seguimiento de características ópticas a 60 FPS mediante HTML5 Canvas y WebGL.
- **Triangulación por Paralaje de Movimiento (Depth-from-Motion):** Estima la profundidad y distancias relativas de suelo, paredes y techo a medida que el usuario recorre la habitación con su móvil.
- **Fusión de Sensores Inerciales:** Integra el giroscopio y acelerómetro del dispositivo (`DeviceOrientation` y `DeviceMotion`) con horizonte artificial y brújula.
- **HUD con Indicador de Cobertura 360°:** Guía visual interactiva que monitorea el avance del escaneo (Suelo, Techo, Pared Norte, Sur, Este y Oeste) y contabiliza miles de puntos 3D generados en vivo.

### 2. Simulación 3D Interactiva (Three.js WebGL)
- **Modo Paseo Virtual en 1ª Persona:** Permite "caminar" dentro de la habitación reconstruida a escala real (1.65m de altura de ojos) mediante joystick virtual táctil y detección de colisión con las paredes.
- **Modo Orbital 3D & Dollhouse:** Rotación 360° fluida, zoom por pellizco y botones de vista rápida (Planta 2D arquitectónica, Isométrica 3D y Frontal).
- **Estilos de Renderizado:**
  - 🌟 **Texturizado Realista:** Muros arquitectónicos, suelo de parqué de roble reflectante y ventanal panorámico.
  - 🌐 **Nube de Puntos Espacial:** Visualización estilo escáner láser LiDAR con shaders de color.
  - 📐 **Plano CAD Blueprint:** Malla técnica en cian brillante con rejilla de suelo y cotas de medida.
  - 🌈 **Termografía / Profundidad:** Mapa de calor de distancias relativas.

### 3. Simulador de Iluminación y Luz Solar
- **Control de Ciclo Solar:** Control deslizante de hora del día (08:00 a 22:00 hrs) que calcula la posición exacta del sol, temperatura de color Kelvin (amanecer dorado, luz diurna neutra, atardecer y noche estrellada) y sombras dinámicas en tiempo real.

### 4. Simulador de Mobiliario y Distribución
- Catálogo de elementos 3D procedimentales: Sofá 3 plazas, Cama Queen, Mesa de comedor, Escritorio de trabajo, Lámpara de pie nórdica (con luz funcional), Planta de interior, Smart TV y Maniquí humano a escala 1:1 (1.75m) para comprobación ergonómica de espacios.
- Posicionamiento, rotación y eliminación interactiva con controles táctiles.

### 5. Cinta Métrica 3D & Métricas Arquitectónicas
- Herramienta para medir distancias reales entre dos puntos cualesquiera del modelo 3D con indicador de metros y pies.
- Cálculo automático de:
  - Ancho, Largo y Altura de la habitación ($m$ y $ft$).
  - Superficie de planta ($m^2$ y $sq\ ft$).
  - Volumen cúbico total ($m^3$ y $cu\ ft$).

### 6. Exportación y Biblioteca de Presets
- Exportación a **`.OBJ`** (Malla 3D estándar para Blender, Maya, Unity, Unreal Engine o impresión 3D).
- Exportación a **`.PLY`** (Formato de nubes de puntos de escáner 3D).
- Exportación a **`.JSON`** (Estado completo de la simulación).
- Demos 3D pre-cargadas para probar la simulación inmediatamente en cualquier dispositivo:
  - Apartamento de Diseño ($17.5\ m^2$)
  - Estudio Creativo & Tech ($21.8\ m^2$)
  - Dormitorio Minimalista ($12.9\ m^2$)

---

## 🛠️ Tecnologías Utilizadas

- **Framework Frontend:** React 18 + Vite
- **Motor 3D & WebGL:** Three.js
- **Estilos & UI:** Tailwind CSS + Lucide Icons
- **Visión por Computador:** HTML5 Canvas ImageData + Pinhole Camera Intrinsics + Sensor Fusion API

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (accesible desde el móvil en la misma red Wi-Fi)
npm run dev

# Compilar para producción
npm run build
```

---

## 🌐 Despliegue en Vercel

Este proyecto está configurado para desplegarse automáticamente en Vercel:

1. Framework Preset: **Vite**
2. Root Directory: `./`
3. Build Command: `npm run build`
4. Output Directory: `dist`

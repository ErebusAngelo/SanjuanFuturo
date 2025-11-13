# Sistema Multi-Pantalla - San Juan Futuro

## 📋 Descripción General

Sistema interactivo con múltiples pantallas táctiles (totems) y una pantalla LED central que genera imágenes colaborativas usando IA (Flux + LoRA).

## 🖥️ Componentes del Sistema

### 1. **Totems Touch (Pantallas de Jugadores)**
- **Pantalla 2** (`pantalla2.html`): Ingreso de nombre de usuario
- **Pantalla 3** (`pantalla3.html`): Selección de palabras por categorías
- **Identificación**: Cada totem se identifica con `?jugador=1`, `?jugador=2`, `?jugador=3`, etc.

### 2. **Pantalla LED (Avatar)**
- **Archivo**: `avatar.html`
- **Estados**:
  - 🔄 **Loop**: Video en bucle (estado inicial)
  - 👋 **Bienvenida**: Mensaje de bienvenida
  - ⏳ **Generando**: Muestra progreso de generación de imagen
  - 🖼️ **Imagen**: Muestra la imagen generada
  - 🙏 **Agradecimiento**: Mensaje de gracias antes de reiniciar

### 3. **Panel de Control**
- **Archivo**: `controlpanel.html`
- **Funciones**:
  - Configurar cantidad de jugadores (1-4)
  - Monitorear conexiones de jugadores
  - Ver estado de pantalla LED
  - Ver logs del sistema
  - Reiniciar sistema

## 🚀 Cómo Usar el Sistema

### Configuración Inicial

1. **Iniciar el servidor**:
   ```bash
   node server.js
   ```

2. **Abrir el Panel de Control**:
   ```
   http://localhost:6250/controlpanel.html
   ```
   - Configurar cantidad de jugadores (por defecto: 3)

3. **Abrir la Pantalla LED (Avatar)**:
   ```
   http://localhost:6250/avatar.html
   ```

4. **Abrir los Totems Touch**:
   - Jugador 1: `http://localhost:6250/pantalla2.html?jugador=1`
   - Jugador 2: `http://localhost:6250/pantalla2.html?jugador=2`
   - Jugador 3: `http://localhost:6250/pantalla2.html?jugador=3`

### Flujo de Trabajo

1. **Inicio**: 
   - Pantalla LED muestra video en loop
   - Totems esperan jugadores

2. **Jugadores ingresan**:
   - Cada jugador ingresa su nombre en Pantalla 2
   - Sistema registra la conexión

3. **Selección de palabras**:
   - Jugadores pasan a Pantalla 3
   - Seleccionan 2 palabras por cada una de las 4 categorías:
     - Innovación y Tecnología
     - Agricultura y Ganadería
     - Minería, Industria y Comercio
     - Talento y Oportunidades

4. **Generación de imagen**:
   - Cuando todos los jugadores completan sus selecciones
   - Sistema combina todos los prompts
   - Pantalla LED cambia a estado "Generando"
   - ComfyUI genera imagen con Flux + LoRA de San Juan

5. **Mostrar resultado**:
   - Pantalla LED muestra la imagen generada (10 segundos)
   - Muestra mensaje de agradecimiento (5 segundos)
   - Vuelve al video loop automáticamente

6. **Reinicio**:
   - Sistema se reinicia automáticamente
   - Jugadores pueden volver a participar

## 🔧 Configuración de ComfyUI

### Requisitos

Asegúrate de tener en ComfyUI:

1. **Modelo Flux**:
   - Archivo: `flux1-dev-fp8.safetensors`
   - Ubicación: `ComfyUI/models/checkpoints/`

2. **LoRA de San Juan**:
   - Archivo: `Flux_SanJuanv1.safetensors`
   - Ubicación: `ComfyUI/models/loras/`

### Workflow

El sistema usa el workflow definido en `workflow_api.json`:
- Checkpoint: Flux Dev FP8
- LoRA: San Juan v1 (strength: 1.0)
- Guidance: 3.5
- Steps: 20
- Scheduler: Simple
- Sampler: Euler
- Resolución: 1184x1184

## 📡 Comunicación WebSocket

### Tipos de Mensajes

#### Registro de Clientes
```javascript
{
  type: 'register',
  clientType: 'player' | 'avatar' | 'control_panel',
  playerId: '1' | '2' | '3' // solo para jugadores
}
```

#### Cambio de Estado del Avatar
```javascript
{
  type: 'change_state',
  state: 'loop' | 'welcome' | 'loading' | 'image' | 'thanks'
}
```

#### Envío de Prompt del Jugador
```javascript
{
  type: 'player_prompt',
  prompt: 'San Juan del futuro con: ...'
}
```

#### Reinicio del Sistema
```javascript
{
  type: 'reset_system'
}
```

## 📁 Estructura de Archivos

```
SanjuanFuturo/
├── public/
│   ├── avatar.html              # Pantalla LED
│   ├── controlpanel.html        # Panel de control
│   ├── pantalla2.html           # Totem: Ingreso de nombre
│   ├── pantalla3.html           # Totem: Selección de palabras
│   ├── promptgenerator.html     # Generador manual (opcional)
│   ├── js/
│   │   ├── pantalla2.js         # Lógica pantalla 2
│   │   └── pantalla3.js         # Lógica pantalla 3
│   ├── css/
│   │   ├── pantalla2.css
│   │   └── pantalla3.css
│   ├── video/
│   │   └── loop.mp4             # Video para pantalla LED
│   └── imagenes/                # Imágenes generadas (gitignored)
├── server.js                    # Servidor Node.js
├── workflow_api.json            # Workflow de ComfyUI (Flux)
└── config.json                  # Configuración de ComfyUI
```

## 🎮 Panel de Control

### Indicadores

- **Jugadores Activos**: Cantidad de jugadores conectados
- **Total Conexiones**: Jugadores + Avatar
- **Imágenes Generadas**: Contador de sesiones completadas

### Estado de Jugadores

Cada jugador muestra:
- ✅ Conectado / ❌ Desconectado
- Pantalla actual (pantalla2 o pantalla3)

### Estado del Avatar

- Estado de conexión
- Estado actual (loop, loading, image, etc.)

## 🔄 Reinicio del Sistema

### Automático
- Después de mostrar la imagen y el agradecimiento
- Vuelve al estado de video loop

### Manual
- Desde el Panel de Control
- Botón "Reiniciar Sistema"
- Limpia todas las selecciones de jugadores
- Vuelve todos los totems a pantalla 2

## 🐛 Troubleshooting

### Los jugadores no se conectan
- Verificar que la URL incluya `?jugador=X`
- Revisar consola del navegador
- Verificar que el servidor esté corriendo

### La pantalla LED no cambia de estado
- Verificar conexión WebSocket
- Revisar logs del servidor
- Verificar que todos los jugadores hayan completado

### ComfyUI no genera imágenes
- Verificar que ComfyUI esté corriendo en `http://localhost:8188`
- Verificar que los modelos estén instalados
- Revisar `config.json`

## 📝 Notas Importantes

1. **Video Loop**: Asegúrate de tener el archivo `public/video/loop.mp4`
2. **Imágenes**: La carpeta `public/imagenes/` está en `.gitignore`
3. **Jugadores**: El sistema soporta 1-4 jugadores simultáneos
4. **Timeout**: Si un jugador se desconecta, el sistema lo detecta automáticamente

## 🎨 Personalización

### Cambiar cantidad de categorías
Editar `pantalla3.js` → `categoriesData`

### Cambiar parámetros de generación
Editar `server.js` → función `generateCombinedImage()`

### Cambiar tiempos de visualización
Editar `avatar.html` → timeouts en función `showGeneratedImage()`

# San Juan Futuro - Generador de Imágenes

Aplicación web para generar imágenes usando ComfyUI con la estética del proyecto "El San Juan que Quiero".

## Características

- Servidor Express con WebSocket para comunicación en tiempo real
- Integración con ComfyUI para generación de imágenes
- Interfaz web con la estética del proyecto (colores cyan/turquesa neón)
- Generador de prompts interactivo
- Progreso en tiempo real de la generación

## Requisitos

- Node.js (v14 o superior)
- ComfyUI ejecutándose localmente (por defecto en `http://localhost:8188`)
- Modelo `realvisxl.safetensors` instalado en ComfyUI

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar ComfyUI:
   - Edita `config.json` si tu ComfyUI está en una URL diferente
   - Por defecto usa `http://localhost:8188`

## Uso

1. Iniciar el servidor:
```bash
npm start
```

2. Abrir en el navegador:
   - Página principal: `http://localhost:3000`
   - Generador de imágenes: `http://localhost:3000/promptgenerator.html`

3. Ingresar un prompt y hacer clic en "GENERAR IMAGEN"

## Estructura del Proyecto

```
SanjuanFuturo/
├── server.js              # Servidor Express + WebSocket
├── workflow_api.json      # Configuración del workflow de ComfyUI
├── config.json           # Configuración de conexión a ComfyUI
├── package.json          # Dependencias del proyecto
└── public/
    ├── index.html        # Página principal
    ├── promptgenerator.html  # Generador de imágenes
    ├── imagenes/         # Carpeta para imágenes generadas
    ├── css/
    │   └── style.css     # Estilos del proyecto
    ├── fonts/            # Fuentes Roboto y Arkitech
    ├── assets/           # Recursos adicionales
    └── js/               # Scripts adicionales
```

## Parámetros de Generación

Por defecto, las imágenes se generan con:
- **Steps**: 6
- **Tamaño**: 1080x1080
- **Modelo**: realvisxl.safetensors
- **Sampler**: euler
- **CFG**: 2

Puedes modificar estos parámetros en `promptgenerator.html` o en el servidor.

## API WebSocket

El servidor acepta mensajes WebSocket con el siguiente formato:

```json
{
  "type": "generarImagen",
  "prompt": "tu descripción aquí",
  "params": {
    "steps": 6,
    "width": 1080,
    "height": 1080,
    "model": "realvisxl.safetensors"
  }
}
```

## Solución de Problemas

### No se conecta a ComfyUI
- Verifica que ComfyUI esté ejecutándose
- Revisa la URL en `config.json`
- Comprueba que el puerto 8188 esté disponible

### El modelo no se encuentra
- Asegúrate de tener `realvisxl.safetensors` en la carpeta de modelos de ComfyUI
- O cambia el modelo en `workflow_api.json` por uno que tengas instalado

### Error al generar imágenes
- Revisa los logs del servidor en la consola
- Verifica que el workflow_api.json sea compatible con tu versión de ComfyUI

## Licencia

MIT

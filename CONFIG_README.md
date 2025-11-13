# Guía de Configuración Visual - config.js

Este archivo contiene todas las variables configurables de la aplicación para ajustes visuales.

## 📍 Ubicación
`public/config.js`

## 🎨 Variables Principales

### Colores
```javascript
colors: {
    primary: '#00D4FF',        // Celeste principal
    secondary: '#FFFFFF',      // Blanco
    background: '#000000'      // Negro
}
```

### Imagen Generada (Avatar - Carta Legendaria)
```javascript
generatedImage: {
    maxWidth: '400px',         // ⭐ Tamaño máximo de la imagen
    maxHeight: '400px',        // ⭐ Tamaño máximo de la imagen
    glowColor: '#00D4FF',      // Color del glow (celeste)
    glowIntensity: '30px',     // Intensidad del glow
    animationDuration: '1.5s'  // Duración de la animación
}
```

### Barra de Progreso
```javascript
progressBar: {
    color: '#00D4FF',          // Color de la barra (celeste)
    strokeWidth: 8,            // Grosor de la línea
    glowIntensity: '15px'      // Intensidad del glow
}
```

### Galería
```javascript
gallery: {
    gridGap: '15px',           // ⭐ Separación entre imágenes
    itemBorderRadius: '8px',   // Radio de borde
    itemBorder: '2px solid #00D4FF', // Borde de cada imagen
    glowIntensity: '10px'      // Glow de las imágenes
}
```

### Shader FBM (Pantalla 3)
```javascript
shader: {
    enabled: false,            // Se activa con ?shader=true en URL
    colors: {
        primary: '#00D4FF',    // Celeste
        secondary: '#FFFFFF'   // Blanco
    },
    animation: {
        speed: 0.5,            // Velocidad de animación base
        rippleSpeed: 2.0,      // Velocidad de ondas
        rippleDuration: 1.5    // Duración del efecto (segundos)
    }
}
```

## 🚀 Cómo Usar

### Cambiar el tamaño de la imagen generada
1. Abre `public/config.js`
2. Modifica `generatedImage.maxWidth` y `generatedImage.maxHeight`
3. Guarda el archivo
4. Recarga la página

### Cambiar la separación de la galería
1. Abre `public/config.js`
2. Modifica `gallery.gridGap` (ej: `'10px'`, `'20px'`)
3. Guarda y recarga

### Activar el shader FBM en pantalla3
Agrega `?shader=true` a la URL:
```
http://localhost:6250/pantalla3.html?jugador=1&shader=true
```

El shader reemplazará el SVG del círculo con un efecto FBM animado que reacciona cuando sueltas las esferitas.

## 📝 Notas
- Los cambios en `config.js` requieren recargar la página
- Los valores de color deben estar en formato hexadecimal (#RRGGBB)
- Los tamaños pueden usar 'px', '%', 'rem', etc.
- El shader solo funciona con `?shader=true` en la URL

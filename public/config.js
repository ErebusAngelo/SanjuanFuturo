// Configuración visual de la aplicación
const CONFIG = {
    // Colores principales
    colors: {
        primary: '#00D4FF',        // Celeste principal
        secondary: '#FFFFFF',      // Blanco
        background: '#000000',     // Negro
        golden: '#FFD700'          // Dorado (solo para referencias, no usar en UI principal)
    },
    
    // Avatar.html - Imagen generada (carta legendaria)
    generatedImage: {
        maxWidth: '100px',         // Tamaño máximo de la imagen generada
        maxHeight: '100px',
        glowColor: '#00D4FF',      // Color del glow (celeste principal)
        glowIntensity: '30px',     // Intensidad del glow
        animationDuration: '1.5s', // Duración de la animación de reveal
        displayDuration: 5000     // Tiempo que permanece visible la imagen (10 segundos)
    },

    // Mega algoritmo de generación de imágenes
    imageGeneration: {
        fluxGuidance: 3.5,         // Flux guidance calibrado
        fuerzaSanJuan: 0.55,       // Fuerza San Juan calibrada
        fuerzaSolarpunk: 0.8,      // Fuerza Solarpunk calibrada
        steps: 20,                 // Steps calibrados
        variabilityFactor: 0.45    // Factor de variabilidad para generar imágenes diversas
    },
    
    // Avatar.html - Barra de progreso
    progressBar: {
        color: '#00D4FF',          // Color de la barra (celeste, NO dorado)
        strokeWidth: 8,            // Grosor de la línea
        glowIntensity: '15px'      // Intensidad del glow
    },
    
    // Avatar.html - Galería
    gallery: {
        gridGap: '15px',
        itemBorderRadius: '8px',
        itemBorder: '2px solid #00D4FF',
        glowIntensity: 0.5,
        displayDuration: 15000, // 15 segundos por defecto
        maxOrbitalImages: 8 // Cantidad máxima de imágenes orbitales
    },
    
    // Avatar.html - Marco circular
    circleFrame: {
        strokeWidth: 5,
        glowIntensity: '10px'
    },
    
    // Pantalla3 - Shader FBM
    shader: {
        enabled: false,            // Se activa con ?shader=true en URL
        colors: {
            primary: '#00D4FF',    // Celeste
            secondary: '#FFFFFF'   // Blanco
        },
        animation: {
            speed: 0.2,            // Velocidad de animación base del FBM
            rippleSpeed: 0.3,      // Velocidad de expansión de la onda (0.3 = lento)
            rippleDuration: 8.0    // Duración del efecto de onda en segundos (¡AHORA SÍ FUNCIONA!)
        }
    },
    
    // Tipografía 
    fonts: {
        primary: 'Roboto',
        display: 'Arkitech'
    }
};

// Hacer CONFIG accesible globalmente
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

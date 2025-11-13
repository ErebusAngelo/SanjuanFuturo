// Shader FBM para pantalla3 - Activado con ?shader=true
// Reemplaza el SVG de la elipse con un shader animado

let ripples = [];
let vertShader = null;
let fragShader = null;

// Verificar si el shader está habilitado
function isShaderEnabled() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('shader') === 'true';
}

// Cargar shaders desde archivos
async function loadShaders() {
    try {
        const vertResponse = await fetch('sh/sh.vert');
        const fragResponse = await fetch('sh/sh.frag');
        
        vertShader = await vertResponse.text();
        fragShader = await fragResponse.text();
        
        console.log('✅ Shaders cargados desde archivos');
        return true;
    } catch (error) {
        console.error('❌ Error cargando shaders:', error);
        
        // Fallback: usar shaders inline
        vertShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    vec4 positionVec4 = vec4(aPosition, 1.0);
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
    gl_Position = positionVec4;
}
`;

        fragShader = `
precision mediump float;

varying vec2 vTexCoord;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_ripples[10];

const vec3 COLOR_CYAN = vec3(0.0, 0.831, 1.0);
const vec3 COLOR_WHITE = vec3(1.0, 1.0, 1.0);

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 2.0;
    for(int i = 0; i < 5; i++) {
        value += amplitude * noise(st * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 st = vTexCoord;
    vec2 pos = st * 2.0 - 1.0;
    float dist = length(pos);
    float circleMask = 1.0 - smoothstep(0.9, 1.0, dist);
    vec2 fbmCoord = st * 3.0;
    fbmCoord.x += u_time * 0.1;
    fbmCoord.y += u_time * 0.05;
    float fbmValue = fbm(fbmCoord);
    float rippleEffect = 0.0;
    for(int i = 0; i < 10; i++) {
        if(u_ripples[i].z > 0.0) {
            vec2 ripplePos = u_ripples[i].xy;
            float rippleDist = length(st - ripplePos);
            float rippleStrength = u_ripples[i].z;
            float wave = sin(rippleDist * 20.0 - u_time * 5.0) * 0.5 + 0.5;
            wave *= exp(-rippleDist * 3.0);
            wave *= rippleStrength;
            rippleEffect += wave;
        }
    }
    fbmValue += rippleEffect * 0.5;
    vec3 color = mix(COLOR_CYAN, COLOR_WHITE, fbmValue);
    float centerGlow = 1.0 - smoothstep(0.0, 0.5, dist);
    color += COLOR_WHITE * centerGlow * 0.3;
    color *= circleMask;
    float edgeGlow = smoothstep(0.85, 0.95, dist) * circleMask;
    color += COLOR_CYAN * edgeGlow * 0.5;
    gl_FragColor = vec4(color, circleMask);
}
`;
        return true;
    }
}


// Agregar ripple cuando se suelta una esferita
function addRipple(x, y) {
    if (!isShaderEnabled()) return;
    
    // Convertir coordenadas de pantalla a coordenadas del shader (0-1)
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
    const rect = dropZone.getBoundingClientRect();
    const normalizedX = (x - rect.left) / rect.width;
    const normalizedY = (y - rect.top) / rect.height;
    
    ripples.push({
        x: normalizedX,
        y: normalizedY,
        strength: 1.0
    });
    
    console.log('🌊 Ripple agregado en:', normalizedX, normalizedY);
}

// Integración con p5.js - Crear instancia separada para el shader
if (isShaderEnabled()) {
    console.log('🎨 Shader habilitado, esperando carga...');
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initShaderInstance);
    } else {
        initShaderInstance();
    }
}

async function initShaderInstance() {
    console.log('🎨 Inicializando instancia de shader...');
    
    // Cargar shaders primero
    await loadShaders();
    
    // Esperar un poco para que el dropZone esté en el DOM
    setTimeout(() => {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) {
            console.error('❌ dropZone no encontrado');
            return;
        }
        
        console.log('✅ dropZone encontrado, creando shader...');
        
        // Crear instancia de p5 para el shader
        new p5((p) => {
            let shaderCanvas;
            let fbmShader;
            let time = 0;
            
            p.setup = function() {
                console.log('🎨 Setup del shader...');
                
                // Obtener dimensiones del dropZone
                const rect = dropZone.getBoundingClientRect();
                
                // Usar el ancho del dropZone pero limitado a 650px (max-width del ellipse-container)
                const maxSize = 650;
                let size = Math.min(rect.width, maxSize);
                
                console.log('📐 Tamaño del canvas:', size, 'px (limitado a', maxSize, 'px)');
                
                // Crear canvas WebGL
                shaderCanvas = p.createCanvas(size, size, p.WEBGL);
                shaderCanvas.parent('dropZone');
                shaderCanvas.style('position', 'relative');
                shaderCanvas.style('display', 'block');
                shaderCanvas.style('margin', '0 auto');
                shaderCanvas.style('border-radius', '50%');
                shaderCanvas.style('pointer-events', 'none');
                
                // Crear shader
                fbmShader = p.createShader(vertShader, fragShader);
                
                // Ocultar la imagen SVG original
                const ellipsePlanet = dropZone.querySelector('.ellipse-planet');
                if (ellipsePlanet) {
                    ellipsePlanet.style.display = 'none';
                    console.log('✅ Imagen SVG ocultada');
                }
                
                console.log('✅ Shader FBM inicializado correctamente');
            };
            
            p.draw = function() {
                p.shader(fbmShader);
                
                // Pasar uniforms
                fbmShader.setUniform('u_resolution', [p.width, p.height]);
                fbmShader.setUniform('u_time', time);
                
                // Pasar ripples (máximo 10)
                const rippleData = [];
                for (let i = 0; i < 10; i++) {
                    if (i < ripples.length) {
                        rippleData.push([ripples[i].x, ripples[i].y, ripples[i].strength]);
                    } else {
                        rippleData.push([0, 0, 0]);
                    }
                }
                fbmShader.setUniform('u_ripples', rippleData.flat());
                
                // Dibujar rectángulo que cubre todo el canvas
                p.rect(-p.width/2, -p.height/2, p.width, p.height);
                
                // Actualizar tiempo
                time += 0.016 * (CONFIG?.shader?.animation?.speed || 0.5);
                
                // Actualizar ripples (decay)
                ripples = ripples.filter(r => {
                    r.strength *= 0.95;
                    return r.strength > 0.01;
                });
            };
        });
    }, 500); // Esperar 500ms para asegurar que el DOM esté listo
}

// Exportar función para que pantalla3.js pueda llamarla
window.addShaderRipple = addRipple;

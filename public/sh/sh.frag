precision mediump float;

varying vec2 vTexCoord;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_ripples[3]; // x, y, tiempo de vida
uniform float u_ripple_duration; // Duración total del ripple
uniform float u_ripple_speed; // Velocidad de expansión

// Colores celeste y blanco
const vec3 COLOR_CYAN = vec3(0.0, 0.5, 1.0); // #00d5ff4b
const vec3 COLOR_BLUE = vec3(0.0, 0.2, 1.0); // #00d5ff4b
const vec3 COLOR_WHITE = vec3(1.0, 1.0, 1.0);

// Función de ruido 2D
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Ruido suave
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

// FBM (Fractional Brownian Motion)
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
    
    // Distancia desde el centro (para hacer círculo)
    float dist = length(pos);
    
    // Crear máscara circular con borde suave
    float circleMask = 1.0 - smoothstep(0.9, 1.0, dist);
    
    // Coordenadas para FBM
    vec2 fbmCoord = st * 1.0;
    fbmCoord.x += u_time * 0.15;
    fbmCoord.y += u_time * 0.1;
    
    // Calcular FBM
    float fbmValue = fbm(fbmCoord);
    

      // Coordenadas para FBM
    vec2 fbmCoord2 = st * .5;
    fbmCoord2.x += u_time * 0.1;
    fbmCoord2.y += u_time * 0.05;
    
    // Calcular FBM
    float fbmValue2 = fbm(fbmCoord2);
    
    // Agregar ondas de ripples (solo 3 ahora)
    float rippleEffect = 0.0;
    for(int i = 0; i < 3; i++) {
        float rippleTime = u_ripples[i].z; // Tiempo de vida del ripple
        
        // Solo procesar si el ripple está activo (tiempo >= 0)
        if(rippleTime >= 0.0) {
            vec2 ripplePos = vec2(u_ripples[i].x, 1.0 - u_ripples[i].y);
            float rippleDist = length(st - ripplePos);
            
            // Calcular strength basado en el tiempo (fade out suave)
            float normalizedTime = rippleTime / u_ripple_duration;
            float rippleStrength = 1.0 - normalizedTime; // Empieza en 1.0, termina en 0.0
            rippleStrength = smoothstep(0.0, 0.1, rippleStrength) * smoothstep(1.0, 0.0, normalizedTime);
            
            // Onda expansiva MUY lenta
            // La onda se expande con el tiempo usando u_ripple_speed
            float waveRadius = rippleTime * u_ripple_speed;
            float waveDist = abs(rippleDist - waveRadius);
            
            // Crear onda con decay espacial
            float wave = exp(-waveDist * 8.0); // Onda concentrada
            wave *= exp(-rippleDist * 0.5); // Decay general desde el centro
            wave *= rippleStrength; // Aplicar fade out temporal
            
            // Agregar desplazamiento al FBM
            rippleEffect += wave * 0.5;
        }
    }
    
    // Combinar FBM con ripples
    fbmValue += rippleEffect * 0.5;
    
    // Mezclar colores celeste y blanco basado en FBM
    vec3 color = mix(COLOR_CYAN, COLOR_WHITE, fbmValue);
    color = mix(color, COLOR_BLUE, fbmValue2*.5);
    // Agregar brillo en el centro
    float centerGlow = 1.0 - smoothstep(0.0, 0.5, dist);
   // color += COLOR_WHITE * centerGlow * 0.3;
    
    // Aplicar máscara circular
    //color *= circleMask;
    
    // Agregar glow en los bordes
    float edgeGlow = smoothstep(0.85, 0.95, dist) * circleMask;
   // color += COLOR_CYAN * edgeGlow * 0.5;
    
    gl_FragColor = vec4(color, 1.0);
}

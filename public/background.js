let particles = [];
let gridTravelers = [];
let gridSize = 40;
let time = 0;

function setup() {
    // Crear canvas de p5.js
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.id('p5Canvas');
    
    // Posicionar el canvas de p5
    let p5Canvas = document.getElementById('p5Canvas');
    if (p5Canvas) {
        p5Canvas.style.position = 'fixed';
        p5Canvas.style.top = '0';
        p5Canvas.style.left = '0';
        p5Canvas.style.zIndex = '-1';
        p5Canvas.style.pointerEvents = 'none';
        
        // SIEMPRE VISIBLE en todas las páginas
        p5Canvas.style.display = 'block';
    }
    
    // Crear partículas
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle());
    }
    
    // Crear viajeros de la cuadrícula
    for (let i = 0; i < 2; i++) {
        gridTravelers.push(new GridTraveler());
    }
}

function draw() {
    background(0, 30); // Fondo negro con trail más marcado para mejor rendimiento
    time += 0.01;
    
    // Dibujar grid sutil (cada 2 frames para mejor rendimiento)
    if (frameCount % 2 === 0) {
        drawGrid();
    }
    
    // Actualizar y mostrar partículas
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].show();
    }
    
    // Conectar partículas cercanas (solo cada 2 frames)
    if (frameCount % 2 === 0) {
        connectParticles();
    }
    
    // Actualizar y mostrar viajeros de la cuadrícula
    for (let i = 0; i < gridTravelers.length; i++) {
        gridTravelers[i].update();
        gridTravelers[i].show();
    }
}

function drawGrid() {
    stroke(0, 159, 227, 8); // Azul cian muy sutil
    strokeWeight(0.5);
    
    // Líneas verticales
    for (let x = 0; x < width; x += gridSize) {
        let wave = sin(x * 0.01 + time) * 3;
        line(x + wave, 0, x + wave, height);
    }
    
    // Líneas horizontales
    for (let y = 0; y < height; y += gridSize) {
        let wave = sin(y * 0.01 + time) * 3;
        line(0, y + wave, width, y + wave);
    }
}

function drawRadialLines() {
    push();
    translate(width / 2, height / 2);
    stroke(0, 212, 255, 15); // Color más brillante pero muy sutil
    strokeWeight(0.3);
    
    for (let angle = 0; angle < TWO_PI; angle += PI / 16) {
        let len = 150 + sin(time + angle) * 30;
        let x = cos(angle) * len;
        let y = sin(angle) * len;
        line(0, 0, x, y);
    }
    pop();
}

function connectParticles() {
    strokeWeight(0.3);
    
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            let d = dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
            if (d < 100) { // Reducido de 120 a 100 para menos conexiones
                let alpha = map(d, 0, 100, 30, 0);
                stroke(0, 212, 255, alpha);
                line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
            }
        }
    }
}

class Particle {
    constructor() {
        this.x = random(width);
        this.y = random(height);
        this.vx = random(-0.3, 0.3);
        this.vy = random(-0.3, 0.3);
        this.size = random(1.5, 3);
        this.alpha = random(80, 150);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Wrap around
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
        
        // Pulsar sutilmente
        this.alpha = 100 + sin(time * 2 + this.x * 0.01) * 40;
    }
    
    show() {
        noStroke();
        fill(0, 212, 255, this.alpha);
        circle(this.x, this.y, this.size);
        
        // Glow effect más sutil
        fill(0, 212, 255, this.alpha * 0.2);
        circle(this.x, this.y, this.size * 1.5);
    }
}

class GridTraveler {
    constructor() {
        this.reset();
        this.size = random(2, 4);
        this.speed = random(1, 2.5);
    }
    
    reset() {
        let attempts = 0;
        let tooClose = true;
        
        // Intentar encontrar una posición que no esté muy cerca de otros viajeros
        while (tooClose && attempts < 20) {
            tooClose = false;
            
            // Decidir si viaja horizontal o verticalmente
            this.isHorizontal = random() > 0.5;
            
            if (this.isHorizontal) {
                // Moverse horizontalmente
                this.y = floor(random(height / gridSize)) * gridSize;
                this.x = random(width); // Posición aleatoria en X
                this.direction = random() > 0.5 ? 1 : -1;
            } else {
                // Moverse verticalmente
                this.x = floor(random(width / gridSize)) * gridSize;
                this.y = random(height); // Posición aleatoria en Y
                this.direction = random() > 0.5 ? 1 : -1;
            }
            
            // Verificar distancia con otros viajeros
            for (let other of gridTravelers) {
                if (other !== this) {
                    let d = dist(this.x, this.y, other.x, other.y);
                    if (d < gridSize * 3) {
                        tooClose = true;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        // Inicializar propiedades para el destello
        this.startX = this.x;
        this.startY = this.y;
        this.travelDistance = random(100, 250); // Distancia que recorrerá
        this.distanceTraveled = 0;
        this.alpha = 0;
        this.maxAlpha = 255;
    }
    
    update() {
        // Actualizar distancia recorrida
        this.distanceTraveled += this.speed;
        
        // Calcular alpha para fade in/out
        let fadeZone = this.travelDistance * 0.2; // 20% del recorrido para fade
        
        if (this.distanceTraveled < fadeZone) {
            // Fade in
            this.alpha = map(this.distanceTraveled, 0, fadeZone, 0, this.maxAlpha);
        } else if (this.distanceTraveled > this.travelDistance - fadeZone) {
            // Fade out
            this.alpha = map(this.distanceTraveled, this.travelDistance - fadeZone, this.travelDistance, this.maxAlpha, 0);
        } else {
            // Máximo brillo
            this.alpha = this.maxAlpha;
        }
        
        // Mover en la dirección correspondiente
        if (this.isHorizontal) {
            this.x += this.speed * this.direction;
            
            // Aplicar onda de la cuadrícula
            let wave = sin(this.x * 0.01 + time) * 3;
            this.currentY = this.y + wave;
        } else {
            this.y += this.speed * this.direction;
            
            // Aplicar onda de la cuadrícula
            let wave = sin(this.y * 0.01 + time) * 3;
            this.currentX = this.x + wave;
        }
        
        // Resetear cuando complete el recorrido
        if (this.distanceTraveled >= this.travelDistance) {
            this.reset();
        }
    }
    
    show() {
        let displayX = this.isHorizontal ? this.x : this.currentX;
        let displayY = this.isHorizontal ? this.currentY : this.y;
        
        // Aplicar alpha a todos los elementos
        let normalizedAlpha = this.alpha / 255;
        
        // Núcleo brillante
        noStroke();
        fill(200, 240, 255, 255 * normalizedAlpha);
        circle(displayX, displayY, this.size);
        
        // Glow exterior
        fill(0, 212, 255, 180 * normalizedAlpha);
        circle(displayX, displayY, this.size * 2);
        
        fill(0, 212, 255, 80 * normalizedAlpha);
        circle(displayX, displayY, this.size * 3);
        
        fill(0, 212, 255, 30 * normalizedAlpha);
        circle(displayX, displayY, this.size * 4);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

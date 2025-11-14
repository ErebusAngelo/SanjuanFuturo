// Variables globales
let deseos = [];
let container = null;
let visibleMessages = [];
const MAX_VISIBLE_MESSAGES = 8; // Máximo de mensajes visibles a la vez
const MESSAGE_DURATION = 30000; // 30 segundos por mensaje (aumentado)
let currentIndex = 0;
let occupiedPositions = []; // Posiciones ocupadas para evitar colisiones

// Inicializar la pantalla
document.addEventListener('DOMContentLoaded', async () => {
    container = document.getElementById('floatingContainer');
    
    // Cargar deseos desde el servidor
    await loadDeseos();
    
    // Actualizar contador
    updateCounter();
    
    // Iniciar ciclo de mensajes
    startMessageCycle();
});

// Cargar deseos desde el servidor
async function loadDeseos() {
    try {
        const response = await fetch('/api/deseos');
        if (response.ok) {
            deseos = await response.json();
            console.log('✓ Deseos cargados:', deseos);
        } else {
            console.error('Error al cargar deseos');
            deseos = [];
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        deseos = [];
    }
}

// Iniciar ciclo de mensajes rotativo
function startMessageCycle() {
    if (deseos.length === 0) {
        console.log('No hay deseos para mostrar');
        return;
    }
    
    // Mostrar mensajes iniciales
    for (let i = 0; i < Math.min(MAX_VISIBLE_MESSAGES, deseos.length); i++) {
        setTimeout(() => {
            showNextMessage();
        }, i * 300);
    }
    
    // Continuar rotando mensajes
    setInterval(() => {
        if (deseos.length > MAX_VISIBLE_MESSAGES) {
            rotateMessage();
        }
    }, MESSAGE_DURATION / MAX_VISIBLE_MESSAGES);
}

// Mostrar siguiente mensaje
function showNextMessage() {
    if (deseos.length === 0) return;
    
    const deseo = deseos[currentIndex % deseos.length];
    const messageElement = createFloatingMessage(deseo);
    visibleMessages.push(messageElement);
    
    currentIndex++;
}

// Rotar mensajes (quitar el más antiguo y agregar uno nuevo)
function rotateMessage() {
    if (visibleMessages.length >= MAX_VISIBLE_MESSAGES) {
        const oldMessage = visibleMessages.shift();
        
        // Liberar posición ocupada
        const posIndex = occupiedPositions.findIndex(pos => 
            pos.element === oldMessage
        );
        if (posIndex !== -1) {
            occupiedPositions.splice(posIndex, 1);
        }
        
        // Fade out
        oldMessage.classList.add('fade-out');
        
        setTimeout(() => {
            if (oldMessage.parentNode) {
                oldMessage.parentNode.removeChild(oldMessage);
            }
        }, 1000);
    }
    
    // Agregar nuevo mensaje
    showNextMessage();
}

// Crear un mensaje flotante individual
function createFloatingMessage(deseo) {
    const message = document.createElement('div');
    message.className = 'floating-message';
    
    // Icono (oculto por CSS)
    const icon = document.createElement('div');
    icon.className = 'message-icon';
    icon.textContent = deseo.icon || '💭';
    
    // Texto del deseo (inicialmente vacío para efecto de escritura)
    const wish = document.createElement('div');
    wish.className = 'message-wish';
    wish.textContent = ''; // Vacío inicialmente
    
    // Nombre del autor (inicialmente vacío)
    const author = document.createElement('div');
    author.className = 'message-author';
    author.textContent = ''; // Vacío inicialmente
    
    message.appendChild(icon);
    message.appendChild(wish);
    message.appendChild(author);
    
    // Posición usando grid para evitar superposiciones
    const position = getAvailablePosition();
    message.style.left = `${position.x}px`;
    message.style.top = `${position.y}px`;
    
    // Vincular elemento con su posición
    position.element = message;
    
    // Duración de animación aleatoria
    const duration = 18 + Math.random() * 8; // 18-26 segundos
    message.style.animationDuration = `${duration}s`;
    
    // Delay aleatorio
    const delay = Math.random() * 1.5;
    message.style.animationDelay = `${delay}s`;
    
    container.appendChild(message);
    
    // Hacer visible con un pequeño delay
    setTimeout(() => {
        message.classList.add('visible');
        
        // Iniciar efecto de escritura después de que sea visible
        setTimeout(() => {
            typeText(wish, deseo.deseo, () => {
                // Después de escribir el deseo, escribir el autor
                setTimeout(() => {
                    typeText(author, `- ${deseo.nombre}`, null, 40);
                }, 200);
            });
        }, 100);
    }, 50);
    
    return message;
}

// Función para efecto de escritura letra por letra
function typeText(element, text, callback, speed = 50) {
    let charIndex = 0;
    
    function typeNextChar() {
        if (charIndex < text.length) {
            element.textContent = text.substring(0, charIndex + 1) + '_';
            charIndex++;
            
            // Velocidad de tipeo variable
            const typingSpeed = Math.random() * 30 + speed;
            setTimeout(typeNextChar, typingSpeed);
        } else {
            // Remover cursor al terminar
            element.textContent = text;
            
            // Ejecutar callback si existe
            if (callback) {
                callback();
            }
        }
    }
    
    typeNextChar();
}

// Obtener posición disponible sin colisiones
function getAvailablePosition() {
    const containerRect = container.getBoundingClientRect();
    const messageWidth = 280;
    const messageHeight = 150;
    const padding = 40;
    
    const maxAttempts = 50;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        // Generar posición aleatoria
        const x = Math.random() * (containerRect.width - messageWidth - padding * 2) + padding;
        const y = Math.random() * (containerRect.height - messageHeight - padding * 2) + padding;
        
        // Verificar si colisiona con posiciones existentes
        const hasCollision = occupiedPositions.some(pos => {
            const dx = Math.abs(pos.x - x);
            const dy = Math.abs(pos.y - y);
            
            // Verificar si hay superposición
            return dx < (messageWidth + padding) && dy < (messageHeight + padding);
        });
        
        if (!hasCollision) {
            // Posición válida encontrada
            const position = { x, y };
            occupiedPositions.push(position);
            return position;
        }
        
        attempts++;
    }
    
    // Si no se encuentra posición después de muchos intentos, usar una posición forzada
    const fallbackX = (occupiedPositions.length * 50) % (containerRect.width - messageWidth);
    const fallbackY = Math.floor((occupiedPositions.length * 50) / (containerRect.width - messageWidth)) * 180;
    
    const position = { x: fallbackX + padding, y: fallbackY + padding };
    occupiedPositions.push(position);
    return position;
}

// Actualizar contador
function updateCounter() {
    const counter = document.getElementById('messageCount');
    counter.textContent = deseos.length;
}

// Recargar deseos periódicamente (cada 30 segundos)
setInterval(async () => {
    const oldCount = deseos.length;
    await loadDeseos();
    
    if (deseos.length > oldCount) {
        console.log(`✓ ${deseos.length - oldCount} nuevos deseos detectados`);
        updateCounter();
        // Los nuevos deseos se mostrarán automáticamente en el ciclo de rotación
    }
}, 30000);

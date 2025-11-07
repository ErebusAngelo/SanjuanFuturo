// Texto que se va a escribir
const textToType = "Tres mentes, un solo objetivo: construir juntos el San Juan del futuro.";

// Elementos del DOM
let typingElement;
let cursorElement;

// Variables de control
let currentCharIndex = 0;
let isTyping = false;

// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    typingElement = document.querySelector('.typing-text');
    cursorElement = document.querySelector('.cursor');
    
    // Iniciar el tipeo después de las animaciones de los corchetes y degradado
    setTimeout(startTyping, 1500);
});

function startTyping() {
    isTyping = true;
    typeNextChar();
}

function typeNextChar() {
    if (currentCharIndex < textToType.length) {
        // Agregar el siguiente carácter
        typingElement.textContent += textToType[currentCharIndex];
        currentCharIndex++;
        
        // Velocidad de tipeo variable (más rápido)
        const typingSpeed = Math.random() * 50 + 30; // 30-80ms por letra
        
        setTimeout(typeNextChar, typingSpeed);
    } else {
        // Tipeo completado
        isTyping = false;
        
        // Mantener el cursor parpadeando por unos segundos y luego ocultarlo
        setTimeout(() => {
            cursorElement.style.animation = 'none';
            cursorElement.style.opacity = '0';
        }, 3000);
    }
}

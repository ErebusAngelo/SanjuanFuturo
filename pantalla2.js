// Texto que se va a escribir
const textToType = "Tres mentes, un solo objetivo: construir juntos el San Juan del futuro.";

// Elementos del DOM
let typingElement;
let keyboard;
let inputElement;

// Variables de control
let currentCharIndex = 0;
let isTyping = false;

// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    typingElement = document.querySelector('.typing-text');
    inputElement = document.querySelector('.name-input');
    
    // Iniciar el tipeo después de las animaciones de los corchetes y degradado
    setTimeout(startTyping, 1500);
    
    // Inicializar el teclado
    initKeyboard();
});

function startTyping() {
    isTyping = true;
    typeNextChar();
}

function typeNextChar() {
    if (currentCharIndex < textToType.length) {
        // Agregar el siguiente carácter con el cursor integrado
        typingElement.innerHTML = textToType.substring(0, currentCharIndex + 1) + '<span class="cursor-inline">_</span>';
        currentCharIndex++;
        
        // Velocidad de tipeo variable (más rápido)
        const typingSpeed = Math.random() * 50 + 30; // 30-80ms por letra
        
        setTimeout(typeNextChar, typingSpeed);
    } else {
        // Tipeo completado, hacer titilar el cursor 3 veces
        isTyping = false;
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            if (blinkCount < 6) { // 3 titilaciones = 6 cambios (on/off)
                const cursorSpan = typingElement.querySelector('.cursor-inline');
                if (cursorSpan) {
                    cursorSpan.style.opacity = blinkCount % 2 === 0 ? '0' : '1';
                }
                blinkCount++;
            } else {
                clearInterval(blinkInterval);
                // Remover el cursor completamente
                typingElement.textContent = textToType;
            }
        }, 400); // 400ms por cada cambio
    }
}

// Inicializar teclado virtual
function initKeyboard() {
    keyboard = new window.SimpleKeyboard.default({
        onChange: input => onChange(input),
        onKeyPress: button => onKeyPress(button),
        layout: {
            default: [
                "Q W E R T Y U I O P {bksp}",
                "A S D F G H J K L Ñ {enter}",
                "{shift} Z X C V B N M ! ? {shift}",
                "{numbers} {space} {numbers}"
            ],
            shift: [
                "Q W E R T Y U I O P {bksp}",
                "A S D F G H J K L Ñ {enter}",
                "{shift} Z X C V B N M ! ? {shift}",
                "{numbers} {space} {numbers}"
            ],
            numbers: [
                "1 2 3 4 5 6 7 8 9 0 {bksp}",
                "@ # $ % & * ( ) - {enter}",
                "{abc} . , ? ! ' \" : ; {abc}",
                "{abc} {space} {abc}"
            ]
        },
        display: {
            '{bksp}': '⌫',
            '{shift}': '⇧',
            '{space}': '',
            '{enter}': '↵',
            '{numbers}': '.?123',
            '{abc}': 'ABC'
        },
        theme: "hg-theme-default neon-keyboard"
    });
}

function onChange(input) {
    inputElement.value = input;
}

function onKeyPress(button) {
    if (button === "{shift}" || button === "{lock}") {
        handleShift();
    } else if (button === "{numbers}") {
        handleNumbers();
    } else if (button === "{abc}") {
        handleABC();
    } else if (button === "{enter}") {
        handleEnter();
    }
}

function handleShift() {
    let currentLayout = keyboard.options.layoutName;
    let shiftToggle = currentLayout === "default" ? "shift" : "default";
    keyboard.setOptions({
        layoutName: shiftToggle
    });
}

function handleNumbers() {
    keyboard.setOptions({
        layoutName: "numbers"
    });
}

function handleABC() {
    keyboard.setOptions({
        layoutName: "default"
    });
}

function handleEnter() {
    // Simular click en el botón de enviar
    document.querySelector('.submit-button').click();
}

// Sincronizar teclado cuando se escribe en el input
if (inputElement) {
    inputElement.addEventListener('input', (event) => {
        keyboard.setInput(event.target.value);
    });
}

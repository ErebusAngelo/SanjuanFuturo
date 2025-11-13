// Texto que se va a escribir
const textToType = "Tres mentes, un solo objetivo: construir juntos el San Juan del futuro.";

// Elementos del DOM
let typingElement;
let keyboard;
let inputElement;

// Variables de control
let currentCharIndex = 0;
let isTyping = false;

// WebSocket y sistema de jugadores
let ws = null;
let playerId = null;

// Obtener ID del jugador de la URL
function getPlayerId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('jugador') || '1';
}

// Conectar al WebSocket
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Jugador WebSocket conectado');
        
        // Registrar como jugador
        ws.send(JSON.stringify({
            type: 'register',
            clientType: 'player',
            playerId: playerId,
            screen: 'pantalla2'
        }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Jugador recibió:', message);

        if (message.type === 'system_reset') {
            // Reiniciar la pantalla
            localStorage.removeItem('userName');
            window.location.reload();
        }
    };

    ws.onerror = (error) => {
        console.error('Jugador WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('Jugador WebSocket desconectado');
        setTimeout(connectWebSocket, 3000);
    };
}

// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    typingElement = document.querySelector('.typing-text');
    inputElement = document.querySelector('.name-input');
    
    // Obtener ID del jugador
    playerId = getPlayerId();
    console.log('Jugador ID:', playerId);
    
    // Conectar al WebSocket
    connectWebSocket();
    
    // Iniciar el tipeo después de las animaciones de los corchetes y degradado
    setTimeout(startTyping, 1500);
    
    // Inicializar el teclado
    initKeyboard();
    
    // Agregar eventos de focus/blur al input
    initInputEffects();
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
    // Iluminar tecla presionada
    highlightKey(button);
    
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

// Iluminar tecla cuando se presiona
function highlightKey(button) {
    // Buscar el botón en el teclado
    const keyElement = document.querySelector(`[data-skbtn="${button}"]`);
    
    if (keyElement) {
        // Agregar clase de iluminación
        keyElement.classList.add('key-pressed');
        
        // Remover clase después de 200ms
        setTimeout(() => {
            keyElement.classList.remove('key-pressed');
        }, 200);
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

// Manejar el click en el botón de enviar
const submitButton = document.querySelector('.submit-button');
if (submitButton) {
    submitButton.addEventListener('click', function() {
        const userName = inputElement.value.trim();
        
        if (userName) {
            // Guardar el nombre en localStorage
            localStorage.setItem('userName', userName);
            
            // Enviar nombre al servidor
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'player_name',
                    userName: userName
                }));
            }
            
            // Redirigir a pantalla3 con el ID del jugador
            window.location.href = `pantalla3.html?jugador=${playerId}`;
        } else {
            // Opcional: mostrar un mensaje de error o advertencia
            console.log('Por favor ingresa tu nombre');
            inputElement.focus();
        }
    });
}

// Efectos de iluminación en el input
function initInputEffects() {
    const inputContainer = document.querySelector('.input-container');
    const nameInput = document.querySelector('.name-input');
    
    // Activar iluminación al hacer focus
    nameInput.addEventListener('focus', function() {
        inputContainer.classList.add('active');
    });
    
    // Desactivar iluminación al perder focus
    nameInput.addEventListener('blur', function() {
        inputContainer.classList.remove('active');
    });
}

// El San Juan que Quiero - Script principal

let ws = null;
let playerId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Ajuste de escala para diferentes dispositivos
    adjustScale();
    
    // Reajustar en cambio de orientación o tamaño
    window.addEventListener('resize', adjustScale);
    window.addEventListener('orientationchange', adjustScale);
    
    // Obtener parámetro jugador de la URL
    const urlParams = new URLSearchParams(window.location.search);
    playerId = urlParams.get('jugador');
    
    // Conectar WebSocket si hay jugador
    if (playerId) {
        console.log(`🔌 Conectando jugador ${playerId} desde index.html`);
        connectWebSocket();
    }
    
    // Manejar click en botón COMENZAR
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', function() {
            console.log('🚀 Comenzando experiencia...');
            
            // Preservar parámetro jugador en la redirección
            if (playerId) {
                window.location.href = `pantalla2.html?jugador=${playerId}`;
            } else {
                window.location.href = 'pantalla2.html';
            }
        });
    }
});

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log(`✅ WebSocket conectado para jugador ${playerId}`);
        
        // Registrar como jugador en index.html
        ws.send(JSON.stringify({
            type: 'register',
            clientType: 'player',
            playerId: playerId,
            screen: 'index'
        }));
    };
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('📨 Mensaje recibido en index.html:', message);
    };
    
    ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
    };
    
    ws.onclose = () => {
        console.log('🔌 WebSocket desconectado');
    };
}

function adjustScale() {
    const container = document.querySelector('.main-container');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Referencia de diseño: 1080x1920
    const designWidth = 1080;
    const designHeight = 1920;
    
    // Calcular escala basada en la relación de aspecto
    const scaleX = windowWidth / designWidth;
    const scaleY = windowHeight / designHeight;
    
    // Usar la menor escala para mantener todo visible
    const scale = Math.min(scaleX, scaleY, 1);
    
    // Aplicar transformación si es necesario
    if (windowWidth < designWidth || windowHeight < designHeight) {
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'center center';
    } else {
        container.style.transform = 'none';
    }
}

  let ws = null;
let currentState = 'loop'; // loop, welcome, loading, image, thanks, gallery
let galleryImages = [];

// Conectar al WebSocket
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Avatar WebSocket conectado');
        updateConnectionIndicator(true);
        
        // Registrar como pantalla avatar
        ws.send(JSON.stringify({
            type: 'register',
            clientType: 'avatar'
        }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Avatar recibió:', message);

        switch(message.type) {
            case 'change_state':
                changeState(message.state, message.data);
                break;
            
            case 'generation_progress':
                updateProgress(message.percent);
                break;
            
            case 'image_generated':
                showGeneratedImage(message.url);
                break;
        }
    };

    ws.onerror = (error) => {
        console.error('Avatar WebSocket error:', error);
        updateConnectionIndicator(false);
    };

    ws.onclose = () => {
        console.log('Avatar WebSocket desconectado');
        updateConnectionIndicator(false);
        setTimeout(connectWebSocket, 3000);
    };
}

function updateConnectionIndicator(connected) {
    const indicator = document.getElementById('connectionIndicator');
    if (connected) {
        indicator.classList.add('connected');
    } else {
        indicator.classList.remove('connected');
    }
}

function changeState(newState, data = {}) {
    console.log(`Cambiando estado de ${currentState} a ${newState}`);
    
    // Ocultar todos los contenidos
    document.querySelectorAll('.video-content, .loading-content, .image-content, .thanks-content, .gallery-content')
        .forEach(el => el.classList.remove('active'));
    
    // Ocultar barra de progreso por defecto
    document.getElementById('progressArc').classList.remove('active');
    
    currentState = newState;

    switch(newState) {
        case 'loop':
            // Mostrar video
            document.getElementById('videoContent').classList.add('active');
            // NO HACER NADA MÁS - el video ya tiene autoplay loop en el HTML
            break;
        
        case 'loading':
            // Mostrar loading y barra de progreso
            document.getElementById('loadingContent').classList.add('active');
            document.getElementById('progressArc').classList.add('active');
            updateProgress(0);
            break;
        
        case 'image':
            // Mostrar imagen con animación legendaria
            document.getElementById('imageContent').classList.add('active');
            break;
        
        case 'thanks':
            // Mostrar agradecimiento
            document.getElementById('thanksContent').classList.add('active');
            // Mostrar galería después de 5 segundos
            setTimeout(() => {
                changeState('gallery');
            }, 5000);
            break;
        
        case 'gallery':
            // Mostrar galería
            document.getElementById('galleryContent').classList.add('active');
            renderGallery();
            // Volver al loop después de 5 segundos
            setTimeout(() => {
                changeState('loop');
            }, 5000);
            break;
    }
}

function updateProgress(percent) {
    const circle = document.getElementById('progressCircle');
    if (circle) {
        const circumference = 471.24; // 2 * PI * 75
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }
}

function showGeneratedImage(imageUrl) {
    const img = document.getElementById('generatedImage');
    img.src = imageUrl;
    
    // Agregar a la galería
    if (!galleryImages.includes(imageUrl)) {
        galleryImages.push(imageUrl);
    }
    
    changeState('image');
    
    // Mostrar agradecimiento después del tiempo configurado
    const displayTime = CONFIG?.generatedImage?.displayDuration || 10000;
    setTimeout(() => {
        changeState('thanks');
    }, displayTime);
}

// Cargar imágenes existentes de la carpeta
async function loadExistingImages() {
    try {
        const response = await fetch('/api/gallery-images');
        const images = await response.json();
        galleryImages = images.map(img => `/imagenes/${img}`);
        console.log(`Cargadas ${galleryImages.length} imágenes de la galería`);
    } catch (error) {
        console.error('Error cargando imágenes:', error);
    }
}

// Renderizar galería
function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';
    
    if (galleryImages.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #00D4FF;">No hay imágenes en la galería</div>';
        return;
    }
    
    // Si hay menos de 9 imágenes, duplicar para llenar el grid
    let imagesToShow = [...galleryImages];
    while (imagesToShow.length < 9 && galleryImages.length > 0) {
        imagesToShow = [...imagesToShow, ...galleryImages];
    }
    
    // Mostrar 9 imágenes
    for (let i = 0; i < Math.min(9, imagesToShow.length); i++) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = imagesToShow[i];
        img.alt = `Imagen ${i + 1}`;
        
        item.appendChild(img);
        grid.appendChild(item);
    }
}

// Activar audio del video al hacer click
function enableAudio() {
    const video = document.getElementById('loopVideo');
    if (video && video.muted) {
        video.muted = false;
        console.log('Audio activado');
    }
}

let lastVideoTime = 0;
let stuckCounter = 0;
let recoveryAttempts = 0;

function initVideoStuckDetector() {
    const video = document.getElementById('loopVideo');
    
    setInterval(() => {
        if (currentState === 'loop' && video) {
            const currentTime = video.currentTime;
            
            // Si el video debería estar reproduciéndose pero el tiempo no avanza
            if (!video.paused && !video.ended) {
                if (Math.abs(currentTime - lastVideoTime) < 0.1) {
                    stuckCounter++;
                    console.log(`⚠️ Video posiblemente clavado - Contador: ${stuckCounter} - Tiempo: ${currentTime.toFixed(2)}s`);
                    
                    // Si está clavado por más de 3 segundos, intentar recuperar
                    if (stuckCounter >= 3) {
                        console.log(`🚨 VIDEO CLAVADO DETECTADO en ${currentTime.toFixed(2)}s - Iniciando recuperación`);
                        recoverStuckVideo();
                    }
                } else {
                    // El video está avanzando normalmente, resetear contador
                    if (stuckCounter > 0) {
                        console.log(`✅ Video recuperado - Tiempo: ${currentTime.toFixed(2)}s`);
                        stuckCounter = 0;
                        recoveryAttempts = 0;
                    }
                }
            } else {
                stuckCounter = 0; // Resetear si está pausado intencionalmente
            }
            
            lastVideoTime = currentTime;
        }
    }, 1000); // Verificar cada segundo
}

function recoverStuckVideo() {
    const video = document.getElementById('loopVideo');
    recoveryAttempts++;
    
    console.log(`🔧 Intento de recuperación #${recoveryAttempts}`);
    
    if (recoveryAttempts <= 3) {
        // Método 1: Reiniciar reproducción
        video.pause();
        setTimeout(() => {
            video.play().catch(e => console.log('Error en recuperación:', e));
        }, 100);
    } else if (recoveryAttempts <= 6) {
        // Método 2: Saltar un poco hacia adelante
        console.log('🔧 Saltando 0.5 segundos adelante');
        video.currentTime += 0.5;
        video.play().catch(e => console.log('Error en salto:', e));
    } else {
        // Método 3: Reiniciar desde el principio
        console.log('🔧 Reiniciando video desde el principio');
        video.currentTime = 0;
        video.play().catch(e => console.log('Error en reinicio:', e));
        recoveryAttempts = 0; // Resetear para el próximo ciclo
    }
    
    stuckCounter = 0; // Resetear contador después del intento
}

// Panel secreto de control
function initSecretPanel() {
    const panel = document.getElementById('secretPanel');
    const video = document.getElementById('loopVideo');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const muteBtn = document.getElementById('muteBtn');
    const videoStatus = document.getElementById('videoStatus');
    const videoTime = document.getElementById('videoTime');
    const muteStatus = document.getElementById('muteStatus');

    // Hotkey para mostrar/ocultar panel (Ctrl+Shift+V)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    });

    // Controles del video
    playBtn.addEventListener('click', () => {
        video.play().catch(e => console.log('Error play:', e));
    });

    pauseBtn.addEventListener('click', () => {
        video.pause();
    });

    restartBtn.addEventListener('click', () => {
        video.currentTime = 0;
        video.play().catch(e => console.log('Error restart:', e));
    });

    muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
    });

    // Actualizar información cada segundo
    setInterval(() => {
        if (video) {
            videoStatus.textContent = video.paused ? '⏸️ Pausado' : '▶️ Reproduciendo';
            
            const current = Math.floor(video.currentTime);
            const total = Math.floor(video.duration) || 0;
            const currentMin = Math.floor(current / 60);
            const currentSec = current % 60;
            const totalMin = Math.floor(total / 60);
            const totalSec = total % 60;
            
            videoTime.textContent = `${currentMin}:${currentSec.toString().padStart(2, '0')} / ${totalMin}:${totalSec.toString().padStart(2, '0')}`;
            muteStatus.textContent = video.muted ? '🔇 Silenciado' : '🔊 Con audio';
        }
    }, 1000);
}

// Iniciar conexión al cargar
window.addEventListener('load', () => {
    connectWebSocket();
    loadExistingImages();
    initSecretPanel(); // Inicializar panel secreto
    initVideoStuckDetector(); // Inicializar detector automático
    
    // Activar audio al hacer click en cualquier parte
    document.body.addEventListener('click', enableAudio, { once: true });
    document.body.addEventListener('touchstart', enableAudio, { once: true });
});
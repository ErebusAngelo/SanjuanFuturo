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
        
        case 'mask':
            // Mostrar máscara circular
            document.getElementById('maskContent').classList.add('active');
            // Transición a galería después de 2 segundos
            setTimeout(() => {
                changeState('gallery');
            }, 2000);
            break;
        
        case 'gallery':
            // Mostrar galería
            document.getElementById('galleryContent').classList.add('active');
            renderGallery();
            
            // Usar configuración de tiempo de la galería
            const galleryDuration = CONFIG?.gallery?.displayDuration || 15000;
            console.log(`Mostrando galería por ${galleryDuration/1000} segundos`);
            
            // Mostrar agradecimiento después del tiempo configurado
            setTimeout(() => {
                changeState('thanks');
            }, galleryDuration);
            break;
        
        case 'thanks':
            // Mostrar agradecimiento
            document.getElementById('thanksContent').classList.add('active');
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
    
    // Nuevo flujo: imagen → máscara circular → galería → gracias
    const displayTime = CONFIG?.generatedImage?.displayDuration || 5000;
    
    // 1. Mostrar imagen cuadrada normal
    setTimeout(() => {
        // 2. Aplicar máscara circular y transición
        console.log('🎭 Aplicando máscara circular...');
        img.classList.add('transitioning');
        
        // 3. Después de la transición, mostrar galería
        setTimeout(() => {
            changeState('gallery');
        }, 1500); // Tiempo de la transición CSS
        
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

// Renderizar galería circular con cálculo radial matemático
function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';
    
    if (galleryImages.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: #00D4FF; font-size: 1.5rem;">No hay imágenes en la galería</div>';
        return;
    }
    
    // Configuración de la galería
    const maxOrbitalImages = CONFIG?.gallery?.maxOrbitalImages || 8;
    const circleRadius = 160; // Radio del círculo orbital (400px container / 2 - 40px margin)
    const imageSize = 80; // Tamaño de las imágenes orbitales
    
    // La imagen más reciente SIEMPRE va al centro
    const centerImage = galleryImages[galleryImages.length - 1]; // ÚLTIMA = MÁS RECIENTE
    
    // Resto de imágenes para orbitales (excluyendo la central)
    const orbitalImages = galleryImages.slice(0, -1).slice(-maxOrbitalImages);
    
    console.log(`🎯 Imagen central: ${centerImage}`);
    console.log(`🌍 Imágenes orbitales: ${orbitalImages.length}`);
    
    // Crear contenedor circular
    const circleContainer = document.createElement('div');
    circleContainer.className = 'gallery-circle';
    
    // Crear imagen central (SIEMPRE la más reciente)
    if (centerImage) {
        const centerItem = document.createElement('div');
        centerItem.className = 'gallery-center';
        
        const centerImg = document.createElement('img');
        centerImg.src = centerImage;
        centerImg.alt = 'Imagen Recién Generada';
        centerImg.style.width = '100%';
        centerImg.style.height = '100%';
        centerImg.style.objectFit = 'cover';
        
        centerItem.appendChild(centerImg);
        circleContainer.appendChild(centerItem);
    }
    
    // Crear imágenes orbitales con cálculo radial matemático
    orbitalImages.forEach((imageSrc, index) => {
        const orbitalItem = document.createElement('div');
        orbitalItem.className = 'gallery-orbital';
        
        // CÁLCULO RADIAL MATEMÁTICO CORRECTO
        const totalImages = orbitalImages.length;
        const angleStep = (2 * Math.PI) / totalImages; // Dividir círculo en partes iguales
        const angle = index * angleStep - (Math.PI / 2); // Empezar desde arriba (-90°)
        
        // Calcular posición X,Y usando trigonometría
        const x = Math.cos(angle) * circleRadius;
        const y = Math.sin(angle) * circleRadius;
        
        // Centrar en el contenedor (200px = centro del contenedor de 400px)
        const centerX = 200 - (imageSize / 2);
        const centerY = 200 - (imageSize / 2);
        
        // Posición final
        const finalX = centerX + x;
        const finalY = centerY + y;
        
        // Aplicar posición calculada
        orbitalItem.style.left = `${finalX}px`;
        orbitalItem.style.top = `${finalY}px`;
        orbitalItem.style.position = 'absolute';
        
        console.log(`🔮 Imagen ${index + 1}: ángulo=${(angle * 180 / Math.PI).toFixed(1)}°, x=${finalX.toFixed(1)}, y=${finalY.toFixed(1)}`);
        
        const orbitalImg = document.createElement('img');
        orbitalImg.src = imageSrc;
        orbitalImg.alt = `Imagen Orbital ${index + 1}`;
        orbitalImg.style.width = '100%';
        orbitalImg.style.height = '100%';
        orbitalImg.style.objectFit = 'cover';
        
        // Agregar efecto hover interactivo
        orbitalItem.addEventListener('mouseenter', () => {
            orbitalItem.style.transform = 'scale(1.3)';
            orbitalItem.style.zIndex = '15';
        });
        
        orbitalItem.addEventListener('mouseleave', () => {
            orbitalItem.style.transform = 'scale(1)';
            orbitalItem.style.zIndex = '1';
        });
        
        orbitalItem.appendChild(orbitalImg);
        circleContainer.appendChild(orbitalItem);
    });
    
    grid.appendChild(circleContainer);
    
    console.log(`📸 Galería circular renderizada: 1 central + ${orbitalImages.length} orbitales`);
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

// Panel de configuración de generación
function initConfigPanel() {
    const panel = document.getElementById('configPanel');
    const sliders = {
        fluxGuidance: document.getElementById('fluxGuidanceSlider'),
        fuerzaSanJuan: document.getElementById('fuerzaSanJuanSlider'),
        fuerzaSolarpunk: document.getElementById('fuerzaSolarpunkSlider'),
        steps: document.getElementById('stepsSlider'),
        variability: document.getElementById('variabilitySlider'),
        galleryDuration: document.getElementById('galleryDurationSlider'),
        imageDuration: document.getElementById('imageDurationSlider'),
        orbitalCount: document.getElementById('orbitalCountSlider')
    };
    const values = {
        fluxGuidance: document.getElementById('fluxGuidanceValue'),
        fuerzaSanJuan: document.getElementById('fuerzaSanJuanValue'),
        fuerzaSolarpunk: document.getElementById('fuerzaSolarpunkValue'),
        steps: document.getElementById('stepsValue'),
        variability: document.getElementById('variabilityValue'),
        galleryDuration: document.getElementById('galleryDurationValue'),
        imageDuration: document.getElementById('imageDurationValue'),
        orbitalCount: document.getElementById('orbitalCountValue')
    };

    // Cargar configuración guardada
    loadConfigFromStorage();

    // Hotkey para mostrar/ocultar panel (P)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'P' || e.key === 'p') {
            e.preventDefault();
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    });

    // Event listeners para sliders
    Object.keys(sliders).forEach(key => {
        sliders[key].addEventListener('input', () => {
            const value = (key === 'steps' || key === 'galleryDuration' || key === 'imageDuration' || key === 'orbitalCount') ? 
                         parseInt(sliders[key].value) : parseFloat(sliders[key].value);

            // Mostrar valor apropiado
            if (key === 'steps' || key === 'galleryDuration' || key === 'imageDuration' || key === 'orbitalCount') {
                values[key].textContent = value;
            } else {
                values[key].textContent = value.toFixed(2);
            }

            // Actualizar CONFIG en tiempo real
            if (key === 'fluxGuidance') CONFIG.imageGeneration.fluxGuidance = value;
            else if (key === 'fuerzaSanJuan') CONFIG.imageGeneration.fuerzaSanJuan = value;
            else if (key === 'fuerzaSolarpunk') CONFIG.imageGeneration.fuerzaSolarpunk = value;
            else if (key === 'steps') CONFIG.imageGeneration.steps = value;
            else if (key === 'variability') CONFIG.imageGeneration.variabilityFactor = value;
            else if (key === 'galleryDuration') CONFIG.gallery.displayDuration = value * 1000; // Convertir a ms
            else if (key === 'imageDuration') CONFIG.generatedImage.displayDuration = value * 1000; // Convertir a ms
            else if (key === 'orbitalCount') CONFIG.gallery.maxOrbitalImages = value;

            saveConfigToStorage();
        });
    });

    // Botón resetear
    document.getElementById('resetConfigBtn').addEventListener('click', () => {
        CONFIG.imageGeneration = {
            fluxGuidance: 3.5,
            fuerzaSanJuan: 0.55,
            fuerzaSolarpunk: 0.8,
            steps: 20,
            variabilityFactor: 0.15
        };
        updateSlidersFromConfig();
        saveConfigToStorage();
    });

    // Botón guardar
    document.getElementById('saveConfigBtn').addEventListener('click', () => {
        saveConfigToStorage();
        console.log(' Configuración guardada');
    });

    // Botón test galería
    document.getElementById('testGalleryBtn').addEventListener('click', () => {
        console.log('🖼️ Probando galería...');
        if (currentState !== 'gallery') {
            changeState('gallery');
        } else {
            console.log('📸 Galería ya está activa');
        }
    });

    function updateSlidersFromConfig() {
        sliders.fluxGuidance.value = CONFIG.imageGeneration.fluxGuidance;
        sliders.fuerzaSanJuan.value = CONFIG.imageGeneration.fuerzaSanJuan;
        sliders.fuerzaSolarpunk.value = CONFIG.imageGeneration.fuerzaSolarpunk;
        sliders.steps.value = CONFIG.imageGeneration.steps;
        sliders.variability.value = CONFIG.imageGeneration.variabilityFactor;
        
        // Agregar sliders de galería
        if (sliders.galleryDuration) {
            sliders.galleryDuration.value = (CONFIG.gallery?.displayDuration || 15000) / 1000;
        }
        if (sliders.imageDuration) {
            sliders.imageDuration.value = (CONFIG.generatedImage?.displayDuration || 5000) / 1000;
        }
        if (sliders.orbitalCount) {
            sliders.orbitalCount.value = CONFIG.gallery?.maxOrbitalImages || 8;
        }

        values.fluxGuidance.textContent = CONFIG.imageGeneration.fluxGuidance.toFixed(1);
        values.fuerzaSanJuan.textContent = CONFIG.imageGeneration.fuerzaSanJuan.toFixed(2);
        values.fuerzaSolarpunk.textContent = CONFIG.imageGeneration.fuerzaSolarpunk.toFixed(2);
        values.steps.textContent = CONFIG.imageGeneration.steps;
        values.variability.textContent = CONFIG.imageGeneration.variabilityFactor.toFixed(2);
        
        // Agregar valores de galería
        if (values.galleryDuration) {
            values.galleryDuration.textContent = (CONFIG.gallery?.displayDuration || 15000) / 1000;
        }
        if (values.imageDuration) {
            values.imageDuration.textContent = (CONFIG.generatedImage?.displayDuration || 5000) / 1000;
        }
        if (values.orbitalCount) {
            values.orbitalCount.textContent = CONFIG.gallery?.maxOrbitalImages || 8;
        }
    }

    function saveConfigToStorage() {
        try {
            localStorage.setItem('avatar_config', JSON.stringify(CONFIG.imageGeneration));
        } catch (e) {
            console.warn('No se pudo guardar configuración:', e);
        }
    }

    function loadConfigFromStorage() {
        try {
            const saved = localStorage.getItem('avatar_config');
            if (saved) {
                const savedConfig = JSON.parse(saved);
                Object.assign(CONFIG.imageGeneration, savedConfig);
                updateSlidersFromConfig();
            }
        } catch (e) {
            console.warn('No se pudo cargar configuración:', e);
        }
    }
}

// Integrar mega algoritmo con pantalla3
function generateImageFromUserSelections() {
    // Obtener selecciones del usuario desde localStorage
    const userSelections = JSON.parse(localStorage.getItem('userSelections') || '{}');
    
    if (Object.keys(userSelections).length === 0) {
        console.warn('⚠️ No hay selecciones de usuario para generar imagen');
        return;
    }

    // Crear instancia del mega generador
    const megaGenerator = new MegaPromptGenerator();
    
    // Generar prompt desde selecciones
    const promptData = megaGenerator.generateFromUserSelections(userSelections);
    
    console.log('🎨 Generando imagen con mega algoritmo:', promptData);
    
    // Enviar al servidor para generar imagen
    if (ws && ws.readyState === WebSocket.OPEN) {
        const seed = Math.floor(Math.random() * 18446744073709551614) + 1;
        
        const message = {
            type: 'generarImagen',
            prompt: promptData.prompt,
            negativePrompt: promptData.negativePrompt,
            params: {
                seed: seed,
                steps: promptData.steps,
                width: 1184,
                height: 1184,
                model: 'flux1-dev-fp8.safetensors',
                guidance: promptData.guidance,
                loras: [
                    {
                        name: 'Flux_SanJuanv1.safetensors',
                        strength: promptData.sanJuanStrength
                    },
                    {
                        name: 'Solarpunk style v1-step00001900.safetensors',
                        strength: promptData.solarStrength
                    }
                ]
            }
        };

        console.log('📤 Enviando mensaje de generación:', message);
        ws.send(JSON.stringify(message));
    } else {
        console.error('❌ WebSocket no conectado');
    }
}

// Iniciar conexión al cargar
window.addEventListener('load', () => {
    connectWebSocket();
    loadExistingImages();
    initSecretPanel(); // Inicializar panel secreto
    initVideoStuckDetector(); // Inicializar detector automático
    initConfigPanel(); // Inicializar panel de configuración
    
    // Activar audio al hacer click en cualquier parte
    document.body.addEventListener('click', enableAudio, { once: true });
    document.body.addEventListener('touchstart', enableAudio, { once: true });
});
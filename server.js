const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const { URL } = require('url');

const clientId = uuidv4();
const configPath = path.join(__dirname, 'config.json');

// Cargar configuración
function loadConfig() {
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading config:', error);
        return { comfyUrl: 'http://localhost:8188', isRemote: false, numPlayers: 3 };
    }
}

// Guardar configuración
function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

let config = loadConfig();
let wsComfy = null;

// Función para obtener el protocolo HTTP correcto
function getHttpModule(url) {
    return url.startsWith('https') ? https : http;
}

// Función para parsear URL de ComfyUI
function parseComfyUrl(comfyUrl) {
    const url = new URL(comfyUrl);
    return {
        protocol: url.protocol.replace(':', ''),
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? '443' : '8188'),
        baseUrl: comfyUrl.replace(/\/$/, '') // Remove trailing slash
    };
}

// Función para conectar a ComfyUI WebSocket
function connectToComfyUI() {
    if (wsComfy) {
        try {
            wsComfy.close();
        } catch (e) {
            console.error('Error closing previous WebSocket:', e);
        }
    }

    const parsedUrl = parseComfyUrl(config.comfyUrl);
    const wsProtocol = parsedUrl.protocol === 'https' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${parsedUrl.hostname}:${parsedUrl.port}/ws?clientId=${clientId}`;

    console.log(`Connecting to ComfyUI at: ${wsUrl}`);
    broadcastToClients({ type: 'connection_status', status: 'connecting', url: config.comfyUrl });

    wsComfy = new WebSocket(wsUrl);

    wsComfy.on('open', () => {
        console.log('✓ WebSocket connection established with ComfyUI');
        console.log(`✓ WebSocket ready state: ${wsComfy.readyState}`);
        broadcastToClients({ 
            type: 'connection_status', 
            status: 'connected', 
            url: config.comfyUrl,
            message: 'Conectado exitosamente a ComfyUI'
        });
    });

    wsComfy.on('error', (error) => {
        const errorMsg = error.message || 'Error desconocido';
        console.error('✗ WebSocket error:', errorMsg);
        broadcastToClients({ 
            type: 'connection_status', 
            status: 'error', 
            url: config.comfyUrl,
            error: errorMsg,
            message: `Error al conectar a ComfyUI: ${errorMsg}`
        });
    });

    wsComfy.on('close', (code, reason) => {
        console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason || 'No reason'}`);
        broadcastToClients({ 
            type: 'connection_status', 
            status: 'disconnected', 
            url: config.comfyUrl,
            message: 'Desconectado de ComfyUI'
        });
    });

    setupComfyWebSocketHandlers();
}

// Función para enviar mensajes a todos los clientes conectados
function broadcastToClients(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify(message));
            } catch (e) {
                console.error('Error broadcasting to client:', e);
            }
        }
    });
}

function setupComfyWebSocketHandlers() {
    wsComfy.on('message', async (data) => {
        const messageString = data.toString();
        console.log('WebSocket message received:', messageString);

        const message = JSON.parse(messageString);

        // Manejar progreso de ejecución
        if (message.type === 'progress') {
            const value = message.data.value;
            const max = message.data.max;
            const percent = Math.round((value / max) * 100);

            console.log(`Progress: ${value}/${max} (${percent}%)`);

            broadcastToClients({
                type: 'generation_progress',
                value: value,
                max: max,
                percent: percent,
                message: `⚙️ Generando: Step ${value}/${max}`
            });
        }

        // Manejar ejecución iniciada
        if (message.type === 'executing') {
            if (message.data.node) {
                console.log(`Executing node: ${message.data.node}`);
                broadcastToClients({
                    type: 'generation_status',
                    status: 'executing',
                    message: '🎨 ComfyUI procesando...'
                });
            }
        }

        if (message.type === 'executed') {
            const details = promptDetails[message.data.prompt_id];
            console.log(`Execution completed for prompt ID: ${message.data.prompt_id}`);

            const images = message.data.output.images;
            console.log('Images:', images);

            for (const image of images) {
                const subfolder = '';
                const parsedUrl = parseComfyUrl(config.comfyUrl);
                const downloadUrl = `${parsedUrl.baseUrl}/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(image.type)}`;
                console.log('Downloading image from:', downloadUrl);

                // Notificar que está descargando
                broadcastToClients({
                    type: 'generation_status',
                    status: 'downloading',
                    message: '📥 Descargando imagen desde ComfyUI...'
                });

                const filename = path.join(__dirname, 'public', 'imagenes', subfolder, image.filename);
                await downloadImage(downloadUrl, filename, subfolder);
                console.log(`Downloaded image: ${filename}`);

                const imagePath = subfolder ? `/imagenes/${subfolder}/${image.filename}` : `/imagenes/${image.filename}`;
                const imageUrl = `${imagePath}`;
                console.log(`📤 Sending image URL to client: ${imageUrl}`);
                
                // Incrementar contador de imágenes generadas
                systemState.imagesGenerated++;
                
                // Si es una imagen generada por el sistema (todos los jugadores), enviar al avatar
                if (details.isSystemGenerated && systemState.avatar.ws && systemState.avatar.ws.readyState === WebSocket.OPEN) {
                    systemState.avatar.ws.send(JSON.stringify({
                        type: 'image_generated',
                        url: imageUrl,
                        prompt: details.prompt
                    }));
                    
                    // Notificar al panel de control
                    broadcastToControlPanel({
                        type: 'image_generated',
                        url: imageUrl
                    });
                    
                    // Después de 15 segundos, reiniciar jugadores a index.html
                    setTimeout(() => {
                        for (const playerId in systemState.players) {
                            const player = systemState.players[playerId];
                            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                                player.ws.send(JSON.stringify({
                                    type: 'return_to_start'
                                }));
                            }
                        }
                        console.log('🔄 Jugadores redirigidos a inicio');
                    }, 15000);
                } else {
                    // Enviar a todos los clientes (para promptgenerator.html)
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'image_generated',
                                url: imageUrl,
                                prompt: details.prompt
                            }));
                        }
                    });
                }
            }
        }
    });
}

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

const port = 6250;
const server = http.createServer(app);
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const io = require('socket.io')(server);

const wss = new WebSocket.Server({ server });
const promptDetails = {};  // Almacena detalles del prompt

// Conectar a ComfyUI después de que el servidor esté listo
setTimeout(() => {
    connectToComfyUI();
}, 1000);

// Sistema de gestión de jugadores y pantallas
const systemState = {
    numPlayers: config.numPlayers || 3,
    players: {},
    avatar: { connected: false, state: 'loop' },
    controlPanel: null,
    playerPrompts: {},
    imagesGenerated: 0
};

wss.on('connection', async (ws, req) => {
    console.log('WebSocket client connected');
    
    // Extraer parámetros de la URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const playerId = url.searchParams.get('jugador');
    
    let clientType = 'unknown';
    let clientId = null;

    // Enviar estado actual de conexión al nuevo cliente
    if (wsComfy && wsComfy.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'connection_status',
            status: 'connected',
            url: config.comfyUrl,
            message: 'Conectado a ComfyUI'
        }));
    }

    ws.on('message', async (data) => {
        const message = JSON.parse(data);
        
        // Registro de cliente
        if (message.type === 'register') {
            clientType = message.clientType;
            
            if (clientType === 'player') {
                clientId = message.playerId;
                systemState.players[clientId] = {
                    ws: ws,
                    connected: true,
                    screen: message.screen || 'pantalla2',
                    prompt: null,
                    userName: null
                };
                
                console.log(`✓ Jugador ${clientId} registrado en ${systemState.players[clientId].screen}`);
                console.log(`📊 Estado actual de jugadores:`, Object.keys(systemState.players).map(id => ({
                    id,
                    connected: systemState.players[id].connected,
                    screen: systemState.players[id].screen
                })));
                
                // Enviar configuración del sistema al jugador
                ws.send(JSON.stringify({
                    type: 'system_config',
                    numPlayers: systemState.numPlayers
                }));
                
                // Notificar al panel de control
                console.log(`📢 Notificando al panel de control sobre jugador ${clientId}`);
                broadcastToControlPanel({
                    type: 'player_connected',
                    playerId: clientId,
                    screen: systemState.players[clientId].screen
                });
            } else if (clientType === 'avatar') {
                systemState.avatar.ws = ws;
                systemState.avatar.connected = true;
                console.log('✓ Pantalla Avatar registrada');
                
                broadcastToControlPanel({
                    type: 'avatar_connected'
                });
            } else if (clientType === 'control_panel') {
                systemState.controlPanel = ws;
                console.log('✓ Panel de Control registrado');
                console.log('📊 Estado actual al registrar control panel:', {
                    numPlayers: systemState.numPlayers,
                    playersConnected: Object.keys(systemState.players).length,
                    avatarConnected: systemState.avatar.connected
                });
                
                // Enviar estado actual del sistema
                const stateToSend = {
                    type: 'system_state',
                    state: {
                        numPlayers: systemState.numPlayers,
                        players: Object.fromEntries(
                            Object.entries(systemState.players).map(([id, p]) => [
                                id,
                                { connected: p.connected, screen: p.screen }
                            ])
                        ),
                        avatar: {
                            connected: systemState.avatar.connected,
                            state: systemState.avatar.state
                        },
                        imagesGenerated: systemState.imagesGenerated
                    }
                };
                console.log('📤 Enviando estado inicial al control panel:', stateToSend);
                ws.send(JSON.stringify(stateToSend));
            }
        }
        
        // Actualización de pantalla del jugador
        if (message.type === 'player_screen_change' && clientType === 'player') {
            systemState.players[clientId].screen = message.screen;
            broadcastToControlPanel({
                type: 'player_screen_changed',
                playerId: clientId,
                screen: message.screen
            });
        }
        
        // Guardar nombre de usuario
        if (message.type === 'player_name' && clientType === 'player') {
            systemState.players[clientId].userName = message.userName;
            console.log(`✓ Jugador ${clientId}: ${message.userName}`);
        }
        
        // Guardar selección de prompt del jugador
        if (message.type === 'player_prompt' && clientType === 'player') {
            systemState.players[clientId].prompt = message.prompt;
            console.log(`✓ Jugador ${clientId} completó su selección`);
            
            // Verificar si todos los jugadores completaron
            checkAllPlayersReady();
        }
        
        // Generación de imagen (desde promptgenerator.html o sistema)
        if (message.type === 'generarImagen') {
            console.log(`📥 Prompt received: ${message.prompt}`);
            console.log(`📊 Parámetros:`, message.params);

            // Cambiar estado del avatar a "loading"
            changeAvatarState('loading');

            // Notificar al cliente que se está procesando
            ws.send(JSON.stringify({
                type: 'generation_status',
                status: 'queued',
                message: '🔄 Prompt en cola para procesamiento'
            }));

            try {
                const params = message.params || {};
                const negativePrompt = message.negativePrompt || '';
                const promptId = await generarImagen(message.prompt, params, negativePrompt);
                promptDetails[promptId] = { prompt: message.prompt, ws: ws };

                console.log(`✓ Prompt queued with ID: ${promptId}`);
                ws.send(JSON.stringify({
                    type: 'generation_status',
                    status: 'processing',
                    promptId: promptId,
                    message: '⚙️ ComfyUI está generando la imagen...'
                }));
            } catch (error) {
                console.error('❌ Error queuing prompt:', error);
                ws.send(JSON.stringify({
                    type: 'generation_status',
                    status: 'error',
                    message: '❌ Error al enviar prompt a ComfyUI: ' + error.message
                }));
            }
        }
        
        // Solicitud de estado del sistema
        if (message.type === 'request_system_state' && clientType === 'control_panel') {
            ws.send(JSON.stringify({
                type: 'system_state',
                state: {
                    numPlayers: systemState.numPlayers,
                    players: Object.fromEntries(
                        Object.entries(systemState.players).map(([id, p]) => [
                            id,
                            { connected: p.connected, screen: p.screen }
                        ])
                    ),
                    avatar: {
                        connected: systemState.avatar.connected,
                        state: systemState.avatar.state
                    },
                    imagesGenerated: systemState.imagesGenerated
                }
            }));
        }
        
        // Actualizar configuración
        if (message.type === 'update_config' && clientType === 'control_panel') {
            systemState.numPlayers = message.config.numPlayers;
            
            // Guardar en config.json
            config.numPlayers = message.config.numPlayers;
            saveConfig(config);
            
            console.log(`✓ Configuración actualizada y guardada: ${systemState.numPlayers} jugadores`);
        }
        
        // Reiniciar sistema
        if (message.type === 'reset_system' && clientType === 'control_panel') {
            resetSystem();
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        
        if (clientType === 'player' && clientId) {
            systemState.players[clientId].connected = false;
            broadcastToControlPanel({
                type: 'player_disconnected',
                playerId: clientId
            });
        } else if (clientType === 'avatar') {
            systemState.avatar.connected = false;
            broadcastToControlPanel({
                type: 'avatar_disconnected'
            });
        }
    });
});

// Funciones auxiliares del sistema
function broadcastToControlPanel(message) {
    if (systemState.controlPanel && systemState.controlPanel.readyState === WebSocket.OPEN) {
        console.log('📤 Enviando a Control Panel:', message);
        systemState.controlPanel.send(JSON.stringify(message));
    } else {
        console.log('⚠️ Control Panel no conectado. No se puede enviar:', message.type);
    }
}

function changeAvatarState(newState) {
    systemState.avatar.state = newState;
    
    if (systemState.avatar.ws && systemState.avatar.ws.readyState === WebSocket.OPEN) {
        systemState.avatar.ws.send(JSON.stringify({
            type: 'change_state',
            state: newState
        }));
    }
    
    broadcastToControlPanel({
        type: 'avatar_state_changed',
        state: newState
    });
}

function checkAllPlayersReady() {
    const activePlayers = Object.values(systemState.players)
        .filter(p => p.connected && p.prompt);
    
    if (activePlayers.length >= systemState.numPlayers) {
        console.log('✓ Todos los jugadores completaron sus selecciones');
        
        // Extraer palabras clave de todos los prompts
        const allKeywords = [];
        activePlayers.forEach(p => {
            // Extraer palabras después de los dos puntos en cada sección
            const matches = p.prompt.match(/:\s*([^.]+)/g);
            if (matches) {
                matches.forEach(match => {
                    const words = match.replace(':', '').trim().split(',').map(w => w.trim());
                    allKeywords.push(...words);
                });
            }
        });
        
        // Crear prompt futurista y cyberpunk
        const enhancedPrompt = `A futuristic cyberpunk vision of San Juan, Argentina in the year 2050. 
Ultra-modern cityscape with neon lights, holographic displays, and advanced technology. 
The city features: ${allKeywords.join(', ')}. 
Style: cyberpunk, futuristic, neon-lit, high-tech, sci-fi, digital art, concept art, 
cinematic lighting, vibrant colors, ultra detailed, 8k quality, masterpiece.
Atmosphere: innovative, sustainable, technologically advanced.`;
        
        console.log(`📝 Prompt mejorado: ${enhancedPrompt}`);
        
        // Enviar al control panel
        broadcastToControlPanel({
            type: 'prompt_generated',
            playerPrompts: activePlayers.map(p => ({
                playerId: p.id,
                prompt: p.prompt
            })),
            keywords: allKeywords,
            finalPrompt: enhancedPrompt
        });
        
        // Generar imagen con el prompt mejorado
        setTimeout(() => {
            generateCombinedImage(enhancedPrompt);
        }, 2000);
    }
}

async function generateCombinedImage(combinedPrompt) {
    try {
        changeAvatarState('loading');
        
        const params = {
            steps: 20,
            width: 1184,
            height: 1184,
            model: 'flux1-dev-fp8.safetensors',
            guidance: 3.5,
            loraName: 'Flux_SanJuanv1.safetensors',
            loraStrength: 1.0
        };
        
        const promptId = await generarImagen(combinedPrompt, params);
        promptDetails[promptId] = { 
            prompt: combinedPrompt, 
            ws: systemState.avatar.ws,
            isSystemGenerated: true
        };
        
        console.log(`✓ Imagen del sistema en cola con ID: ${promptId}`);
    } catch (error) {
        console.error('❌ Error generando imagen del sistema:', error);
        changeAvatarState('loop');
    }
}

function resetSystem() {
    console.log('🔄 Reiniciando sistema...');
    
    // Limpiar prompts de jugadores
    Object.values(systemState.players).forEach(player => {
        player.prompt = null;
        player.userName = null;
    });
    
    // Volver al estado inicial
    changeAvatarState('loop');
    
    // Notificar a todos los jugadores
    Object.values(systemState.players).forEach(player => {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({
                type: 'system_reset'
            }));
        }
    });
}

io.on('connection', function(socket) {
    console.log('SOCKET IO');
    socket.on('slider change', function(data) {
        console.log('Slider value received: ', data);
        socket.broadcast.emit('slider update', data);
    });
    socket.on('disconnect', function() {
        console.log('User disconnected');
    });
});

// API endpoints para configuración
app.get('/api/config', (req, res) => {
    res.json(config);
});

// Endpoint para obtener imágenes de la galería
app.get('/api/gallery-images', (req, res) => {
    const imagesDir = path.join(__dirname, 'public', 'imagenes');
    
    try {
        if (!fs.existsSync(imagesDir)) {
            return res.json([]);
        }
        
        const files = fs.readdirSync(imagesDir);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });
        
        res.json(imageFiles);
    } catch (error) {
        console.error('Error leyendo galería:', error);
        res.status(500).json({ error: 'Error al cargar galería' });
    }
});

// Endpoint para obtener modelos disponibles
app.get('/api/models', async (req, res) => {
    try {
        const parsedUrl = parseComfyUrl(config.comfyUrl);
        const httpModule = getHttpModule(config.comfyUrl);

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: '/object_info',
            method: 'GET'
        };

        const request = httpModule.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                try {
                    const objectInfo = JSON.parse(data);
                    const checkpointLoader = objectInfo.CheckpointLoaderSimple;
                    if (checkpointLoader && checkpointLoader.input && checkpointLoader.input.required) {
                        const models = checkpointLoader.input.required.ckpt_name[0];
                        res.json({ success: true, models });
                    } else {
                        res.json({ success: false, error: 'No se pudo obtener la lista de modelos' });
                    }
                } catch (e) {
                    res.json({ success: false, error: 'Error al parsear respuesta: ' + e.message });
                }
            });
        });

        request.on('error', (error) => {
            res.json({ success: false, error: error.message });
        });

        request.end();
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/config', (req, res) => {
    const newConfig = req.body;
    if (!newConfig.comfyUrl) {
        return res.status(400).json({ error: 'comfyUrl is required' });
    }

    config = newConfig;
    if (saveConfig(config)) {
        // Reconectar con la nueva configuración
        connectToComfyUI();
        res.json({ success: true, config });
    } else {
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

async function readWorkflowAPI() {
    const data = await fs.promises.readFile(path.join(__dirname, 'workflow_api.json'), 'utf8');
    return JSON.parse(data);
}

async function readWorkflowMultiLora() {
    const data = await fs.promises.readFile(path.join(__dirname, 'comfy', 'workflow_multilora.json'), 'utf8');
    return JSON.parse(data);
}

async function uploadImage(filePath) {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath));

    const parsedUrl = parseComfyUrl(config.comfyUrl);
    const httpModule = getHttpModule(config.comfyUrl);

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: '/upload/image',
        method: 'POST',
        headers: formData.getHeaders()
    };

    return new Promise((resolve, reject) => {
        const req = httpModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve(JSON.parse(data));
            });
        });
        req.on('error', (e) => reject(e));
        formData.pipe(req);
    });
}

async function queuePrompt(promptWorkflow) {
    const postData = JSON.stringify({ prompt: promptWorkflow, client_id: clientId });
    const parsedUrl = parseComfyUrl(config.comfyUrl);
    const httpModule = getHttpModule(config.comfyUrl);

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: '/prompt',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = httpModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve(JSON.parse(data).prompt_id);
            });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function getHistory(promptId) {
    const parsedUrl = parseComfyUrl(config.comfyUrl);
    const httpModule = getHttpModule(config.comfyUrl);
    const url = `${parsedUrl.baseUrl}/history/${promptId}`;

    return new Promise((resolve, reject) => {
        httpModule.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(JSON.parse(data));
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function downloadImage(url, filename, subfolder) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(filename);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filePath = filename;
        const file = fs.createWriteStream(filePath);
        const httpModule = getHttpModule(url);

        httpModule.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => reject(err));
        });
    });
}

// Función para validar si un modelo existe
async function validateModel(modelName) {
    try {
        const parsedUrl = parseComfyUrl(config.comfyUrl);
        const httpModule = getHttpModule(config.comfyUrl);

        return new Promise((resolve) => {
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: '/object_info',
                method: 'GET'
            };

            const request = httpModule.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    try {
                        const objectInfo = JSON.parse(data);
                        const checkpointLoader = objectInfo.CheckpointLoaderSimple;
                        if (checkpointLoader && checkpointLoader.input && checkpointLoader.input.required) {
                            const models = checkpointLoader.input.required.ckpt_name[0];
                            const exists = models.includes(modelName);
                            resolve({ exists, availableModels: models });
                        } else {
                            resolve({ exists: false, availableModels: [] });
                        }
                    } catch (e) {
                        resolve({ exists: false, availableModels: [] });
                    }
                });
            });

            request.on('error', () => {
                resolve({ exists: false, availableModels: [] });
            });

            request.end();
        });
    } catch (error) {
        return { exists: false, availableModels: [] };
    }
}

async function generarImagen(promptText, params = {}, negativePrompt = '') {
    // Detectar si se usan múltiples LoRAs
    const useMultiLora = params.loras && Array.isArray(params.loras) && params.loras.length > 1;
    const promptWorkflow = useMultiLora ? await readWorkflowMultiLora() : await readWorkflowAPI();

    // Parámetros por defecto para Flux
    const steps = params.steps || 20;
    const width = params.width || 1184;
    const height = params.height || 1184;
    const seed = params.seed || Math.floor(Math.random() * 18446744073709551614) + 1;
    const model = params.model || 'flux1-dev-fp8.safetensors';
    const guidance = params.guidance || 3.5;
    const loraName = params.loraName || 'Flux_SanJuanv1.safetensors';
    const loraStrength = params.loraStrength || 1.0;

    console.log(`🎨 Generando imagen con Flux + LoRA:`, { 
        promptText,
        negativePrompt, 
        steps, 
        width, 
        height, 
        seed, 
        model, 
        guidance,
        multiLora: useMultiLora,
        loras: useMultiLora ? params.loras : [{ name: loraName, strength: loraStrength }]
    });

    // Validar si el modelo existe
    const modelValidation = await validateModel(model);
    if (!modelValidation.exists) {
        console.error(`❌ Modelo "${model}" no encontrado en ComfyUI`);
        console.log(`📋 Modelos disponibles:`, modelValidation.availableModels.slice(0, 5).join(', '));

        // Notificar al cliente
        broadcastToClients({
            type: 'generation_status',
            status: 'error',
            message: `❌ Modelo "${model}" no encontrado. Usando modelo por defecto.`
        });

        // Usar el primer modelo disponible como fallback
        if (modelValidation.availableModels.length > 0) {
            promptWorkflow["30"]["inputs"]["ckpt_name"] = modelValidation.availableModels[0];
            console.log(`✓ Usando modelo fallback: ${modelValidation.availableModels[0]}`);
        }
    } else {
        console.log(`✓ Modelo "${model}" encontrado`);
        promptWorkflow["30"]["inputs"]["ckpt_name"] = model;

        broadcastToClients({
            type: 'generation_status',
            status: 'info',
            message: `✓ Usando Flux con LoRA: ${loraName}`
        });
    }

    // Configurar parámetros del workflow Flux
    // Nodo 30: CheckpointLoaderSimple (ya configurado arriba)
    
    if (useMultiLora) {
        // Multi-LoRA: configurar nodos 38 (primer LoRA) y 50 (segundo LoRA)
        const lora1 = params.loras[0];
        const lora2 = params.loras[1];
        
        promptWorkflow["38"]["inputs"]["lora_name"] = lora1.name;
        promptWorkflow["38"]["inputs"]["strength_model"] = lora1.strength;
        promptWorkflow["38"]["inputs"]["strength_clip"] = lora1.strength;
        
        promptWorkflow["50"]["inputs"]["lora_name"] = lora2.name;
        promptWorkflow["50"]["inputs"]["strength_model"] = lora2.strength;
        promptWorkflow["50"]["inputs"]["strength_clip"] = lora2.strength;
    } else {
        // Single LoRA: solo nodo 38
        promptWorkflow["38"]["inputs"]["lora_name"] = loraName;
        promptWorkflow["38"]["inputs"]["strength_model"] = loraStrength;
        promptWorkflow["38"]["inputs"]["strength_clip"] = loraStrength;
    }
    
    // Nodo 6: CLIP Text Encode (Positive Prompt)
    promptWorkflow["6"]["inputs"]["text"] = promptText;
    
    // Nodo 33: CLIP Text Encode (Negative Prompt)
    promptWorkflow["33"]["inputs"]["text"] = negativePrompt || "";
    
    // Nodo 35: FluxGuidance
    promptWorkflow["35"]["inputs"]["guidance"] = guidance;
    
    // Nodo 27: EmptySD3LatentImage
    promptWorkflow["27"]["inputs"]["width"] = width;
    promptWorkflow["27"]["inputs"]["height"] = height;
    promptWorkflow["27"]["inputs"]["batch_size"] = 1;
    
    // Nodo 31: KSampler
    promptWorkflow["31"]["inputs"]["seed"] = seed;
    promptWorkflow["31"]["inputs"]["steps"] = steps;
    promptWorkflow["31"]["inputs"]["cfg"] = 1; // Flux usa CFG=1
    promptWorkflow["31"]["inputs"]["sampler_name"] = "euler";
    promptWorkflow["31"]["inputs"]["scheduler"] = "simple";
    promptWorkflow["31"]["inputs"]["denoise"] = 1;
    
    // Nodo 9: SaveImage
    promptWorkflow["9"]["inputs"]["filename_prefix"] = "ComfyUI";

    const promptId = await queuePrompt(promptWorkflow);

    console.log(`✓ Prompt en cola con ID: ${promptId}`);
    return promptId;
}

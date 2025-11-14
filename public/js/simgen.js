// ============================================
// CONFIGURACIÓN DE PROMPT MÁGICO
// Ajusta estos valores para experimentar con diferentes rangos
// ============================================

const MAGIC_PROMPT_CONFIG = {
    // Rango de fuerza del LoRA de San Juan
    sanJuanStrength: {
        min: .5,
        max: .5
    },
    // Rango de fuerza del LoRA Solarpunk
    solarpunkStrength: {
        min: 0.5,
        max: .5
    },
    // Rango de Flux guidance
    fluxGuidance: {
        min: 3.5,
        max: 3.5
    },
    // Rango de steps (número de pasos de generación)
    steps: {
        min: 15,
        max: 25
    }
};

// ============================================
// VARIABLES GLOBALES
// ============================================

let ws = null;
let isGenerating = false;
let prompts = [];
let currentGenerationIndex = null;

// ============================================
// WEBSOCKET
// ============================================

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket conectado');
        updateConnectionStatus('connected', '✓ Conectado');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Mensaje recibido:', message);

        if (message.type === 'connection_status') {
            if (message.status === 'connected') {
                updateConnectionStatus('connected', '✓ ComfyUI Conectado');
            } else if (message.status === 'error') {
                updateConnectionStatus('error', '✗ Error de conexión');
            }
        }

        if (message.type === 'generation_status') {
            updateStatus(message.message);
            if (message.status === 'error') {
                isGenerating = false;
                updateButtonsState(false);
                hideGlobalProgress();
            }
        }

        if (message.type === 'generation_progress') {
            updateStatus(message.message);
            updateGlobalProgress(message.percent);
        }

        if (message.type === 'image_generated') {
            const url = message.url;
            console.log('Imagen generada:', url);
            
            // Guardar metadata con la imagen
            const metadata = prompts[currentGenerationIndex] ? {
                prompt: prompts[currentGenerationIndex].prompt,
                steps: prompts[currentGenerationIndex].steps,
                sanJuanStrength: prompts[currentGenerationIndex].sanJuanStrength,
                solarStrength: prompts[currentGenerationIndex].solarStrength,
                guidance: prompts[currentGenerationIndex].guidance
            } : null;
            
            addImageToGallery(url, currentGenerationIndex, metadata);
            updatePromptStatus(currentGenerationIndex, '✓ Imagen generada');

            isGenerating = false;
            updateButtonsState(false);
            hideGlobalProgress();

            if (currentGenerationIndex !== null && currentGenerationIndex + 1 < prompts.length && prompts[currentGenerationIndex + 1]) {
                generatePromptAtIndex(currentGenerationIndex + 1);
            } else {
                currentGenerationIndex = null;
                updateStatus('✓ Todas las imágenes generadas');
            }
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus('error', '✗ Error de conexión');
    };

    ws.onclose = () => {
        console.log('WebSocket desconectado');
        updateConnectionStatus('error', '✗ Desconectado');
        setTimeout(connectWebSocket, 3000);
    };
}

// ============================================
// UI UPDATES
// ============================================

function updateConnectionStatus(status, text) {
    const statusEl = document.getElementById('connectionStatus');
    statusEl.textContent = text;
    statusEl.className = `connection-status ${status}`;
}

function updateStatus(text) {
    document.getElementById('statusText').textContent = text;
}

function showGlobalProgress() {
    const bar = document.getElementById('globalProgressBar');
    bar.style.display = 'block';
    document.getElementById('globalProgressFill').style.width = '0%';
}

function updateGlobalProgress(percent) {
    const fill = document.getElementById('globalProgressFill');
    fill.style.width = percent + '%';
}

function hideGlobalProgress() {
    document.getElementById('globalProgressBar').style.display = 'none';
}

// ============================================
// PROMPT MANAGEMENT
// ============================================

function createPromptItem(data, index) {
    const container = document.createElement('div');
    container.className = 'prompt-item';
    container.dataset.index = index;

    const promptRow = document.createElement('div');
    promptRow.className = 'prompt-row';

    const textDiv = document.createElement('div');
    textDiv.className = 'prompt-text';
    const textLabel = document.createElement('label');
    textLabel.textContent = `Prompt #${index + 1}`;
    const textarea = document.createElement('textarea');
    textarea.value = data.prompt || '';
    textarea.placeholder = 'Describe la imagen para este prompt...';
    textarea.addEventListener('input', () => {
        prompts[index].prompt = textarea.value;
        autoSaveConfig();
    });
    textDiv.appendChild(textLabel);
    textDiv.appendChild(textarea);

    const paramsDiv = document.createElement('div');
    paramsDiv.className = 'prompt-params';

    function createParam(name, labelText, min, max, step, valueKey, isInteger = false) {
        const group = document.createElement('div');
        group.className = 'param-group';
        const label = document.createElement('label');
        const spanName = document.createElement('span');
        spanName.textContent = labelText;
        const spanVal = document.createElement('span');
        spanVal.textContent = isInteger ? data[valueKey] : data[valueKey].toFixed(2);
        label.appendChild(spanName);
        label.appendChild(spanVal);
        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = data[valueKey];
        input.addEventListener('input', () => {
            const v = isInteger ? parseInt(input.value) : parseFloat(input.value);
            spanVal.textContent = isInteger ? v : v.toFixed(2);
            prompts[index][valueKey] = v;
            autoSaveConfig();
        });
        group.appendChild(label);
        group.appendChild(input);
        return group;
    }

    paramsDiv.appendChild(createParam('steps', 'Steps', 10, 50, 1, 'steps', true));
    paramsDiv.appendChild(createParam('sanjuan', 'Fuerza San Juan', 0, 2, 0.05, 'sanJuanStrength'));
    paramsDiv.appendChild(createParam('solarpunk', 'Fuerza Solarpunk', 0, 2, 0.05, 'solarStrength'));
    paramsDiv.appendChild(createParam('guidance', 'Flux guidance', 0, 10, 0.1, 'guidance'));

    promptRow.appendChild(textDiv);
    promptRow.appendChild(paramsDiv);

    const footer = document.createElement('div');
    footer.className = 'prompt-footer';

    const statusSpan = document.createElement('div');
    statusSpan.className = 'prompt-status';
    statusSpan.textContent = data.status || 'Listo';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'prompt-actions';

    const playBtn = document.createElement('button');
    playBtn.className = 'small-button';
    playBtn.textContent = '▶ Generar';
    playBtn.addEventListener('click', () => {
        generatePromptAtIndex(index, true);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'small-button danger';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => {
        removePrompt(index);
    });

    buttonsDiv.appendChild(playBtn);
    buttonsDiv.appendChild(deleteBtn);

    footer.appendChild(statusSpan);
    footer.appendChild(buttonsDiv);

    container.appendChild(promptRow);
    container.appendChild(footer);

    container._statusSpan = statusSpan;
    container._playBtn = playBtn;

    return container;
}

function renderPrompts() {
    const list = document.getElementById('promptList');
    list.innerHTML = '';
    prompts.forEach((p, i) => {
        const item = createPromptItem(p, i);
        prompts[i]._dom = item;
        list.appendChild(item);
    });
}

function addPrompt(initialData) {
    const data = Object.assign({
        prompt: '',
        steps: 20,
        sanJuanStrength: 1,
        solarStrength: 1,
        guidance: 3.5,
        status: 'Listo'
    }, initialData || {});
    prompts.push(data);
    renderPrompts();
    autoSaveConfig();
}

function removePrompt(index) {
    prompts.splice(index, 1);
    renderPrompts();
    autoSaveConfig();
}

function setActivePrompt(index) {
    prompts.forEach((p, i) => {
        if (p._dom) {
            if (i === index) {
                p._dom.classList.add('active');
            } else {
                p._dom.classList.remove('active');
            }
        }
    });
}

function updatePromptStatus(index, text) {
    if (prompts[index] && prompts[index]._dom) {
        prompts[index].status = text;
        prompts[index]._dom._statusSpan.textContent = text;
    }
}

function updateButtonsState(disabled) {
    document.getElementById('generateAllBtn').disabled = disabled;
    const list = document.getElementById('promptList');
    list.querySelectorAll('button').forEach(btn => {
        btn.disabled = disabled && !btn.classList.contains('danger');
    });
}

function validatePromptData(p) {
    return p && p.prompt && p.prompt.trim().length > 0;
}

// ============================================
// IMAGE GENERATION
// ============================================

function generatePromptAtIndex(index, single = false) {
    if (isGenerating) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('No hay conexión con el servidor.');
        return;
    }

    const data = prompts[index];
    if (!validatePromptData(data)) {
        alert(`El prompt #${index + 1} está vacío.`);
        return;
    }

    isGenerating = true;
    currentGenerationIndex = index;
    updateButtonsState(true);
    showGlobalProgress();
    setActivePrompt(index);

    updateStatus(`🔄 Generando prompt #${index + 1}...`);
    updatePromptStatus(index, 'Generando...');

    // Generar seed aleatorio único para cada generación
    const seed = Math.floor(Math.random() * 18446744073709551614) + 1;
    console.log(`🎲 Seed generado para prompt #${index + 1}: ${seed}`);

    const message = {
        type: 'generarImagen',
        prompt: data.prompt,
        params: {
            seed: seed,
            steps: data.steps || 20,
            width: 1184,
            height: 1184,
            model: 'flux1-dev-fp8.safetensors',
            guidance: data.guidance,
            loras: [
                {
                    name: 'Flux_SanJuanv1.safetensors',
                    strength: data.sanJuanStrength
                },
                {
                    name: 'Solarpunk style v1-step00001900.safetensors',
                    strength: data.solarStrength
                }
            ]
        }
    };

    console.log('📤 Enviando mensaje:', JSON.stringify(message, null, 2));
    ws.send(JSON.stringify(message));
}

function generateAll() {
    if (isGenerating) return;
    if (prompts.length === 0) {
        alert('No hay prompts en la lista');
        return;
    }

    const firstValidIndex = prompts.findIndex(validatePromptData);
    if (firstValidIndex === -1) {
        alert('Todos los prompts están vacíos');
        return;
    }

    generatePromptAtIndex(firstValidIndex);
}

// ============================================
// GALLERY
// ============================================

function addImageToGallery(url, promptIndex, metadata) {
    const grid = document.getElementById('galleryGrid');
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    // Guardar metadata en el elemento
    if (metadata) {
        item.dataset.prompt = metadata.prompt;
        item.dataset.steps = metadata.steps;
        item.dataset.sanjuanStrength = metadata.sanJuanStrength;
        item.dataset.solarStrength = metadata.solarStrength;
        item.dataset.guidance = metadata.guidance;
    }
    
    const img = document.createElement('img');
    img.src = url;
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => openImageModal(url, metadata));
    
    const caption = document.createElement('div');
    caption.className = 'gallery-item-caption';
    const label = prompts[promptIndex] ? `Prompt #${promptIndex + 1}` : 'Prompt';
    caption.textContent = `${label}`;
    
    // Mostrar parámetros en el caption
    if (metadata) {
        const paramsText = document.createElement('div');
        paramsText.style.fontSize = '10px';
        paramsText.style.opacity = '0.7';
        paramsText.style.marginTop = '4px';
        paramsText.textContent = `Steps:${metadata.steps} | SJ:${metadata.sanJuanStrength} | SP:${metadata.solarStrength} | G:${metadata.guidance}`;
        caption.appendChild(paramsText);
    }
    
    const actions = document.createElement('div');
    actions.className = 'gallery-item-actions';
    const viewBtn = document.createElement('button');
    viewBtn.className = 'small-button';
    viewBtn.textContent = '🔍 Ver grande';
    viewBtn.style.fontSize = '11px';
    viewBtn.style.padding = '4px 8px';
    viewBtn.addEventListener('click', () => openImageModal(url, metadata));
    actions.appendChild(viewBtn);
    
    item.appendChild(img);
    item.appendChild(caption);
    item.appendChild(actions);
    grid.prepend(item);
}

function openImageModal(url, metadata) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = url;
    
    // Mostrar metadata si existe
    let metadataDiv = document.getElementById('modalMetadata');
    if (!metadataDiv) {
        metadataDiv = document.createElement('div');
        metadataDiv.id = 'modalMetadata';
        metadataDiv.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid var(--primary-color);
            color: var(--primary-color);
            font-family: 'Arkitech', sans-serif;
            font-size: 12px;
            max-width: 80%;
            text-align: center;
        `;
        document.querySelector('.gallery-modal-content').appendChild(metadataDiv);
    }
    
    if (metadata) {
        metadataDiv.innerHTML = `
            <div style="margin-bottom: 6px; font-weight: bold;">PARÁMETROS</div>
            <div style="font-size: 11px; line-height: 1.6;">
                <div><strong>Prompt:</strong> ${metadata.prompt}</div>
                <div><strong>Steps:</strong> ${metadata.steps} | <strong>San Juan:</strong> ${metadata.sanJuanStrength} | <strong>Solarpunk:</strong> ${metadata.solarStrength} | <strong>Guidance:</strong> ${metadata.guidance}</div>
            </div>
        `;
        metadataDiv.style.display = 'block';
    } else {
        metadataDiv.style.display = 'none';
    }
    
    modal.classList.add('active');
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
}

function clearGallery() {
    document.getElementById('galleryGrid').innerHTML = '';
}

// ============================================
// CONFIG PERSISTENCE
// ============================================

function saveConfigToObject() {
    return {
        version: 1,
        prompts: prompts.map(p => ({
            prompt: p.prompt,
            steps: p.steps,
            sanJuanStrength: p.sanJuanStrength,
            solarStrength: p.solarStrength,
            guidance: p.guidance
        }))
    };
}

function autoSaveConfig() {
    try {
        const obj = saveConfigToObject();
        localStorage.setItem('promptgenerator2_config', JSON.stringify(obj));
    } catch (e) {
        console.warn('No se pudo autosalvar config:', e);
    }
}

function loadConfigFromLocalStorage() {
    try {
        const raw = localStorage.getItem('promptgenerator2_config');
        if (!raw) return;
        const obj = JSON.parse(raw);
        if (!obj || !Array.isArray(obj.prompts)) return;
        prompts = obj.prompts.map(p => ({
            prompt: p.prompt || '',
            steps: typeof p.steps === 'number' ? p.steps : 20,
            sanJuanStrength: typeof p.sanJuanStrength === 'number' ? p.sanJuanStrength : 1,
            solarStrength: typeof p.solarStrength === 'number' ? p.solarStrength : 1,
            guidance: typeof p.guidance === 'number' ? p.guidance : 3.5,
            status: 'Listo'
        }));
        renderPrompts();
    } catch (e) {
        console.warn('No se pudo cargar config desde localStorage:', e);
    }
}

function downloadConfigJson() {
    const obj = saveConfigToObject();
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `promptgenerator2_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadConfigFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const obj = JSON.parse(e.target.result);
            if (!obj || !Array.isArray(obj.prompts)) {
                alert('JSON inválido');
                return;
            }
            prompts = obj.prompts.map(p => ({
                prompt: p.prompt || '',
                steps: typeof p.steps === 'number' ? p.steps : 20,
                sanJuanStrength: typeof p.sanJuanStrength === 'number' ? p.sanJuanStrength : 1,
                solarStrength: typeof p.solarStrength === 'number' ? p.solarStrength : 1,
                guidance: typeof p.guidance === 'number' ? p.guidance : 3.5,
                status: 'Listo'
            }));
            renderPrompts();
            autoSaveConfig();
            updateStatus('Configuración cargada desde JSON');
        } catch (err) {
            console.error(err);
            alert('Error al leer el archivo JSON');
        }
    };
    reader.readAsText(file);
}

// ============================================
// MAGIC PROMPT ALGORITHM
// ============================================

function generateMagicPrompt() {
    // Conceptos de pantalla3.js (categorías de oportunidades)
    const innovacionTech = [
        'inteligencia artificial', 'robótica', 'transformación digital',
        'ciencia aplicada', 'economía del conocimiento', 'modernización tecnológica'
    ];
    const agriculturaGanaderia = [
        'riego eficiente', 'buenas prácticas agrícolas', 'sanidad vegetal',
        'agroindustria', 'sostenibilidad', 'producción sustentable'
    ];
    const mineriaIndustria = [
        'industria limpia', 'parques industriales', 'comercio digital',
        'PYMEs', 'diseño y calidad', 'exportación', 'logística moderna'
    ];
    const talentoOportunidades = [
        'nuevos empleos', 'educación y desarrollo', 'herramientas financieras',
        'inversiones productivas', 'diversificación', 'energías renovables', 'turismo'
    ];

    // Paisajes y lugares típicos de San Juan
    const paisajesSJ = [
        'viñedos', 'dique de Ullum', 'cerros de colores', 'valles',
        'ciudad de San Juan', 'pueblos del interior', 'rutas cordilleranas',
        'mercado de productores', 'plazas históricas', 'observatorio astronómico',
        'campos de olivos', 'ríos', 'parques urbanos', 'barrios tradicionales',
        'terminal de ómnibus', 'costanera del dique'
    ];

    // Términos de estética solarpunk
    const solarpunkTerms = [
        'paneles solares integrados', 'arquitectura verde', 'jardines verticales',
        'luces de neón cian', 'estructuras bioluminiscentes', 'energía limpia',
        'techos verdes', 'turbinas eólicas discretas', 'pasarelas de vidrio',
        'displays holográficos', 'vehículos eléctricos', 'drones',
        'iluminación solar', 'reciclaje avanzado', 'huertas comunitarias',
        'fuentes de agua reciclada', 'fibras ópticas decorativas'
    ];

    // Modificadores de atmósfera
    const atmosfera = [
        'al atardecer', 'de noche con cielo estrellado', 'bajo la luz del día',
        'con reflejos en el agua', 'iluminado en tonos turquesa',
        'ambiente optimista', 'cielo limpio y cálido', 'noche clara'
    ];

    // Selección aleatoria
    const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Combinar conceptos (1-2 de oportunidades)
    const allConcepts = [
        ...innovacionTech, ...agriculturaGanaderia,
        ...mineriaIndustria, ...talentoOportunidades
    ];
    const concept1 = randomFrom(allConcepts);
    const useConcept2 = Math.random() > 0.5;
    const concept2 = useConcept2 ? randomFrom(allConcepts.filter(c => c !== concept1)) : null;

    // Paisaje de San Juan
    const paisaje = randomFrom(paisajesSJ);

    // 1-3 elementos solarpunk
    const numSolar = Math.floor(Math.random() * 3) + 1;
    const solarElements = [];
    for (let i = 0; i < numSolar; i++) {
        const elem = randomFrom(solarpunkTerms.filter(e => !solarElements.includes(e)));
        solarElements.push(elem);
    }

    // Atmósfera
    const atm = randomFrom(atmosfera);

    // Construir prompt
    let prompt = `${paisaje} de San Juan`;
    if (concept2) {
        prompt += `, con ${concept1} y ${concept2}`;
    } else {
        prompt += `, con ${concept1}`;
    }
    prompt += `, ${solarElements.join(', ')}`;
    prompt += `, ${atm}, estilo solarpunk futurista`;

    // Randomizar parámetros usando la configuración editable
    const sjRange = MAGIC_PROMPT_CONFIG.sanJuanStrength.max - MAGIC_PROMPT_CONFIG.sanJuanStrength.min;
    const spRange = MAGIC_PROMPT_CONFIG.solarpunkStrength.max - MAGIC_PROMPT_CONFIG.solarpunkStrength.min;
    const gRange = MAGIC_PROMPT_CONFIG.fluxGuidance.max - MAGIC_PROMPT_CONFIG.fluxGuidance.min;
    const stepsRange = MAGIC_PROMPT_CONFIG.steps.max - MAGIC_PROMPT_CONFIG.steps.min;

    const steps = Math.floor(Math.random() * stepsRange + MAGIC_PROMPT_CONFIG.steps.min);
    const sanJuanStrength = parseFloat((Math.random() * sjRange + MAGIC_PROMPT_CONFIG.sanJuanStrength.min).toFixed(2));
    const solarStrength = parseFloat((Math.random() * spRange + MAGIC_PROMPT_CONFIG.solarpunkStrength.min).toFixed(2));
    const guidance = parseFloat((Math.random() * gRange + MAGIC_PROMPT_CONFIG.fluxGuidance.min).toFixed(1));

    return {
        prompt,
        steps,
        sanJuanStrength,
        solarStrength,
        guidance
    };
}

// ============================================
// EVENT LISTENERS
// ============================================

document.getElementById('addPromptBtn').addEventListener('click', () => addPrompt());
document.getElementById('addMagicPromptBtn').addEventListener('click', () => {
    const magic = generateMagicPrompt();
    addPrompt(magic);
    updateStatus('✨ Prompt mágico generado');
});
document.getElementById('clearPromptsBtn').addEventListener('click', () => {
    if (!confirm('¿Eliminar todos los prompts?')) return;
    prompts = [];
    renderPrompts();
    autoSaveConfig();
});
document.getElementById('generateAllBtn').addEventListener('click', generateAll);
document.getElementById('clearGalleryBtn').addEventListener('click', clearGallery);

document.getElementById('saveConfigBtn').addEventListener('click', downloadConfigJson);
document.getElementById('loadConfigBtn').addEventListener('click', () => {
    document.getElementById('configFileInput').click();
});
document.getElementById('configFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        loadConfigFromFile(file);
    }
});

// Eventos del modal
document.getElementById('modalCloseBtn').addEventListener('click', closeImageModal);
document.getElementById('imageModal').addEventListener('click', (e) => {
    if (e.target.id === 'imageModal') {
        closeImageModal();
    }
});

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('load', () => {
    connectWebSocket();
    loadConfigFromLocalStorage();
    if (prompts.length === 0) {
        addPrompt({
            prompt: 'Paisajes de San Juan, solarpunk style',
            steps: 20,
            sanJuanStrength: 1,
            solarStrength: 1,
            guidance: 3.5
        });
    }
});

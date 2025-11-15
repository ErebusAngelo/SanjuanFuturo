// Pantalla 3 - Oportunidades con Drag & Drop

// WebSocket y sistema de jugadores
let ws = null;
let playerId = null;
let numPlayers = 3; // Por defecto

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
    console.log('Jugador WebSocket conectado (pantalla3)');
    
    // Registrar como jugador en pantalla3
    ws.send(JSON.stringify({
      type: 'register',
      clientType: 'player',
      playerId: playerId,
      screen: 'pantalla3'
    }));
    
    // Notificar cambio de pantalla
    ws.send(JSON.stringify({
      type: 'player_screen_change',
      screen: 'pantalla3'
    }));
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Jugador recibió:', message);

    if (message.type === 'system_reset') {
      // Reiniciar la pantalla
      localStorage.removeItem('userName');
      window.location.href = `pantalla2.html?jugador=${playerId}`;
    } else if (message.type === 'system_config') {
      // Guardar configuración del sistema
      numPlayers = message.numPlayers;
      console.log(`Sistema configurado para ${numPlayers} jugador(es)`);
    } else if (message.type === 'return_to_start') {
      // Volver al inicio
      localStorage.removeItem('userName');
      window.location.href = `index.html?jugador=${playerId}`;
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

document.addEventListener("DOMContentLoaded", () => {
  // Obtener ID del jugador
  playerId = getPlayerId();
  console.log('Jugador ID:', playerId);
  
  // Conectar al WebSocket
  connectWebSocket();
  
  // Recuperar el nombre del usuario del localStorage
  const userName = localStorage.getItem("userName")
  const userNameElement = document.getElementById("userName")

  if (userName && userName.trim() !== "") {
    userNameElement.textContent = userName
  } else {
    userNameElement.textContent = "Usuario"
  }

  // Definición de categorías y opciones con arrays
  const categoriesData = [
    {
      id: "innovacion",
      name: "INNOVACIÓN Y TECNOLOGÍA",
      options: [
        "Inteligencia Artificial",
        "Robótica",
        "Transformación Digital",
        "Ciencia Aplicada",
        "Economía del Conocimiento",
        "Modernización tecnológica"
      ],
    },
    {
      id: "agricultura",
      name: "AGRICULTURA Y GANADERÍA",
      options: [
        "Riego Eficiente",
        "Buenas Prácticas Agrícolas",
        "Sanidad Vegetal y Animal",
        "Agroindustria (Valor Agregado)",
        "Sostenibilidad",
        "Producción Sustentable"
      ],
    },
    {
      id: "mineria",
      name: "MINERÍA, INDUSTRIA Y COMERCIO",
      options: [
        "Industria Limpia",
        "Parques Industriales",
        "Comercio Local y Digital",
        "PYMEs y Emprendedores",
        "Diseño y Calidad",
        "Defensa de los Derechos del Consumidor",
        "Exportación (San Juan al Mundo)",
        "Logística Moderna",
        "Sostenibilidad"
      ],
    },
    {
      id: "talento",
      name: "TALENTO Y OPORTUNIDADES",
      options: [
        "Nuevos Empleos",
        "Educacion y Desarrollo de Talento",
        "Aprender Trabajar y Producir",
        "Herramientas Financieras",
        "Inversiones Productivas",
        "Diversificación Productiva",
        "Desarrollo Económico",
        "Energías Renovables",
        "Turismo"
      ],
    },
  ]

  // Variables globales
  let currentCategoryIndex = 0
  const userSelections = {}

  // Generar HTML dinámicamente para botones con círculos
  function generateOptionHTML(optionName) {
    return `
      <div class="option-item" data-option="${optionName}">
        <div class="option-circle"></div>
        <span class="option-text">${optionName}</span>
      </div>
    `
  }

  function renderCategory(categoryIndex, isFirstLoad = false) {
    const filesContainer = document.getElementById("filesContainer")
    const category = categoriesData[categoryIndex]

    // Limpiar contenedor
    filesContainer.innerHTML = ""

    // Generar opciones dinámicamente
    const optionsHTML = category.options.map((option) => generateOptionHTML(option)).join("")

    // Agregar todo al contenedor (texto instructivo ANTES de las opciones)
    filesContainer.innerHTML = `
            <p class="drag-instruction">Arrastra 2 elementos al núcleo<br>que quieras sumar al San Juan del futuro</p>
            <div class="category-options active" data-category="${category.id}">
                ${optionsHTML}
            </div>
        `

    // Actualizar título con efecto de escritura (delay en primera carga)
    const titleDelay = isFirstLoad ? 1200 : 0
    typeTitle(category.name, titleDelay, category.id)

    initializeOptionSelection()
  }

  // Efecto de escritura para el título
  let typingTimeout
  function typeTitle(text, delay = 0, categoryId = "") {
    const titleElement = document.querySelector(".opportunities-text")
    titleElement.textContent = ""
    let charIndex = 0

    // Ajustar tamaño de fuente según categoría
    if (categoryId === "mineria") {
      titleElement.style.fontSize = "26px"
    } else {
      titleElement.style.fontSize = "30px"
    }

    // Cancelar animación anterior si existe
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    function typeNextChar() {
      if (charIndex < text.length) {
        titleElement.textContent = text.substring(0, charIndex + 1) + "_"
        charIndex++
        
        // Velocidad de tipeo MÁS LENTA (100-150ms por letra)
        const typingSpeed = Math.random() * 50 + 100
        typingTimeout = setTimeout(typeNextChar, typingSpeed)
      } else {
        // Quitar cursor al terminar
        titleElement.textContent = text
      }
    }

    // Iniciar con delay opcional
    setTimeout(typeNextChar, delay)
  }

  // Variables para drag de círculos
  let selectedOption = null
  let draggedCircle = null
  let touchStartX = 0
  let touchStartY = 0
  let isTouchDragging = false

  function initializeOptionSelection() {
    const optionItems = document.querySelectorAll(".option-item")
    console.log("🔧 Inicializando selección para", optionItems.length, "opciones")

    optionItems.forEach((option) => {
      // Mousedown/Touchstart para seleccionar Y comenzar drag inmediatamente
      option.addEventListener("mousedown", function(e) {
        e.preventDefault()
        
        // Deseleccionar otras opciones
        optionItems.forEach(opt => opt.classList.remove("selected"))
        
        // Seleccionar esta
        this.classList.add("selected")
        selectedOption = this
        console.log("✅ Opción seleccionada:", this.getAttribute("data-option"))
        
        // Iniciar drag inmediatamente
        startDragCircle(e.clientX, e.clientY, option)
      })

      option.addEventListener("touchstart", function(e) {
        e.preventDefault()
        const touch = e.touches[0]
        
        // Deseleccionar otras opciones
        optionItems.forEach(opt => opt.classList.remove("selected"))
        
        // Seleccionar esta
        this.classList.add("selected")
        selectedOption = this
        console.log("✅ Opción seleccionada:", this.getAttribute("data-option"))
        
        // Iniciar drag inmediatamente
        startDragCircle(touch.clientX, touch.clientY, option)
      }, { passive: false })
    })

    // Eventos globales para drag
    document.addEventListener("mousemove", handleDragMove)
    document.addEventListener("mouseup", handleDragEnd)
    document.addEventListener("touchmove", handleDragMove, { passive: false })
    document.addEventListener("touchend", handleDragEnd)
  }

  function startDragCircle(x, y, option) {
    console.log("🎯 Iniciando drag del círculo")
    
    // Crear círculo visual para arrastrar (celeste brillante)
    draggedCircle = document.createElement("div")
    draggedCircle.className = "dragged-circle"
    draggedCircle.style.transform = `translate(${x - 25}px, ${y - 25}px)`
    document.body.appendChild(draggedCircle)
    
    selectedOption = option
    isTouchDragging = true
  }

  function handleDragMove(e) {
    if (!draggedCircle || !isTouchDragging) return
    
    if (e.type === "touchmove") {
      e.preventDefault()
    }
    
    let x, y
    if (e.type === "touchmove") {
      x = e.touches[0].clientX
      y = e.touches[0].clientY
    } else {
      x = e.clientX
      y = e.clientY
    }
    
    // Usar transform en lugar de left/top para mejor rendimiento
    if (draggedCircle && draggedCircle.style) {
      requestAnimationFrame(() => {
        draggedCircle.style.transform = `translate(${x - 25}px, ${y - 25}px)`
      })
    }

    // Verificar overlap con dropzone
    const dropRect = dropZone.getBoundingClientRect()
    const isOver = x >= dropRect.left && 
                   x <= dropRect.right &&
                   y >= dropRect.top && 
                   y <= dropRect.bottom

    if (isOver && !dropZone.classList.contains("drag-over")) {
      dropZone.classList.add("drag-over")
    } else if (!isOver && dropZone.classList.contains("drag-over")) {
      dropZone.classList.remove("drag-over")
    }
  }

  function handleDragEnd(e) {
    if (!draggedCircle || !isTouchDragging) return
    
    let x, y
    if (e.type === "touchend") {
      x = e.changedTouches[0].clientX
      y = e.changedTouches[0].clientY
    } else {
      x = e.clientX
      y = e.clientY
    }
    
    const dropRect = dropZone.getBoundingClientRect()
    const isOver = x >= dropRect.left && 
                   x <= dropRect.right &&
                   y >= dropRect.top && 
                   y <= dropRect.bottom

    console.log("🏁 Drag end, isOver:", isOver)

    if (isOver && selectedOption) {
      const optionName = selectedOption.getAttribute("data-option")
      console.log("💧 DROP:", optionName)
      handleOptionDrop(optionName)
      
      // Agregar efecto de ripple en el shader si está habilitado
      if (typeof window.addShaderRipple === 'function') {
        window.addShaderRipple(x, y)
      }
    }

    // Limpiar
    if (draggedCircle) {
      draggedCircle.remove()
      draggedCircle = null
    }
    
    dropZone.classList.remove("drag-over")
    isTouchDragging = false
  }

  // Elementos del DOM
  const dropZone = document.getElementById("dropZone")
  const indicators = document.querySelectorAll(".indicator")

  // Renderizar primera categoría con delay para el efecto de typing
  renderCategory(0, true)

  // El drop zone ya está manejado por los eventos de mouse/touch globales

  // Configurar indicadores como clickeables
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      if (index <= currentCategoryIndex) {
        switchToCategory(index)
      }
    })
  })

  // Procesar el drop de una opción
  function handleOptionDrop(optionName) {
    const currentCategory = categoriesData[currentCategoryIndex]

    // Inicializar array si no existe
    if (!userSelections[currentCategory.id]) {
      userSelections[currentCategory.id] = []
    }

    // Guardar la selección
    if (!userSelections[currentCategory.id].includes(optionName)) {
      userSelections[currentCategory.id].push(optionName)
      console.log(`✨ Opción "${optionName}" agregada a categoría "${currentCategory.name}"`)
      console.log("📊 Selecciones actuales:", userSelections)

      // Guardar en localStorage
      localStorage.setItem("userSelections", JSON.stringify(userSelections))

      // Ocultar la opción que fue arrastrada
      const draggedOption = document.querySelector(`[data-option="${optionName}"]`)
      if (draggedOption) {
        console.log("🗑️ Ocultando opción...")
        draggedOption.style.transition = "opacity 0.3s"
        draggedOption.style.opacity = "0"
        setTimeout(() => {
          draggedOption.style.display = "none"
        }, 300)
      }

      // Verificar si se completaron las selecciones necesarias
      checkCategoryCompletion()
    } else {
      console.log("⚠️ Opción ya seleccionada")
    }
  }

  // Verificar si la categoría está completa
  function checkCategoryCompletion() {
    const currentCategory = categoriesData[currentCategoryIndex]
    const visibleOptions = document.querySelectorAll('.option-item:not([style*="display: none"])')

    // Si se han seleccionado al menos 2 opciones, deshabilitar drag y avanzar
    if (userSelections[currentCategory.id]?.length >= 2) {
      // Deshabilitar todas las opciones restantes para evitar un tercer drag
      const remainingOptions = document.querySelectorAll('.option-item:not([style*="display: none"])')
      remainingOptions.forEach(option => {
        option.style.pointerEvents = 'none'
        option.style.opacity = '0.5'
      })
      
      // Esperar un momento antes de cambiar de categoría
      setTimeout(() => {
        nextCategory()
      }, 1000)
    }
  }

  // Cambiar a la siguiente categoría
  function nextCategory() {
    if (currentCategoryIndex < categoriesData.length - 1) {
      currentCategoryIndex++
      switchToCategory(currentCategoryIndex)
    } else {
      // Todas las categorías completadas
      console.log("Todas las categorías completadas!")
      console.log("Selecciones finales:", userSelections)
      
      // Usar el mega algoritmo para generar imagen
      console.log("🎨 Iniciando generación con mega algoritmo...");
      
      // Crear instancia del mega generador
      if (typeof MegaPromptGenerator !== 'undefined') {
        const megaGenerator = new MegaPromptGenerator();
        
        // Generar prompt desde selecciones
        const promptData = megaGenerator.generateFromUserSelections(userSelections);
        
        console.log('✨ Prompt generado con mega algoritmo:', promptData);
        
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
      } else {
        console.error('❌ MegaPromptGenerator no disponible, usando método básico');
        
        // Fallback al método anterior
        const promptParts = [];
        for (const categoryId in userSelections) {
          const category = categoriesData.find(c => c.id === categoryId);
          if (category && userSelections[categoryId].length > 0) {
            promptParts.push(`${category.name}: ${userSelections[categoryId].join(', ')}`);
          }
        }
        
        const finalPrompt = promptParts.join('. ');
        console.log("Prompt básico generado:", finalPrompt);
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          const message = {
            type: 'generarImagen',
            prompt: finalPrompt,
            params: {
              seed: Math.floor(Math.random() * 1000000),
              steps: 20,
              width: 1024,
              height: 1024,
              model: 'flux1-dev-fp8.safetensors'
            }
          };
          ws.send(JSON.stringify(message));
        }
      }
      
      // Mostrar mensaje de finalización
      const waitMessage = "Tu imagen se está generando...";
      const filesContainer = document.getElementById('filesContainer');
      if (filesContainer) {
        filesContainer.innerHTML = `
          <div style="text-align: center; padding: 50px; color: #00D4FF;">
            <h2 style="font-size: 2rem; margin-bottom: 20px;">¡Gracias por tu participación!</h2>
            <p style="font-size: 1.5rem; opacity: 0.8;">${waitMessage}</p>
            <div style="margin-top: 30px;">
              <div class="loading-dots">
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </div>
            </div>
          </div>
        `;
      }
    }
  }

  // Cambiar a una categoría específica
  function switchToCategory(index) {
    currentCategoryIndex = index

    // LIMPIAR TODOS LOS CÍRCULOS ARRASTRADOS ANTES DE CAMBIAR
    const draggedCircles = document.querySelectorAll('.dragged-circle');
    draggedCircles.forEach(circle => circle.remove());
    
    // Resetear estado de drag
    draggedCircle = null;

    // Renderizar la nueva categoría
    renderCategory(index)

    // Actualizar indicadores
    indicators.forEach((indicator, i) => {
      if (i === index) {
        indicator.classList.add("active")
      } else {
        indicator.classList.remove("active")
      }
    })

    console.log(`Cambiado a categoría: ${categoriesData[index].name}`)
  }

  console.log("Pantalla 3 cargada. Usuario:", userName || "No definido")
  console.log("Sistema de categorías inicializado")
})

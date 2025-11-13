// Pantalla 3 - Oportunidades con Drag & Drop

document.addEventListener("DOMContentLoaded", () => {
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
    requestAnimationFrame(() => {
      draggedCircle.style.transform = `translate(${x - 25}px, ${y - 25}px)`
    })

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

    // Si se han seleccionado al menos 2 opciones, avanzar
    if (userSelections[currentCategory.id]?.length >= 2) {
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
    }
  }

  // Cambiar a una categoría específica
  function switchToCategory(index) {
    currentCategoryIndex = index

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

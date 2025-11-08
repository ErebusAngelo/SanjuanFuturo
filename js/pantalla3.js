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

  // Definición de categorías y archivos con arrays
  const categoriesData = [
    {
      id: "innovacion",
      name: "INNOVACIÓN",
      files: ["Inteligencia Artificial", "Robótica", "Startups", "Ciencia Aplicada"],
    },
    {
      id: "tierra-viva",
      name: "TIERRA VIVA",
      files: ["Riego Eficiente", "Cuidado del Agua", "Agroindustria", "Sostenibilidad"],
    },
    {
      id: "fuerza-productiva",
      name: "FUERZA PRODUCTIVA",
      files: ["Industria Limpia", "Exportación", "Diseño y Calidad", "Logística Moderna"],
    },
    {
      id: "oportunidades",
      name: "OPORTUNIDADES",
      files: ["Nuevos Empleos", "Capacitación", "Economía del Conocimiento", "Inversiones"],
    },
  ]

  // Variables globales
  let currentCategoryIndex = 0
  const userSelections = {}

  // Generar HTML dinámicamente
  function generateFileHTML(fileName) {
    const words = fileName.split(" ")
    
    let textElements = ""
    let fontSize = 16
    
    // Ajustar tamaño de fuente según longitud
    if (fileName.length > 20) {
      fontSize = 14
    } else if (fileName.length > 15) {
      fontSize = 15
    }
    
    if (words.length > 1) {
      // Texto en 2 líneas
      const midpoint = Math.ceil(words.length / 2)
      const line1 = words.slice(0, midpoint).join(" ")
      const line2 = words.slice(midpoint).join(" ")
      textElements = `
                <text class="file-text" x="115" y="210" text-anchor="middle" fill="#00D4FF" font-family="Arkitech, sans-serif" font-size="${fontSize}">${line1}</text>
                <text class="file-text" x="115" y="${210 + fontSize + 8}" text-anchor="middle" fill="#00D4FF" font-family="Arkitech, sans-serif" font-size="${fontSize}">${line2}</text>
            `
    } else {
      // Texto en 1 línea
      textElements = `
                <text class="file-text" x="115" y="220" text-anchor="middle" fill="#00D4FF" font-family="Arkitech, sans-serif" font-size="${fontSize}">${fileName}</text>
            `
    }

    return `
            <div class="file-item" draggable="true" data-file="${fileName}">
                <svg width="230" height="260" viewBox="0 0 230 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path class="file-bg" d="M10 0L200 0L220 20V260H10V0Z" stroke="#00D4FF" stroke-width="2" fill="rgba(0, 0, 0, 0.3)"/>
                    <path class="file-corner" d="M200 0L200 20H220" stroke="#00D4FF" stroke-width="2" fill="transparent"/>
                    <line class="file-icon" x1="115" y1="70" x2="115" y2="120" stroke="#00D4FF" stroke-width="5"/>
                    <line class="file-icon" x1="90" y1="95" x2="140" y2="95" stroke="#00D4FF" stroke-width="5"/>
                    ${textElements}
                </svg>
            </div>
        `
  }

  function renderCategory(categoryIndex, isFirstLoad = false) {
    const filesContainer = document.getElementById("filesContainer")
    const category = categoriesData[categoryIndex]

    // Limpiar contenedor
    filesContainer.innerHTML = ""

    // Generar archivos dinámicamente
    const filesHTML = category.files.map((file) => generateFileHTML(file)).join("")

    // Agregar todo al contenedor
    filesContainer.innerHTML = `
            <div class="category-files active" data-category="${category.id}">
                ${filesHTML}
            </div>
            <p class="drag-instruction">Arrastra al núcleo del futuro lo que quieras sumar</p>
        `

    // Actualizar título con efecto de escritura (delay en primera carga)
    const titleDelay = isFirstLoad ? 1200 : 0
    typeTitle(category.name, titleDelay)

    initializeDragAndDrop()
  }

  // Efecto de escritura para el título
  let typingTimeout
  function typeTitle(text, delay = 0) {
    const titleElement = document.querySelector(".opportunities-text")
    titleElement.textContent = ""
    let charIndex = 0

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

  // Variables para touch
  let touchStartX = 0
  let touchStartY = 0
  let touchedElement = null
  let touchGhost = null
  let isTouchDragging = false

  function initializeDragAndDrop() {
    const fileItems = document.querySelectorAll(".file-item")
    console.log("🔧 Inicializando DRAG + TOUCH para", fileItems.length, "archivos")

    fileItems.forEach((file) => {
      // DRAG NATIVO para mouse
      file.setAttribute("draggable", "true")
      file.style.cursor = "grab"

      file.ondragstart = function(e) {
        console.log("🖱️ DRAG START (mouse):", this.getAttribute("data-file"))
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", this.getAttribute("data-file"))
        this.style.opacity = "0.8"
        this.classList.add("dragging")
      }

      file.ondragend = function(e) {
        console.log("🏁 DRAG END (mouse)")
        this.style.opacity = "1"
        this.classList.remove("dragging")
      }

      // TOUCH para móvil/emulación
      file.addEventListener("touchstart", handleTouchStart, { passive: false })
      file.addEventListener("touchmove", handleTouchMove, { passive: false })
      file.addEventListener("touchend", handleTouchEnd, { passive: false })
    })
  }

  function handleTouchStart(e) {
    e.preventDefault()
    touchedElement = e.currentTarget
    const touch = e.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    isTouchDragging = false
    
    console.log("👆 TOUCH START:", touchedElement.getAttribute("data-file"))
    touchedElement.style.opacity = "0.8"
    touchedElement.classList.add("dragging")
  }

  function handleTouchMove(e) {
    if (!touchedElement) return
    e.preventDefault()

    const touch = e.touches[0]
    
    if (!isTouchDragging) {
      isTouchDragging = true
      console.log("📱 TOUCH DRAG iniciado")
      
      // Crear ghost (con clase dragging para estilo azul)
      touchGhost = touchedElement.cloneNode(true)
      touchGhost.classList.add("dragging")
      touchGhost.style.position = "fixed"
      touchGhost.style.pointerEvents = "none"
      touchGhost.style.opacity = "0.8"
      touchGhost.style.zIndex = "10000"
      touchGhost.style.width = touchedElement.offsetWidth + "px"
      document.body.appendChild(touchGhost)
    }

    // Mover ghost
    if (touchGhost) {
      touchGhost.style.left = (touch.clientX - touchGhost.offsetWidth / 2) + "px"
      touchGhost.style.top = (touch.clientY - touchGhost.offsetHeight / 2) + "px"
    }

    // Verificar overlap con dropzone
    const dropRect = dropZone.getBoundingClientRect()
    const isOver = touch.clientX >= dropRect.left && 
                   touch.clientX <= dropRect.right &&
                   touch.clientY >= dropRect.top && 
                   touch.clientY <= dropRect.bottom

    if (isOver && !dropZone.classList.contains("drag-over")) {
      dropZone.classList.add("drag-over")
      console.log("💫 Sobre la esfera (touch)")
    } else if (!isOver && dropZone.classList.contains("drag-over")) {
      dropZone.classList.remove("drag-over")
    }
  }

  function handleTouchEnd(e) {
    if (!touchedElement) return
    e.preventDefault()

    const touch = e.changedTouches[0]
    const dropRect = dropZone.getBoundingClientRect()
    const isOver = touch.clientX >= dropRect.left && 
                   touch.clientX <= dropRect.right &&
                   touch.clientY >= dropRect.top && 
                   touch.clientY <= dropRect.bottom

    console.log("🏁 TOUCH END")

    if (isTouchDragging && isOver) {
      const fileName = touchedElement.getAttribute("data-file")
      console.log("💧 DROP (touch):", fileName)
      handleFileDrop(fileName)
    }

    // Limpiar
    if (touchGhost) {
      touchGhost.remove()
      touchGhost = null
    }
    
    touchedElement.style.opacity = "1"
    touchedElement.classList.remove("dragging")
    dropZone.classList.remove("drag-over")
    touchedElement = null
    isTouchDragging = false
  }

  // Elementos del DOM
  const dropZone = document.getElementById("dropZone")
  const indicators = document.querySelectorAll(".indicator")

  // Renderizar primera categoría con delay para el efecto de typing
  renderCategory(0, true)

  // Configurar DROP ZONE
  dropZone.ondragover = function(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    this.classList.add("drag-over")
    return false
  }

  dropZone.ondragleave = function(e) {
    this.classList.remove("drag-over")
  }

  dropZone.ondrop = function(e) {
    e.preventDefault()
    this.classList.remove("drag-over")
    
    const fileName = e.dataTransfer.getData("text/plain")
    console.log("💧 DROP:", fileName)
    
    if (fileName) {
      handleFileDrop(fileName)
    }
    
    return false
  }

  // Configurar indicadores como clickeables
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      if (index <= currentCategoryIndex) {
        switchToCategory(index)
      }
    })
  })

  // Procesar el drop de un archivo
  function handleFileDrop(fileName) {
    const currentCategory = categoriesData[currentCategoryIndex]

    // Inicializar array si no existe
    if (!userSelections[currentCategory.id]) {
      userSelections[currentCategory.id] = []
    }

    // Guardar la selección
    if (!userSelections[currentCategory.id].includes(fileName)) {
      userSelections[currentCategory.id].push(fileName)
      console.log(`✨ Archivo "${fileName}" agregado a categoría "${currentCategory.name}"`)
      console.log("📊 Selecciones actuales:", userSelections)

      // Guardar en localStorage
      localStorage.setItem("userSelections", JSON.stringify(userSelections))

      // Ocultar el archivo que fue arrastrado
      const draggedFile = document.querySelector(`[data-file="${fileName}"]`)
      if (draggedFile) {
        console.log("🗑️ Ocultando archivo...")
        draggedFile.style.transition = "opacity 0.3s"
        draggedFile.style.opacity = "0"
        setTimeout(() => {
          draggedFile.style.display = "none"
        }, 300)
      }

      // Verificar si todos los archivos fueron seleccionados
      checkCategoryCompletion()
    } else {
      console.log("⚠️ Archivo ya seleccionado")
    }
  }

  // Verificar si la categoría está completa
  function checkCategoryCompletion() {
    const currentCategory = categoriesData[currentCategoryIndex]
    const visibleFiles = document.querySelectorAll('.file-item:not([style*="display: none"])')

    // Si ya no hay archivos visibles o se han seleccionado al menos 1, avanzar
    if (visibleFiles.length === 0 || userSelections[currentCategory.id]?.length >= 1) {
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

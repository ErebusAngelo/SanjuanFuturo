// Array de deseos con iconos emoji
const deseos = [
    { icon: "🌱", texto: "Un San Juan más verde y sostenible" },
    { icon: "⚡", texto: "Energía limpia para todos" },
    { icon: "🏙️", texto: "Ciudades inteligentes y conectadas" },
    { icon: "🎓", texto: "Educación de calidad y accesible" },
    { icon: "💡", texto: "Innovación y tecnología al servicio de la gente" },
    { icon: "🚀", texto: "Oportunidades para los jóvenes" },
    { icon: "🌍", texto: "Cuidado del medio ambiente" },
    { icon: "🤝", texto: "Comunidad unida y solidaria" },
    { icon: "🏥", texto: "Salud y bienestar para todos" },
    { icon: "🎨", texto: "Cultura y arte en cada rincón" },
    { icon: "🔬", texto: "Ciencia y desarrollo tecnológico" },
    { icon: "♻️", texto: "Economía circular y sustentable" }
];

// Estado de la aplicación
let selectedWishIndex = null;
let userName = "Usuario";

// Inicializar la pantalla
document.addEventListener('DOMContentLoaded', () => {
    // Obtener el nombre del usuario desde localStorage
    const storedName = localStorage.getItem('userName');
    if (storedName) {
        userName = storedName;
        document.getElementById('userName').textContent = userName;
    }
    
    // Renderizar las fichas de deseos
    renderWishes();
    
    // Configurar el botón de confirmación
    const confirmButton = document.getElementById('confirmButton');
    confirmButton.addEventListener('click', handleConfirm);
});

// Renderizar el grid de fichas
function renderWishes() {
    const grid = document.getElementById('wishesGrid');
    grid.innerHTML = '';
    
    deseos.forEach((deseo, index) => {
        const card = document.createElement('div');
        card.className = 'wish-card';
        card.dataset.index = index;
        
        // Icono
        const icon = document.createElement('div');
        icon.className = 'wish-icon';
        icon.textContent = deseo.icon;
        
        // Texto del deseo
        const text = document.createElement('div');
        text.className = 'wish-text';
        text.textContent = deseo.texto;
        
        card.appendChild(icon);
        card.appendChild(text);
        
        // Event listener para selección
        card.addEventListener('click', () => selectWish(index));
        
        grid.appendChild(card);
    });
}

// Seleccionar un deseo
function selectWish(index) {
    const grid = document.getElementById('wishesGrid');
    
    // Remover selección anterior
    const allCards = document.querySelectorAll('.wish-card');
    allCards.forEach(card => card.classList.remove('selected'));
    
    // Seleccionar la nueva ficha
    const selectedCard = document.querySelector(`[data-index="${index}"]`);
    selectedCard.classList.add('selected');
    
    // Agregar clase al grid para atenuar las no seleccionadas
    grid.classList.add('has-selection');
    
    // Actualizar el estado
    selectedWishIndex = index;
    
    // Habilitar el botón de confirmación
    const confirmButton = document.getElementById('confirmButton');
    confirmButton.disabled = false;
    
    console.log('Deseo seleccionado:', deseos[index].texto);
}

// Manejar la confirmación
async function handleConfirm() {
    if (selectedWishIndex === null) {
        console.warn('No hay deseo seleccionado');
        return;
    }
    
    const deseoSeleccionado = deseos[selectedWishIndex];
    
    // Crear el objeto de resultado
    const resultado = {
        nombre: userName,
        deseo: deseoSeleccionado.texto,
        icon: deseoSeleccionado.icon,
        timestamp: new Date().toISOString()
    };
    
    console.log('=== ENVIANDO DESEO ===');
    console.log(resultado);
    
    try {
        // Enviar al servidor
        const response = await fetch('/api/deseos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resultado)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✓ Deseo guardado:', data);
            
            // Redirigir a la pantalla de visualización
            window.location.href = 'visualizacion-mensajes.html';
        } else {
            console.error('Error al guardar deseo');
            alert('Hubo un error al guardar tu deseo. Intenta nuevamente.');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Error de conexión con el servidor.');
    }
}

// Debug: Función para limpiar deseos (útil para testing)
async function limpiarDeseos() {
    try {
        const response = await fetch('/api/deseos', { method: 'DELETE' });
        if (response.ok) {
            console.log('✓ Deseos limpiados del servidor');
        }
    } catch (error) {
        console.error('Error al limpiar deseos:', error);
    }
}

// Exponer función de limpieza en consola para debugging
window.limpiarDeseos = limpiarDeseos;
